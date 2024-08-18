import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField
} from '@mui/material';
import { useFormik } from 'formik';
import SubCard from '../../../../ui-component/cards/SubCard';
import { LoadingButton } from '@mui/lab';
import { IconLoader, IconPlus } from '@tabler/icons-react';
import Uploader from 'rsuite/Uploader';
import { API } from '../../../../utils/api';
import Cascader from 'rsuite/Cascader';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import OptionsApi from '../EditOptions/OptionsApi';
import { getOpenaiMsg, removeEmpty, showError, showInfo } from '../../../../utils/common';
import { compressImage, handleIdentify, getFileName } from '../../../../utils/image-processing';
import { MODEL } from '../../../../utils/preset';
import { useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { ImageUrl } from '../../../../utils/api';
import { AvailabilityType, CardinalityEnum, ConditionEnum, ListingTypeEnum, ModeEnum } from '../../../../constants/Ebay';
import _ from 'lodash';
import { CheckTreePicker, MultiCascader } from 'rsuite';
import { validate } from '@babel/core/lib/config/validation/options';
import '@wangeditor/editor/dist/css/style.css'; // 引入 css
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';

const btnType = {
  save: 'save',
  publish: 'publish'
};

const validationSchema = Yup.object().shape({
  siteId: Yup.string().required('站点不能为空'),
  categoryId: Yup.string().required('刊登类目为必填'),
  product: Yup.object().shape({
    title: Yup.string().required('商品标题不能为空'),
    description: Yup.string().required('商品描述不能为空')
  }),
  listingPolicies: Yup.object().shape({
    paymentPolicyId: Yup.string().required('支付政策为必填'),
    returnPolicyId: Yup.string().required('退货政策为必填'),
    fulfillmentPolicyId: Yup.string().required('发货政策为必填')
  }),
  merchantLocationKey: Yup.string().required('物品所在地政策为必填'),
  listingDuration: Yup.string().when('format', {
    is: (format) => format === ListingTypeEnum.AUCTION,
    then: Yup.string().required('拍卖时长为必填')
  }),
  pricingSummary: Yup.object().when('format', {
    is: (format) => format === ListingTypeEnum.AUCTION,
    then: Yup.object().shape({
      auctionStartPrice: Yup.object().shape({
        value: Yup.string().required('价格为必填')
      })
    }),
    otherwise: Yup.object().shape({
      price: Yup.object().shape({
        value: Yup.string().required('价格为必填')
      })
    })
  }),
  sku: Yup.string().required('SKU为必填'),
  format: Yup.string().required('刊登类型为必填'),
});

const originInputs = {
  is_edit: false,
  siteId: '', //站点
  ebayId: '', //ebay账号
  categoryId: '', //刊登类目
  childTitle: '', //子标题
  condition: '', //物品状况
  conditionDescription: '', // 物品状况描述
  conditionDescriptors: [],
  display_name: '',
  categories: '',
  format: ListingTypeEnum.FIXED_PRICE, //刊登类型
  locale: '',
  marketplaceId: '',
  product: {
    title: '',
    subtitle: '',
    imageUrls: [],
    sku: '',
    aspects: {},
    description: ''
  },
  storeCategoryNames: [],
  self_sku: '',
  sku: '',
  listingPolicies: {
    paymentPolicyId: '',
    returnPolicyId: '',
    fulfillmentPolicyId: ''
  },
  merchantLocationKey: '',
  pricingSummary: {
    price: {
      currency: 'USD',
      value: 0.01
    },
    auctionStartPrice: {
      currency: 'USD',
      value: 0.01
    }
  },
  // availableQuantity: 1 ,
  listingDuration: '',
  availability: {
    shipToLocationAvailability: {
      quantity: 1,
      availabilityType: AvailabilityType.IN_STOCK
    }
  }
};

const EditEbayGoods = ({ setOpen, open, goodsId }) => {
  const ebayProduct = useRef(originInputs);

  const handleClose = () => {
    setOpen(false);
  };

  const theme = useTheme();
  const navigate = useNavigate();
  const {
    fetchSitesOption,
    fetchTypeOption,
    fetchCategoryOption,
    fetchEbayAccountOption,
    fetchPrompt,
    fetchStoreCategories,
    fetchConditionOption,
    fetchAspectsForCategory,
    fetchDefaultCategoryTreeId,
    fetchPaymentPolicy,
    fetchReturnPolicy,
    fetchFulfillmentPolicy,
    fetchInventoryLocation,
    fetchListingDuration
  } = OptionsApi();

  const [editor, setEditor] = useState(null);
  const [html, setHtml] = useState('<p>hello</p>');
  // 工具栏配置
  const toolbarConfig = {}; // JS 语法

  // 编辑器配置
  const editorConfig = {
    // JS 语法
    placeholder: '请输入内容...'
  };

  // 及时销毁 editor ，重要！
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  const [sitesOptions, setSitesOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [condition, setCondition] = useState(null);

  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const [accountList, setAccountList] = useState([]);

  const [storeCategories, setStoreCategories] = useState([]);

  const [prompt, setPrompt] = useState('');

  const [synthesisButtonLoading, setSynthesisButtonLoading] = useState(false);

  const [storeCategoryLoading, setStoreCategoryLoading] = useState(false);

  const [defaultCategoryTreeId, setDefaultCategoryTreeId] = useState('');

  const [itemAspectsForCategoryOptions, setItemAspectsForCategoryOptions] = useState([]);

  const [paymentPolicyOptions, setPaymentPolicyOptions] = useState([]);
  const [paymentPolicyLoading, setPaymentPolicyLoading] = useState(false);
  const [returnPolicyOptions, setReturnPolicyOptions] = useState([]);
  const [returnPolicyLoading, setReturnPolicyLoading] = useState(false);
  const [fulfillmentPolicyOptions, setFulfillmentPolicyOptions] = useState([]);
  const [fulfillmentPolicyLoading, setFulfillmentPolicyLoading] = useState(false);
  const [inventoryLocationOptions, setInventoryLocationOptions] = useState([]);
  const [inventoryLocationLoading, setInventoryLocationLoading] = useState(false);

  const [listingDurationOptions, setListingDurationOptions] = useState([]);
  const [listingDurationLoading, setListingDurationLoading] = useState(false);

  const formik = useFormik({
    initialValues: originInputs,
    validationSchema: validationSchema,
    onSubmit: async (values, formikHelpers) => {
      const { btnType, ...restValues } = values;
      let url = '';
      if (btnType === 'save') {
        url = '/api/ebay_save_goods';
      } else {
        url = '/api/ebay_publish_goods';
      }

      try {
        const reqData = removeEmpty(restValues);
        if (reqData.format === ListingTypeEnum.FIXED_PRICE) {
          delete reqData.pricingSummary.auctionStartPrice;
        }
        if (reqData.product) {
          reqData.product = removeEmpty(reqData.product);
        }
        const res = await API.post(url, removeEmpty(restValues));
        const { success, message } = res.data;
        if (success) {
          showInfo('保存成功');
        } else {
          showError(message);
        }
      } catch (e) {
        showError(e.message);
      }
    }
  });

  const getDefaultToken = () => {
    return API.get('/api/token/default').then((res) => {
      const { success, data, message } = res.data;
      if (success) {
        localStorage.setItem('openai_token', data.key);
      } else {
        showError(message);
      }
    });
  };

  const fetchGoodsDetail = async () => {
    try {
      let res = await API.get('/api/ebay_get_goods_detail?id=' + goodsId);
      const { success, message, data } = res.data;
      if (success) {
        if (data) {
          data.product = data.product || originInputs.product;
          if (!data.product.imageUrls || data.product.imageUrls.length === 0) {
            data.product.imageUrls = [];
            data.product.imageUrls[0] = ImageUrl + data.front_oss_image;
            data.product.imageUrls[1] = ImageUrl + data.back_oss_image;
          }
          if (!data.product.title) {
            data.product.title = data.title;
          }
          ebayProduct.current = { ...originInputs, ...data };
          await formik.setValues(ebayProduct.current);
          fetchOptions().then();
        }
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchOptions = async () => {
    fetchPrompt().then((res) => {
      setPrompt(res);
    });

    fetchTypeOption().then((res) => {
      setTypeOptions(res);
    });
    await getSiteOptions();

    await getEbayAccountOptions();

    getEbayAllOptions().then();
  };

  const previewFile = (file, index) => {
    // 使用上传接口上传图片

    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressImaged = await compressImage(reader.result, ((400 * 1028) / 3) * 4);
      console.log(compressImaged);
      // base64转file文件对象
      const blob = await fetch(compressImaged).then((res) => res.blob());
      const compressFiled = new File([blob], getFileName(file.name) + '.webp', { type: 'image/webp' });
      const formData = new FormData();
      formData.append('file', compressFiled);
      API.post('/api/upload', formData).then((res) => {
        console.log(res);
        const { success, data, message } = res.data;
        if (success) {
          let newImgList = [...formik.values.product.imageUrls];
          newImgList[index] = ImageUrl + data.file_path;
          formik.setFieldValue('product.imageUrls', newImgList);
        } else {
          showError(message);
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const identify = async () => {
    setSynthesisButtonLoading(true);
    try {
      if (formik.values.product.imageUrls && formik.values.product.imageUrls.length === 0) {
        showError('请先上传两张主图');
        return;
      }
      if (!formik.values.product.imageUrls[0]) {
        showError('请上传第一张图');
        return;
      }
      if (!formik.values.product.imageUrls[1]) {
        showError('请上传第二张图');
        return;
      }
      // compositeDiagrams
      const { url } = await handleIdentify(formik.values.product.imageUrls);
      const openai_token = localStorage.getItem('openai_token');
      if (!openai_token) {
        await getDefaultToken();
      }
      const front_base_64_image = await compressImage(formik.values.product.imageUrls[0], ((300 * 1028) / 3) * 4);
      const back_base_64_image = await compressImage(formik.values.product.imageUrls[1], ((300 * 1028) / 3) * 4);
      MODEL.STARCARD.context[0].content[1].image_url.url = url;
      MODEL.STARCARD.context[0].content[0].text = prompt;
      const { data } = await getOpenaiMsg(
        {
          ...MODEL.STARCARD.modelConfig,
          messages: MODEL.STARCARD.context,
          front_base_64_image: front_base_64_image,
          back_base_64_image: back_base_64_image
        },
        {
          Authorization: 'Bearer ' + localStorage.getItem('openai_token')
        }
      );
      await formik.setFieldValue('product.title', data.choices[0].message.content);
    } catch (err) {
      console.log(err);
    } finally {
      setSynthesisButtonLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      getDefaultToken();
      fetchGoodsDetail().then();
    }
  }, [open]);

  const getSiteOptions = async () => {
    try {
      const sites = await fetchSitesOption();
      setSitesOptions(sites);
      if (sites && sites.length > 0) {
        if (!formik.values.siteId) {
          let defaultSite = sites.find((site) => site.isDefault === 1);
          if (!defaultSite) {
            defaultSite = sites[0];
          }
          ebayProduct.current.siteId = defaultSite.siteId;
          ebayProduct.current.locale = defaultSite.marketplaceId;
          ebayProduct.current.marketplaceId = defaultSite.marketplaceId;
          await formik.setFieldValue('siteId', defaultSite.siteId);
          await formik.setFieldValue('locale', defaultSite.marketplaceId);
          await formik.setFieldValue('marketplaceId', defaultSite.marketplaceId);
          localStorage.setItem('globalId', defaultSite.globalId);
        }
      }
    } catch (e) {}
  };

  const getEbayAccountOptions = async () => {
    try {
      let accounts = await fetchEbayAccountOption();
      setAccountList(accounts);
      if (!formik.values.ebayId) {
        if (accounts[0]) {
          ebayProduct.current.ebayId = accounts[0].id;
          await formik.setFieldValue('ebayId', accounts[0].id);
          localStorage.setItem('ebayId', accounts[0].id);
        } else {
          showInfo('请添加先ebay账号');
          // await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } catch (e) {}
  };

  const getEbayAllOptions = async () => {
    try {
      const defaultCategoryTreeIdRes = await getDefaultCategoryTreeId();
      if (defaultCategoryTreeIdRes) {
        getCategoryOptions({ categoryTreeId: defaultCategoryTreeIdRes }).then(() => {});
        getConditionOption({
          marketplaceId: ebayProduct.current.marketplaceId,
          categoryId: ebayProduct.current.categoryId
        }).then();
        getAspectsForCategory({ defaultCategoryTreeIdRes, categoryId: ebayProduct.current.categoryId }).then();

        getStoreCategories().then();

        getPaymentPolicy().then();

        getReturnPolicy().then();

        getFulfillmentPolicy().then();

        getInventoryLocation().then();

        getListingDuration().then();
      }
    } catch (e) {}
  };

  const getDefaultCategoryTreeId = async () => {
    try {
      const defaultCategoryTreeIdRes = await fetchDefaultCategoryTreeId();
      setDefaultCategoryTreeId(defaultCategoryTreeIdRes);
      return defaultCategoryTreeIdRes;
    } catch (e) {}
  };

  const getCategoryOptions = async ({ categoryTreeId = 0 }) => {
    try {
      setCategoryLoading(true);
      const categories = await fetchCategoryOption({
        marketplace_id: formik.values.marketplaceId,
        categoryTreeId
      });
      setCategoryOptions(categories);
    } finally {
      setCategoryLoading(false);
    }
  };

  const getConditionOption = async ({ marketplaceId, categoryId }) => {
    if (!categoryId) {
      return;
    }
    const res = await fetchConditionOption({
      marketplace_id: marketplaceId,
      category_ids: [categoryId]
    });
    if (res?.itemConditionPolicies?.length > 0) {
      setCondition(res.itemConditionPolicies[0]);
    }
  };

  const formatAspect = (aspects) => {
    if(aspects.length > 0){
      // aspectRequired排序放前面
      aspects.sort((a, b) => {
        return a.aspectRequired ? -1 : 1;
      })
    }
    for (let i = 0; i < aspects.length; i++) {
      let aspect = aspects[i];
      let { aspectValues } = aspect;
      if (aspectValues) {
        for (let j = 0; j < aspectValues.length; j++) {
          let aspectValue = aspect.aspectValues[j];
          let { localizedValue, valueConstraints } = aspectValue;
          if (valueConstraints) {
            for (let k = 0; k < valueConstraints.length; k++) {
              const valueConstraint = valueConstraints[k];
              let { applicableForLocalizedAspectName } = valueConstraint || {};
              const findItem = aspects.find((item) => item.localizedAspectName === applicableForLocalizedAspectName);
              if (findItem) {
                if (!findItem.valueConstraints) {
                  findItem.valueConstraints = [];
                }
                findItem.valueConstraints.push(aspect.localizedAspectName);
                findItem.valueConstraints = [...new Set(findItem.valueConstraints)];
              }
            }
          }
        }
      }
    }
  };
  const getAspectsForCategory = async ({ defaultCategoryTreeId, categoryId }) => {
    try {
      if (!categoryId) {
        return;
      }
      const { aspects } = await fetchAspectsForCategory({
        category_tree_id: defaultCategoryTreeId || 0,
        category_id: categoryId
      });
      formatAspect(aspects);
      setItemAspectsForCategoryOptions(aspects);
    } catch (error) {}
  };

  const isAspectValueDisabled = (valueConstraints) => {
    const aspects = formik.values.product.aspects;
    for (let key in valueConstraints) {
      const { applicableForLocalizedAspectName: aspectName, applicableForLocalizedAspectValues: aspectValues } = valueConstraints[key];
      const value = aspects[aspectName];
      // 交集
      if (_.intersection(value, aspectValues).length === 0) {
        return true;
      }
    }
    return false;
  };

  const getStoreCategories = async () => {
    try {
      setStoreCategoryLoading(true);
      const { storeCategories } = await fetchStoreCategories();
      setStoreCategories(storeCategories);
    } finally {
      setStoreCategoryLoading(false);
    }
  };

  // 级联获取路径, item为最后一级的值
  const getPath = (item, list) => {
    let path = [];
    const find = (list) => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].categoryName === item) {
          path.push(list[i].categoryName);
          return true;
        }
        if (list[i].childrenCategories) {
          path.push(list[i].categoryName);
          if (find(list[i].childrenCategories)) {
            return true;
          } else {
            path.pop();
          }
        }
      }
    };
    find(list);
    return path;
  };

  const getPaymentPolicy = async () => {
    try {
      setPaymentPolicyLoading(true);
      const { paymentPolicies } = await fetchPaymentPolicy();
      setPaymentPolicyOptions(paymentPolicies);
    } finally {
      setPaymentPolicyLoading(false);
    }
  };

  const getReturnPolicy = async () => {
    try {
      setReturnPolicyLoading(true);
      const { returnPolicies } = await fetchReturnPolicy();
      setReturnPolicyOptions(returnPolicies);
    } finally {
      setReturnPolicyLoading(false);
    }
  };

  const getFulfillmentPolicy = async () => {
    setFulfillmentPolicyLoading(true);

    try {
      const { fulfillmentPolicies } = await fetchFulfillmentPolicy();
      setFulfillmentPolicyOptions(fulfillmentPolicies);
    } finally {
      setFulfillmentPolicyLoading(false);
    }
  };

  const getInventoryLocation = async () => {
    setInventoryLocationLoading(true);

    try {
      const { locations } = await fetchInventoryLocation();
      setInventoryLocationOptions(locations);
    } finally {
      setInventoryLocationLoading(false);
    }
  };

  const getListingDuration = async () => {
    setListingDurationLoading(true);

    try {
      const data = await fetchListingDuration();
      setListingDurationOptions(data);
    } finally {
      setListingDurationLoading(false);
    }
  };

  const resetForm = async () => {
    await formik.setFieldValue('categoryId', '');
    await formik.setFieldValue('condition', '');
    await formik.setFieldValue('conditionDescriptors', []);
    await formik.setFieldValue('categories', '');
    await formik.setFieldValue('product.aspects', {});
    await formik.setFieldValue('storeCategoryNames', {});
    await formik.setFieldValue('listingPolicies', {
      paymentPolicyId: '',
      returnPolicyId: '',
      fulfillmentPolicyId: ''
    });
    await formik.setFieldValue('merchantLocationKey', '');
  };

  // 刊登类型为拍卖, 库存为1
  useEffect(() => {
    if (formik.values.format === ListingTypeEnum.AUCTION) {
      formik.setFieldValue('availability.shipToLocationAvailability.quantity', 1);
    }
  }, [formik.values.format]);

  return (
    <>
      <Dialog maxWidth="lg" open={open} onClose={handleClose}>
        <DialogTitle>编辑商品</DialogTitle>
        <DialogContent>
          <form noValidate onSubmit={formik.handleSubmit}>
            <Stack spacing={3}>
              <SubCard title="基础信息">
                <Stack direction="column" justifyContent="flex-start" alignItems="flex-start" spacing={{ xs: 1, sm: 2, md: 4 }}>
                  {/*站点*/}
                  <FormControl
                    style={{ minWidth: 300 }}
                    error={Boolean(formik.touched.siteId && formik.errors.siteId)}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <InputLabel htmlFor="channel-sites-label">站点</InputLabel>
                    <Select
                      id="channel-sites-label"
                      label="站点"
                      value={formik.values.siteId}
                      name="siteId"
                      onBlur={formik.handleBlur}
                      onChange={async (e) => {
                        localStorage.setItem('globalId', e.target.value);
                        const site = sitesOptions.find((site) => site.siteId === e.target.value);
                        await formik.setFieldValue('locale', site.marketplaceId);
                        await formik.setFieldValue('marketplaceId', site.marketplaceId);
                        formik.handleChange(e);

                        resetForm();

                        getEbayAllOptions().then();
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 200
                          }
                        }
                      }}
                    >
                      {sitesOptions.map((option) => {
                        return (
                          <MenuItem key={option.id} value={option.siteId}>
                            {option.name}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {formik.touched.siteId && formik.errors.siteId && (
                      <FormHelperText error id="helper-tex-channel-sites-label">
                        {formik.errors.siteId}
                      </FormHelperText>
                    )}
                  </FormControl>

                  <FormControl
                    style={{ minWidth: 300 }}
                    error={Boolean(formik.touched.ebayId && formik.errors.ebayId)}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <InputLabel htmlFor="channel-ebayId-label">eBay账号</InputLabel>
                    <Select
                      id="channel-ebayId-label"
                      label="eBay账号"
                      value={formik.values.ebayId}
                      name="ebayId"
                      onBlur={formik.handleBlur}
                      onChange={async (e) => {
                        localStorage.setItem('ebayId', e.target.value);
                        formik.handleChange(e);

                        resetForm();
                        getEbayAllOptions().then();
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 200
                          }
                        }
                      }}
                    >
                      {accountList.map((option) => {
                        return (
                          <MenuItem key={option.id} value={option.id}>
                            {option.username}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {formik.touched.ebayId && formik.errors.ebayId && (
                      <FormHelperText error id="helper-tex-channel-ebayId-label">
                        {formik.errors.ebayId}
                      </FormHelperText>
                    )}
                  </FormControl>
                  {/* 店铺分类 */}
                  <FormControl
                    style={{ minWidth: 300 }}
                    error={Boolean(formik.touched.storeCategoryNames && formik.errors.storeCategoryNames)}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <FormLabel htmlFor="channel-category-label" style={{ marginBottom: '10px' }}>
                      店铺分类
                    </FormLabel>
                    <Cascader
                      appearance="default"
                      size="lg"
                      loading={storeCategoryLoading}
                      popupStyle={{ zIndex: 9999 }}
                      preventOverflow={true}
                      labelKey={'categoryName'}
                      valueKey={'categoryName'}
                      childrenKey={'childrenCategories'}
                      data={storeCategories}
                      style={{ width: 300 }}
                      placeholder={formik.values.storeCategoryNames ? formik.values.storeCategoryNames[0] : '请选择'}
                      onChange={(value, e) => {
                        if (value) {
                          formik.setFieldValue('storeCategoryNames.0', '/' + getPath(value, storeCategories).join('/'));
                        } else {
                          formik.setFieldValue('storeCategoryNames', '');
                        }
                      }}
                    />
                    {formik.errors.storeCategoryNames && (
                      <FormHelperText error id="helper-tex-channel-category-label">
                        {formik.errors.storeCategoryNames}
                      </FormHelperText>
                    )}
                  </FormControl>
                  {/*标题*/}
                  <FormControl
                    error={Boolean(formik.touched.product?.title && formik.errors?.product?.title)}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <Stack direction="row" spacing={5} alignItems="center">
                      <Stack>
                        <InputLabel htmlFor="channel-title-label">商品标题</InputLabel>
                        <OutlinedInput
                          id="channel-title-label"
                          style={{ width: '650px' }}
                          label="商品标题"
                          type="text"
                          value={formik.values.product.title}
                          name="product.title"
                          onBlur={formik.handleBlur}
                          onChange={formik.handleChange}
                          aria-describedby="helper-text-channel-title-label"
                        />
                        <FormHelperText id="helper-text-channel-title-label">
                          {formik.touched.product?.title && formik.errors.product?.title}
                        </FormHelperText>
                      </Stack>
                      <LoadingButton loading={synthesisButtonLoading} variant="outlined" startIcon={<IconLoader />} onClick={identify}>
                        识别
                      </LoadingButton>
                    </Stack>
                    {formik.touched.title && formik.errors.title && (
                      <FormHelperText error id="helper-tex-channel-title-label">
                        {formik.errors.title}
                      </FormHelperText>
                    )}
                  </FormControl>
                  {/*主图*/}
                  <FormControl
                    style={{ minWidth: 500 }}
                    error={Boolean(formik.touched.image && formik.errors.image)}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <FormLabel htmlFor="channel-image-label">主图</FormLabel>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <Uploader
                        listType="picture"
                        action=""
                        fileListVisible={false}
                        onUpload={(file) => {
                          previewFile(file.blobFile, 0);
                        }}
                      >
                        <Box style={{ width: '200px', height: '300px' }}>
                          {formik.values.product.imageUrls[0] ? (
                            <img alt="第一张" style={{ width: '200px', height: '300px' }} src={formik.values.product.imageUrls[0]} />
                          ) : (
                            <IconPlus></IconPlus>
                          )}
                        </Box>
                      </Uploader>

                      <Uploader
                        listType="picture"
                        action=""
                        fileListVisible={false}
                        onUpload={(file) => {
                          previewFile(file.blobFile, 1);
                        }}
                      >
                        <Box style={{ width: '200px', height: '300px' }}>
                          {formik.values.product.imageUrls[1] ? (
                            <img alt="第二张" style={{ width: '200px', height: '300px' }} src={formik.values.product.imageUrls[1]} />
                          ) : (
                            <IconPlus></IconPlus>
                          )}
                        </Box>
                      </Uploader>
                    </Stack>
                  </FormControl>
                  <FormControl
                    style={{ minWidth: 300 }}
                    error={Boolean(formik.touched.product?.subtitle && formik.errors.product?.subtitle)}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <InputLabel htmlFor="channel-title-label">子标题</InputLabel>
                    <OutlinedInput
                      id="channel-childTitle-label"
                      label="子标题"
                      type="text"
                      value={formik.values.product.subtitle || ''}
                      name="product.subtitle"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      inputProps={{ autoComplete: 'subtitle' }}
                      aria-describedby="helper-text-channel-childTitle-label"
                    />
                    {formik.touched.product?.subtitle && formik.errors.product?.subtitle && (
                      <FormHelperText error id="helper-tex-channel-childTitle-label">
                        {formik.errors.product?.subtitle}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <FormControl
                    style={{ minWidth: 300 }}
                    error={Boolean(formik.touched?.format && formik.errors?.format)}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <FormLabel htmlFor="channel-type-label">刊登类型</FormLabel>
                    <RadioGroup
                      row
                      id="channel-type-label"
                      name="format"
                      value={formik.values.format}
                      onChange={(e) => {
                        const value = e.target.value;
                        formik.setFieldValue('format', e.target.value);
                        if (value === ListingTypeEnum.AUCTION) {
                          formik.setFieldValue('pricingSummary.auctionStartPrice', {
                            value: 0,
                            currency: 'USD'
                          });
                        }
                        formik.setFieldTouched('format', true, false);
                        formik.setFieldError('format', value ? undefined : '请选择刊登类型');
                      }}
                    >
                      {typeOptions.map((option) => {
                        return <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />;
                      })}
                    </RadioGroup>
                    <FormHelperText id="helper-text-channel-title-label">{formik.touched.format && formik.errors.format}</FormHelperText>
                  </FormControl>
                  {formik.values.format === ListingTypeEnum.AUCTION ? (
                    <Stack direction="row" spacing={2}>
                      <FormControl
                        style={{ minWidth: 300 }}
                        error={Boolean(
                          formik.touched.pricingSummary?.auctionStartPrice?.value && formik.errors.pricingSummary?.auctionStartPrice?.value
                        )}
                        sx={{ ...theme.typography.otherInput }}
                      >
                        <InputLabel htmlFor="channel-auctionStartPrice-label">起拍价</InputLabel>
                        <OutlinedInput
                          id="channel-auctionStartPrice-label"
                          label="起拍价"
                          type="number"
                          value={formik.values?.pricingSummary?.auctionStartPrice?.value || ''}
                          name="pricingSummary.auctionStartPrice.value"
                          onBlur={formik.handleBlur}
                          onChange={formik.handleChange}
                          inputProps={{ autoComplete: 'auctionStartPrice' }}
                          aria-describedby="helper-text-channel-auctionStartPrice-label"
                        />
                        {formik.touched.pricingSummary?.auctionStartPrice?.value &&
                          formik.errors.pricingSummary?.auctionStartPrice?.value && (
                            <FormHelperText error id="helper-tex-channel-auctionStartPrice-label">
                              {formik.errors.pricingSummary?.auctionStartPrice?.value}
                            </FormHelperText>
                          )}
                      </FormControl>
                      <FormControl
                        style={{ minWidth: 300 }}
                        error={Boolean(formik.touched.listingDuration && formik.errors.listingDuration)}
                        sx={{ ...theme.typography.otherInput }}
                      >
                        <InputLabel htmlFor="channel-listingDuration-label">拍卖时间</InputLabel>
                        <Select
                          id="channel-listingDuration-label"
                          label="拍卖时间"
                          value={formik.values.listingDuration}
                          name="listingDuration"
                          onBlur={formik.handleBlur}
                          onChange={formik.handleChange}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 200
                              }
                            }
                          }}
                        >
                          {listingDurationOptions.map((option) => {
                            return (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        {formik.touched.listingDuration && formik.errors.listingDuration && (
                          <FormHelperText error id="helper-tex-channel-listingDuration-label">
                            {formik.errors.listingDuration}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Stack>
                  ) : null}

                  {/*价格*/}
                  <FormControl
                    style={{ minWidth: 300 }}
                    error={Boolean(formik.touched.pricingSummary?.price?.value && formik.errors.pricingSummary?.price?.value)}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <InputLabel htmlFor="channel-price-label">价格</InputLabel>
                    <OutlinedInput
                      id="channel-price-label"
                      label="价格"
                      type="number"
                      value={formik.values.pricingSummary?.price?.value}
                      name="pricingSummary.price.value"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      inputProps={{ autoComplete: 'price' }}
                      aria-describedby="helper-text-channel-price-label"
                    />
                    {formik.touched.pricingSummary?.price?.value && formik.errors.pricingSummary?.price?.value && (
                      <FormHelperText error id="helper-tex-channel-price-label">
                        {formik.errors.pricingSummary?.price?.value}
                      </FormHelperText>
                    )}
                  </FormControl>
                  {/*销售库存*/}
                  <FormControl
                    style={{ minWidth: 300 }}
                    error={Boolean(
                      formik.touched.availability?.shipToLocationAvailability?.quantity &&
                        formik.errors?.availability?.shipToLocationAvailability.quantity
                    )}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <InputLabel htmlFor="channel-availableQuantity-label">销售库存</InputLabel>
                    <OutlinedInput
                      id="channel-availableQuantity-label"
                      label="销售库存"
                      type="number"
                      value={formik.values.availability?.shipToLocationAvailability?.quantity || ''}
                      name="availability.shipToLocationAvailability.quantity"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      inputProps={{ autoComplete: 'availableQuantity' }}
                      aria-describedby="helper-text-channel-availableQuantity-label"
                      readOnly={formik.values.format === ListingTypeEnum.AUCTION}
                    />
                    {formik.touched.availability?.shipToLocationAvailability?.quantity &&
                      formik.errors.availability?.shipToLocationAvailability?.quantity && (
                        <FormHelperText error id="helper-tex-channel-availableQuantity-label">
                          {formik.errors.availability?.shipToLocationAvailability?.quantity}
                        </FormHelperText>
                      )}
                  </FormControl>

                  <FormControl
                    style={{ minWidth: 300 }}
                    error={Boolean(formik.touched.categoryId && formik.errors.categoryId)}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <FormLabel htmlFor="channel-category-label" style={{ marginBottom: '10px' }}>
                      刊登类目
                    </FormLabel>
                    <Cascader
                      name="categoryId"
                      popupStyle={{ zIndex: 9999 }}
                      preventOverflow={true}
                      data={categoryOptions}
                      searchable={true}
                      appearance="default"
                      placeholder="刊登类目选择"
                      size="lg"
                      loading={categoryLoading}
                      value={formik.values.categoryId}
                      onChange={async (value) => {
                        await formik.setFieldValue('categoryId', value || '');
                        getConditionOption({ categoryId: value, marketplaceId: formik.values.marketplaceId }).then();
                        getAspectsForCategory({ defaultCategoryTreeId, categoryId: value }).then();
                        await formik.setFieldValue('condition', '');
                        await formik.setFieldValue('conditionDescriptors', []);
                      }}
                    ></Cascader>
                    {formik.errors.categoryId && (
                      <FormHelperText error id="helper-tex-channel-category-label">
                        {formik.errors.categoryId}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3} sm={4}>
                      <FormControl
                        style={{ width: '100%' }}
                        error={Boolean(formik.touched.condition && formik.errors.condition && condition?.itemConditionRequired)}
                        sx={{ ...theme.typography.otherInput }}
                      >
                        <InputLabel htmlFor="channel-condition-label">物品状况</InputLabel>
                        <Select
                          id="channel-condition-label"
                          label="物品状况"
                          value={formik.values.condition}
                          name="condition"
                          onBlur={formik.handleBlur}
                          onChange={formik.handleChange}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 200
                              }
                            }
                          }}
                        >
                          {condition?.itemConditions?.map((option) => {
                            return (
                              <MenuItem key={option.conditionId} value={ConditionEnum[option.conditionId]}>
                                {option.conditionDescription}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        {formik.touched.condition &&
                          formik.errors.condition &&
                          condition?.itemConditionRequired(
                            <FormHelperText error id="helper-tex-channel-condition-label">
                              {formik.errors.condition}
                            </FormHelperText>
                          )}
                      </FormControl>
                    </Grid>
                    {condition?.itemConditions &&
                      condition?.itemConditions
                        ?.find((item) => formik.values.condition && ConditionEnum[item.conditionId] === formik.values.condition)
                        ?.conditionDescriptors?.map((conditionDescriptor, conditionDescriptorIndex) => {
                          return (
                            <Grid key={conditionDescriptorIndex} item xs={3} sm={4}>
                              {conditionDescriptor.conditionDescriptorConstraint.mode === ModeEnum.FREE_TEXT ? (
                                <FormControl
                                  // error={Boolean(formik.touched.product?.subtitle && formik.errors.product?.subtitle)}
                                  fullWidth={true}
                                  sx={{ ...theme.typography.otherInput }}
                                >
                                  <InputLabel htmlFor="channel-title-label">{conditionDescriptor.conditionDescriptorHelpText}</InputLabel>
                                  <OutlinedInput
                                    id="channel-childTitle-label"
                                    label={conditionDescriptor.conditionDescriptorName}
                                    type="text"
                                    value={formik.values.conditionDescriptors[conditionDescriptorIndex]?.additionalInfo}
                                    name={`conditionDescriptors.${conditionDescriptorIndex}.additionalInfo`}
                                    onChange={(e) => {
                                      formik.setFieldValue(
                                        `conditionDescriptors.${conditionDescriptorIndex}.additionalInfo`,
                                        e.target.value
                                      );
                                      formik.setFieldValue(
                                        `conditionDescriptors.${conditionDescriptorIndex}.name`,
                                        conditionDescriptor.conditionDescriptorId
                                      );
                                    }}
                                    aria-describedby={`helper-text-label-${conditionDescriptorIndex}`}
                                  />
                                </FormControl>
                              ) : (
                                <FormControl fullWidth={true}>
                                  <InputLabel id="demo-multiple-checkbox-label">{conditionDescriptor.conditionDescriptorName}</InputLabel>
                                  <Select
                                    labelId="demo-multiple-checkbox-label"
                                    id="demo-multiple-checkbox"
                                    multiple={true}
                                    value={formik.values.conditionDescriptors[conditionDescriptorIndex]?.values || []}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (
                                        conditionDescriptor.conditionDescriptorConstraint?.applicableToConditionDescriptorIds &&
                                        conditionDescriptor.conditionDescriptorConstraint.applicableToConditionDescriptorIds.length > 0
                                      ) {
                                        const conditionDescriptorValueConstraints =
                                          conditionDescriptor.conditionDescriptorValues.find((item) =>
                                            value.includes(item.conditionDescriptorValueId)
                                          )?.conditionDescriptorValueConstraints || [];
                                        for (let i = 0; i < conditionDescriptorValueConstraints.length; i++) {
                                          const { applicableToConditionDescriptorId, applicableToConditionDescriptorValueIds } =
                                            conditionDescriptorValueConstraints[i];
                                          if (
                                            _.intersection(
                                              applicableToConditionDescriptorValueIds,
                                              formik.values.conditionDescriptors?.find(
                                                (item) => item.name === applicableToConditionDescriptorId
                                              )?.values || []
                                            ).length === 0
                                          ) {
                                            showError(`不符合选中条件`);
                                            return;
                                          }
                                          formik.setFieldValue(`conditionDescriptors.${conditionDescriptorIndex}.values`, []);
                                        }
                                      }
                                      if (conditionDescriptor.conditionDescriptorConstraint.cardinality === CardinalityEnum.SINGLE) {
                                        formik.setFieldValue(
                                          `conditionDescriptors.${conditionDescriptorIndex}.values`,
                                          [e.target.value.pop()].filter((item) => item)
                                        );
                                      } else {
                                        formik.setFieldValue(`conditionDescriptors.${conditionDescriptorIndex}.values`, e.target.value);
                                      }
                                      formik.setFieldValue(
                                        `conditionDescriptors.${conditionDescriptorIndex}.name`,
                                        conditionDescriptor.conditionDescriptorId
                                      );
                                    }}
                                    input={<OutlinedInput label={conditionDescriptor.conditionDescriptorName} />}
                                  >
                                    {conditionDescriptor.conditionDescriptorValues?.map(
                                      ({ conditionDescriptorValueName: name, conditionDescriptorValueId: id }) => (
                                        <MenuItem key={id} value={id}>
                                          <ListItemText primary={name} />
                                        </MenuItem>
                                      )
                                    )}
                                  </Select>
                                </FormControl>
                              )}
                            </Grid>
                          );
                        })}
                  </Grid>
                  {/*物品状况描述*/}
                  <FormControl sx={{ ...theme.typography.otherInput }}>
                    <InputLabel htmlFor="channel-title-label">物品状况描述</InputLabel>
                    <OutlinedInput
                      id="channel-title-label"
                      style={{ width: '650px' }}
                      label="物品状况描述"
                      type="text"
                      value={formik.values.conditionDescription}
                      name="conditionDescription"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      aria-describedby="helper-text-conditionDescription-label"
                    />
                    {formik.touched.title && formik.errors.title && (
                      <FormHelperText error id="helper-tex-channel-title-label">
                        {formik.errors.title}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <FormControl sx={{ ...theme.typography.otherInput }}>
                    <InputLabel htmlFor="channel-title-label">库存sku</InputLabel>
                    <OutlinedInput
                      id="channel-title-label"
                      style={{ width: '650px' }}
                      label="库存sku"
                      type="text"
                      value={formik.values.self_sku}
                      name="self_sku"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      aria-describedby="helper-text-conditionDescription-label"
                      readOnly={true}
                    />
                  </FormControl>
                  <FormControl sx={{ ...theme.typography.otherInput }} error={Boolean(formik.touched.sku && formik.errors.sku)}>
                    <InputLabel htmlFor="channel-title-label">ebay sku</InputLabel>
                    <OutlinedInput
                      id="channel-title-label"
                      style={{ width: '650px' }}
                      label="ebay sku"
                      type="text"
                      value={formik.values.sku}
                      name="sku"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      aria-describedby="helper-text-conditionDescription-label"
                    />
                    {formik.touched.sku && formik.errors.sku && (
                      <FormHelperText error id="helper-tex-channel-title-label">
                        {formik.errors.sku}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Stack>
              </SubCard>
              <SubCard title="类目属性">
                <Stack direction="column" justifyContent="flex-start" alignItems="flex-start" spacing={{ xs: 1, sm: 2, md: 4 }}>
                  {itemAspectsForCategoryOptions.map((item) => {
                    return (
                      <FormControl
                        style={{ minWidth: 300 }}
                        sx={{ ...theme.typography.otherInput }}
                        key={item.localizedAspectName}
                        error={Boolean(item.aspectConstraint.aspectRequired)}
                        required={Boolean(item.aspectConstraint.aspectRequired)}
                      >
                        {Boolean(item.aspectConstraint.aspectRequired) ? <span style={{ color: 'red',paddingBottom:'5px' }}>*必选项</span> : ''}
                        {item.aspectConstraint.aspectMode === ModeEnum.SELECTION_ONLY ? (
                          <>
                            <InputLabel id="demo-multiple-checkbox-label">{item.localizedAspectName}</InputLabel>
                            <Select
                              labelId="demo-multiple-checkbox-label"
                              id="demo-multiple-checkbox"
                              multiple
                              value={formik.values.product['aspects'][item.localizedAspectName] || []}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length > 0) {
                                  if (item.aspectConstraint.itemToAspectCardinality === CardinalityEnum.SINGLE) {
                                    formik.setFieldValue(
                                      `product.aspects.${item.localizedAspectName}`,
                                      [e.target.value.pop()].filter((item) => item)
                                    );
                                  } else {
                                    formik.setFieldValue(`product.aspects.${item.localizedAspectName}`, value);
                                  }
                                  const aspect = itemAspectsForCategoryOptions.find(
                                    (aspect) => item.localizedAspectName === aspect.localizedAspectName
                                  );
                                  const { valueConstraints } = aspect;
                                  if (valueConstraints && valueConstraints.length > 0) {
                                    for (let i = 0; i < valueConstraints.length; i++) {
                                      formik.setFieldValue(`product.aspects.${valueConstraints[i]}`, '');
                                    }
                                  }
                                }
                              }}
                              input={<OutlinedInput label={item.localizedAspectName} />}
                            >
                              {item.aspectValues
                                ?.filter((item) => {
                                  return !isAspectValueDisabled(item.valueConstraints);
                                })
                                ?.map(({ localizedValue: name }) => (
                                  <MenuItem key={name} value={name}>
                                    <ListItemText primary={name} />
                                  </MenuItem>
                                ))}
                            </Select>
                          </>
                        ) : item.aspectValues == null || item.aspectValues.length === 0 ? (
                          <>
                            <InputLabel htmlFor="channel-title-label">{item.localizedAspectName}</InputLabel>
                            <OutlinedInput
                              id="channel-title-label"
                              style={{ minWidth: 300 }}
                              label={item.localizedAspectName}
                              type="text"
                              value={
                                formik.values.product.aspects[item.localizedAspectName]
                                  ? formik.values.product.aspects[item.localizedAspectName][0]
                                  : ''
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value) {
                                  formik.setFieldValue(`product.aspects.${item.localizedAspectName}`, [value]);
                                }
                              }}
                              aria-describedby="helper-text-conditionDescription-label"
                            />
                          </>
                        ) : (
                          <>
                            <Autocomplete
                              multiple
                              value={formik.values.product.aspects[item.localizedAspectName] || []}
                              onChange={(event, params) => {
                                const inputValue = params.map((item) => {
                                  if (typeof item === 'string') {
                                    return item;
                                  }
                                  // Add "xxx" option created dynamically
                                  if (item.inputValue) {
                                    return item.inputValue;
                                  }
                                  // Regular option
                                  return item.localizedValue;
                                });
                                if (item.aspectConstraint.itemToAspectCardinality === CardinalityEnum.SINGLE) {
                                  formik.setFieldValue(
                                    `product.aspects.${item.localizedAspectName}`,
                                    [inputValue.pop()].filter((item) => item)
                                  );
                                } else {
                                  formik.setFieldValue(`product.aspects.${item.localizedAspectName}`, inputValue);
                                }
                              }}
                              getOptionDisabled={(option) => {
                                const findItem = item.aspectValues.find(
                                  (aspectValue) => aspectValue.localizedValue === option.localizedValue
                                );
                                if (findItem) {
                                  return isAspectValueDisabled(findItem.valueConstraints);
                                }
                                return false;
                              }}
                              filterOptions={(options, params) => {
                                const { inputValue } = params;

                                const filtered = _.filter(options, (item) => {
                                  return item.localizedValue.includes(inputValue);
                                });
                                // Suggest the creation of a new value
                                const isExisting = options.some((option) => inputValue === option.localizedValue);
                                if (inputValue !== '' && !isExisting) {
                                  filtered.push({
                                    inputValue,
                                    localizedValue: `Add "${inputValue}"`
                                  });
                                }
                                return filtered;
                              }}
                              selectOnFocus
                              clearOnBlur
                              handleHomeEndKeys
                              id="free-solo-with-text-demo"
                              options={item.aspectValues || []}
                              getOptionLabel={(option) => {
                                // Value selected with enter, right from the input
                                if (typeof option === 'string') {
                                  return option;
                                }
                                // Add "xxx" option created dynamically
                                if (option.inputValue) {
                                  return option.inputValue;
                                }
                                // Regular option
                                return option.localizedValue;
                              }}
                              renderOption={(props, option) => {
                                const { key, ...optionProps } = props;
                                return (
                                  <li key={key} {...optionProps}>
                                    {option.localizedValue}
                                  </li>
                                );
                              }}
                              sx={{ width: 300 }}
                              freeSolo
                              renderInput={(params) => <TextField {...params} label={item.localizedAspectName} />}
                            />
                          </>
                        )}
                        {/*{formik.touched.product?.aspects[item.localizedAspectName] &&*/}
                        {/*  formik.errors.product?.aspects[item.localizedAspectName] && (*/}
                        {/*    <FormHelperText error id="helper-tex-channel-sites-label">*/}
                        {/*      {formik.errors.product?.aspects[item.localizedAspectName]}*/}
                        {/*    </FormHelperText>*/}
                        {/*  )}*/}
                      </FormControl>
                    );
                  })}
                  <div>商品描述</div>
                  <FormControl sx={{ ...theme.typography.otherInput }} error={Boolean(!formik.product?.description)}>
                    <div style={{ border: '1px solid #ccc', zIndex: 100 }}>
                      <Toolbar editor={editor} defaultConfig={toolbarConfig} mode="default" style={{ borderBottom: '1px solid #ccc' }} />
                      <Editor
                        defaultConfig={editorConfig}
                        value={formik.values.product.description || ''}
                        onCreated={setEditor}
                        onChange={(editor) => {
                          formik.validateField('product.description');
                          let html = editor.getHtml();
                          if (html === '<p><br></p>') {
                            html = '';
                          }
                          setHtml(html);
                          formik.setFieldValue('product.description', html);
                          formik.setFieldTouched('product.description', true, false);
                          formik.setFieldError('product.description', html.length > 0 ? undefined : '商品描述不能为空');
                        }}
                        name="product.description"
                        mode="default"
                        style={{ height: '400px', overflowY: 'hidden' }}
                      />
                    </div>
                    <FormHelperText id="helper-text-channel-title-label">
                      {formik.touched.product?.description && formik.errors.product?.description}
                    </FormHelperText>
                  </FormControl>
                </Stack>
              </SubCard>
              <SubCard title="政策信息">
                <Stack direction="column" justifyContent="flex-start" alignItems="flex-start" spacing={{ xs: 1, sm: 2, md: 4 }}>
                  <FormControl style={{ minWidth: 300 }} sx={{ ...theme.typography.otherInput }}>
                    <Autocomplete
                      value={formik.values.listingPolicies.paymentPolicyId}
                      options={paymentPolicyOptions}
                      loading={paymentPolicyLoading}
                      renderOption={(props, option) => {
                        console.log(option);
                        console.log(props);
                        return <li {...props}>{option.name}</li>;
                      }}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') {
                          return paymentPolicyOptions.find((item) => item.paymentPolicyId === option)?.name || '';
                        } else if (option.name) {
                          return option.name;
                        }
                        return '';
                      }}
                      onChange={(e, value) => {
                        if (value) {
                          formik.setFieldValue('listingPolicies.paymentPolicyId', value.paymentPolicyId);
                        } else {
                          formik.setFieldValue('listingPolicies.paymentPolicyId', '');
                        }
                        formik.setFieldTouched('listingPolicies.paymentPolicyId', true, false);
                      }}
                      onClose={(e, value) => {
                        formik.setFieldTouched('listingPolicies.paymentPolicyId', true, false);
                      }}
                      renderInput={(params) => (
                        <TextField
                          error={Boolean(formik.touched.listingPolicies?.paymentPolicyId && formik.errors.listingPolicies?.paymentPolicyId)}
                          {...params}
                          label="支付政策"
                        />
                      )}
                    />
                    {formik.touched.listingPolicies?.paymentPolicyId && formik.errors.listingPolicies?.paymentPolicyId && (
                      <FormHelperText error id="helper-tex-channel-paymentPolicyId-label">
                        {formik.errors.listingPolicies?.paymentPolicyId}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <FormControl style={{ minWidth: 300 }} sx={{ ...theme.typography.otherInput }}>
                    <Autocomplete
                      value={formik.values.listingPolicies.returnPolicyId}
                      options={returnPolicyOptions}
                      loading={returnPolicyLoading}
                      renderOption={(props, option) => {
                        return <li {...props}>{option.name}</li>;
                      }}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') {
                          return returnPolicyOptions.find((item) => item.returnPolicyId === option)?.name || '';
                        } else if (option.name) {
                          return option.name;
                        }
                        return '';
                      }}
                      onChange={(e, value) => {
                        if (value) {
                          formik.setFieldValue('listingPolicies.returnPolicyId', value.returnPolicyId);
                        } else {
                          formik.setFieldValue('listingPolicies.returnPolicyId', '');
                        }
                        formik.setFieldTouched('listingPolicies.returnPolicyId', true, false);
                      }}
                      onClose={(e, value) => {
                        formik.setFieldTouched('listingPolicies.returnPolicyId', true, false);
                      }}
                      renderInput={(params) => (
                        <TextField
                          error={Boolean(formik.touched.listingPolicies?.returnPolicyId && formik.errors.listingPolicies?.returnPolicyId)}
                          {...params}
                          label="退货政策"
                        />
                      )}
                    />
                    {formik.touched.listingPolicies?.returnPolicyId && formik.errors.listingPolicies?.returnPolicyId && (
                      <FormHelperText error id="helper-tex-channel-returnPolicyId-label">
                        {formik.errors.listingPolicies?.returnPolicyId}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <FormControl style={{ minWidth: 300 }} sx={{ ...theme.typography.otherInput }}>
                    <Autocomplete
                      value={formik.values.listingPolicies.fulfillmentPolicyId}
                      options={fulfillmentPolicyOptions}
                      loading={fulfillmentPolicyLoading}
                      renderOption={(props, option) => {
                        return <li {...props}>{option.name}</li>;
                      }}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') {
                          return fulfillmentPolicyOptions.find((item) => item.fulfillmentPolicyId === option)?.name || '';
                        } else if (option.name) {
                          return option.name;
                        }
                        return '';
                      }}
                      onChange={(e, value) => {
                        if (value) {
                          formik.setFieldValue('listingPolicies.fulfillmentPolicyId', value.fulfillmentPolicyId);
                        } else {
                          formik.setFieldValue('listingPolicies.fulfillmentPolicyId', '');
                        }
                        formik.setFieldTouched('listingPolicies.fulfillmentPolicyId', true, false);
                      }}
                      onClose={(e, value) => {
                        formik.setFieldTouched('listingPolicies.fulfillmentPolicyId', true, false);
                      }}
                      renderInput={(params) => (
                        <TextField
                          error={Boolean(
                            formik.touched.listingPolicies?.fulfillmentPolicyId && formik.errors.listingPolicies?.fulfillmentPolicyId
                          )}
                          {...params}
                          label="发货政策"
                        />
                      )}
                    />
                    {formik.touched.listingPolicies?.fulfillmentPolicyId && formik.errors.listingPolicies?.fulfillmentPolicyId && (
                      <FormHelperText error id="helper-tex-channel-fulfillmentPolicyId-label">
                        {formik.errors.listingPolicies?.fulfillmentPolicyId}
                      </FormHelperText>
                    )}
                  </FormControl>
                  <FormControl style={{ minWidth: 300 }} sx={{ ...theme.typography.otherInput }}>
                    <Autocomplete
                      value={formik.values.merchantLocationKey}
                      options={inventoryLocationOptions}
                      loading={inventoryLocationLoading}
                      renderOption={(props, option) => {
                        return <li {...props}>{option.name}</li>;
                      }}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') {
                          return inventoryLocationOptions.find((item) => item.merchantLocationKey === option)?.name || '';
                        } else if (option.name) {
                          return option.name;
                        }
                        return '';
                      }}
                      onChange={(e, value) => {
                        if (value) {
                          formik.setFieldValue('merchantLocationKey', value.merchantLocationKey);
                        } else {
                          formik.setFieldValue('merchantLocationKey', '');
                        }
                        formik.setFieldTouched('merchantLocationKey', true, false);
                      }}
                      onClose={(e, value) => {
                        formik.setFieldTouched('merchantLocationKey', true, false);
                      }}
                      renderInput={(params) => (
                        <TextField
                          error={Boolean(formik.touched.merchantLocationKey && formik.errors.merchantLocationKey)}
                          {...params}
                          label="物品所在地政策"
                        />
                      )}
                    />
                    {formik.touched.merchantLocationKey && formik.errors.merchantLocationKey && (
                      <FormHelperText error id="helper-tex-channel-merchantLocationKey-label">
                        {formik.errors.merchantLocationKey}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Stack>
              </SubCard>
            </Stack>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button
            type="submit"
            onClick={(e) => {
              formik.setFieldValue('btnType', btnType.save);
              formik.handleSubmit(e);
            }}
          >
            保存
          </Button>
          <Button
            type="submit"
            onClick={() => {
              formik.setFieldValue('btnType', btnType.publish);
              formik.handleSubmit();
            }}
          >
            刊登
          </Button>
        </DialogActions>
        ;
      </Dialog>
    </>
  );
};

export default EditEbayGoods;
