import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
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
import { Field, useFormik } from 'formik';
import SubCard from '../../../../ui-component/cards/SubCard';
import { LoadingButton } from '@mui/lab';
import { IconLoader, IconPlus } from '@tabler/icons-react';
import Uploader from 'rsuite/Uploader';
import { API, setEbayAccountId } from '../../../../utils/api';
import Cascader from 'rsuite/Cascader';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import OptionsApi from '../EditOptions/OptionsApi';
import { getOpenaiMsg, showError, showInfo } from '../../../../utils/common';
import { compressImage, handleIdentify } from '../../../../utils/image-processing';
import { MODEL } from '../../../../utils/preset';
import { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { ImageUrl } from '../../../../utils/api';
import { CardinalityEnum, ConditionEnum, ModeEnum } from '../../../../constants/Ebay';
import _ from 'lodash';
import { CheckTreePicker, MultiCascader } from 'rsuite';
import { validate } from '@babel/core/lib/config/validation/options';

const validationSchema = Yup.object().shape({
  siteId: Yup.string().required('站点不能为空'),
  categoryId: Yup.string().required('刊登类目为必填'),
  product: Yup.object().shape({
    title: Yup.string().required('商品标题不能为空')
  })
});

const validateAspect = (value) => {
  // value是数组, 且长度大于0
  if (value && value.length > 0) {
    return true;
  }
  return false;
}

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
  format: '',
  locale: '',
  marketplaceId: 'EBAY_US',
  product: {
    title: '',
    subtitle: '',
    imageUrls: [],
    sku: '',
    locale: '',
    availableQuantity: 0,
    aspects: {}
  },
  self_sku: ''
};

const EditEbayGoods = ({ setOpen, open, goodsId }) => {
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
    fetchPromp,
    fetchStoreCategories,
    fetchConditionOption,
    fetchAspectsForCategory,
    fetchDefaultCategoryTreeId
  } = OptionsApi();

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

  const formik = useFormik({
    initialValues: originInputs,
    validationSchema: validationSchema,
    onSubmit: (values) => {
      console.log(values);
    }
  });
  const fetchGoodsDetail = async () => {
    try {
      let res = await API.get('/api/ebay_get_goods_detail?id=' + goodsId);
      const { success, message, data } = res.data;
      if (success) {
        if (data) {
          data.product = data.product || originInputs.product;
          if (!data.product.imageUrls || data.product.imageUrls.length === 0) {
            data.product.imageUrls = [];
            data.product.imageUrls[0] = data.front_oss_image;
            data.product.imageUrls[1] = data.back_oss_image;
          }
          if (!data.product.title) {
            data.product.title = data.title;
          }

          await formik.setValues({ ...originInputs, ...data });
        }
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchOptions = async () => {
    fetchGoodsDetail().then();

    const sites = await fetchSitesOption();
    setSitesOptions(sites);
    if (sites && sites.length > 0) {
      let defaultSite = sites.find((site) => site.isDefault === 1);
      if (!defaultSite) {
        defaultSite = sites[0];
      }
      await formik.setFieldValue('siteId', defaultSite.siteId);
      await formik.setFieldValue('locale', defaultSite.marketplaceId);
      await formik.setFieldValue('marketplaceId', defaultSite.marketplaceId);
    }

    setTypeOptions(await fetchTypeOption());
    setPrompt(await fetchPromp());

    let accounts = await fetchEbayAccountOption();
    setAccountList(accounts);
    if (accounts[0]) {
      await formik.setFieldValue('ebayId', accounts[0].id);
      setEbayAccountId(accounts[0].id);

      const defaultCategoryTreeIdRes = await fetchDefaultCategoryTreeId();
      setDefaultCategoryTreeId(defaultCategoryTreeIdRes);

      // setCategoryLoading(true);
      // setCategoryOptions(await fetchCategoryOption());
      // setCategoryLoading(false);

      setStoreCategoryLoading(true);
      // const { storeCategories } = await fetchStoreCategories();
      const storeCategories = [
        {
          categoryId: '1',
          categoryName: '1****r',
          order: '0',
          level: 1,
          childrenCategories: [
            {
              categoryId: '2*****',
              categoryName: 'D******2',
              order: '0',
              level: 2,
              childrenCategories: [
                {
                  categoryId: '3*****',
                  categoryName: 'D******3',
                  order: '0',
                  level: 3
                }
              ]
            }
          ]
        },
        {
          categoryId: '2',
          categoryName: 'D******s',
          order: '1',
          level: 1
        }
      ];
      //
      setStoreCategories(storeCategories);
      setStoreCategoryLoading(false);

      getAspectsForCategory({ defaultCategoryTreeIdRes }).then();
    } else {
      showInfo('请添加先ebay账号');
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      navigate('/panel/profile');
    }
  };

  const previewFile = (file, index) => {
    let newImgList = [...formik.values.product.imageUrls];
    const reader = new FileReader();
    reader.onloadend = () => {
      newImgList[index] = reader.result;
      console.log(newImgList);
      formik.setFieldValue('product.imageUrls', newImgList);
    };
    reader.readAsDataURL(file);
  };

  const identify = async (setFieldValue) => {
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
      console.log(url);
      const front_base_64_image = await compressImage(formik.values.product.imageUrls[0], ((300 * 1028) / 3) * 4);
      const back_base_64_image = await compressImage(formik.values.product.imageUrls[1], ((300 * 1028) / 3) * 4);
      MODEL.STARCARD.context[0].content[1].image_url.url = url;
      MODEL.STARCARD.context[0].content[0].text = prompt;
      const { data } = await getOpenaiMsg({
        ...MODEL.STARCARD.modelConfig,
        messages: MODEL.STARCARD.context,
        front_base_64_image: front_base_64_image,
        back_base_64_image: back_base_64_image
      });
      setFieldValue('title', data.choices[0].message.content);
    } catch (err) {
      console.log(err);
    } finally {
      setSynthesisButtonLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      console.log(formik.values);
      return;
      const res = await API.post('/api/ebay_goods_save', formik.values);
      const { success, message } = res.data;
      if (success) {
        showInfo('保存成功');
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const handlePublish = async () => {
    try {
      const res = await API.post('/api/ebay_goods_publish', formik.values);
      const { success, message } = res.data;
      if (success) {
        showInfo('刊登成功');
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOptions().then();
    }
  }, [open]);

  const getConditionOption = async () => {
    const { itemConditionPolicies } = await fetchConditionOption({
      marketplace_id: formik.values.marketplaceId,
      category_ids: [formik.values.categoryId]
    });
    if (itemConditionPolicies?.length > 0) {
      setCondition(itemConditionPolicies[0]);
    }
  };
  useEffect(() => {
    // 获取物品状况
    if (formik.values.categoryId) {
      formik.setFieldValue('condition', '');
      formik.setFieldValue('conditionDescriptors', []);
      getConditionOption().then();
    }
  }, [formik.values.categoryId]);

  const getAspectsForCategory = async ({ defaultCategoryTreeId }) => {
    try {
      const { aspects } = await fetchAspectsForCategory({
        category_tree_id: defaultCategoryTreeId || 0,
        category_id: formik.values.categoryId || '183050'
      });
      console.log(aspects);
      console.log('----------');
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

  return (
    <>
      <Dialog maxWidth="lg" open={open} onClose={handleClose}>
        <DialogTitle>编辑商品</DialogTitle>
        <DialogContent>
          <form noValidate onSubmit={formik.handleSubmit}>
            <Stack spacing={3}>
              {JSON.stringify(formik.touched)}
              {JSON.stringify(formik.errors)}
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
                      onChange={formik.handleChange}
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
                      onChange={(e) => {
                        setEbayAccountId(e.target.value);
                        formik.handleChange(e);
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
                    error={Boolean(formik.touched.categoryId && formik.errors.categoryId)}
                    sx={{ ...theme.typography.otherInput }}
                  >
                    <FormLabel htmlFor="channel-category-label" style={{ marginBottom: '10px' }}>
                      店铺分类
                    </FormLabel>
                    <CheckTreePicker
                      defaultExpandAll
                      data={storeCategories}
                      popupStyle={{ zIndex: 9999 }}
                      searchable={false}
                      style={{ width: 280 }}
                      placeholder="Select without search"
                      labelKey="categoryName"
                      valueKey="categoryName"
                      childrenKey="childrenCategories"
                    />
                    <CheckTreePicker
                      name="storeCategoryIds"
                      popupStyle={{ zIndex: 9999 }}
                      preventOverflow={true}
                      data={storeCategories}
                      searchable={true}
                      placeholder="店铺分类选择"
                      size="lg"
                      loading={storeCategoryLoading}
                      labelKey="categoryName"
                      valueKey="categoryName"
                      childrenKey="childrenCategories"
                      onChange={(value) => formik.setFieldValue('storeCategoryNames', value || '')}
                    ></CheckTreePicker>
                    {formik.errors.categoryId && (
                      <FormHelperText error id="helper-tex-channel-category-label">
                        {formik.errors.categoryId}
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
                      <LoadingButton
                        loading={synthesisButtonLoading}
                        variant="outlined"
                        startIcon={<IconLoader />}
                        onClick={() => identify(formik.setFieldValue)}
                      >
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
                            <img
                              alt="第一张"
                              style={{ width: '200px', height: '300px' }}
                              src={ImageUrl + formik.values.product.imageUrls[0]}
                            />
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
                            <img
                              alt="第二张"
                              style={{ width: '200px', height: '300px' }}
                              src={ImageUrl + formik.values.product.imageUrls[1]}
                            />
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
                      value={formik.values.product.subtitle}
                      name="subtitle"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      inputProps={{ autoComplete: 'title' }}
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
                    <RadioGroup row id="channel-type-label" name="format" value={formik.values.format} onChange={formik.handleChange}>
                      {typeOptions.map((option) => {
                        return <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />;
                      })}
                    </RadioGroup>
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
                      onChange={(value) => formik.setFieldValue('categoryId', value || '')}
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
                    <InputLabel htmlFor="channel-title-label">平台sku</InputLabel>
                    <OutlinedInput
                      id="channel-title-label"
                      style={{ width: '650px' }}
                      label="平台sku"
                      type="text"
                      value={formik.values.self_sku}
                      name="self_sku"
                      onBlur={formik.handleBlur}
                      onChange={formik.handleChange}
                      aria-describedby="helper-text-conditionDescription-label"
                      readOnly={true}
                    />
                  </FormControl>
                </Stack>
              </SubCard>
              <SubCard title="类目属性">
                <Stack direction="column" justifyContent="flex-start" alignItems="flex-start" spacing={{ xs: 1, sm: 2, md: 4 }}>
                  {itemAspectsForCategoryOptions.map((item) => {
                    return (
                      <FormControl style={{ minWidth: 300 }} sx={{ ...theme.typography.otherInput }} key={item.localizedAspectName} error={Boolean(item.aspectConstraint.aspectRequired)}>
                        <Field name={`product.aspects.${item.localizedAspectName}`} validate={validateAspect} >
                        {item.aspectConstraint.aspectMode === ModeEnum.SELECTION_ONLY ? (
                          <>
                            {/*error={Boolean(formik.touched.product?.aspects[item.localizedAspectName] && formik.errors.product?.aspects[item.localizedAspectName])}*/}
                            <InputLabel id="demo-multiple-checkbox-label">{item.localizedAspectName}</InputLabel>
                            <Select
                              labelId="demo-multiple-checkbox-label"
                              id="demo-multiple-checkbox"
                              multiple
                              value={formik.values.product['aspects'][item.localizedAspectName] || []}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (item.aspectConstraint.itemToAspectCardinality === CardinalityEnum.SINGLE) {
                                  formik.setFieldValue(
                                    `product.aspects.${item.localizedAspectName}`,
                                    [e.target.value.pop()].filter((item) => item)
                                  );
                                } else {
                                  formik.setFieldValue(`product.aspects.${item.localizedAspectName}`, e.target.value);
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
                              style={{ width: '650px' }}
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
                              // error={Boolean(formik.touched.product?.aspects[item.localizedAspectName] && formik.errors.product?.aspects[item.localizedAspectName])}
                              multiple
                              value={formik.values.product.aspects[item.localizedAspectName] || []}
                              onChange={(event, params, reason, details) => {
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
                        {formik.touched.product?.aspects[item.localizedAspectName] &&
                          formik.errors.product?.aspects[item.localizedAspectName] && (
                            <FormHelperText error id="helper-tex-channel-sites-label">
                              {formik.errors.product?.aspects[item.localizedAspectName]}
                            </FormHelperText>
                          )}
                        </Field>
                      </FormControl>
                    )
                  })}
                </Stack>
              </SubCard>
            </Stack>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button type="submit" onClick={handleSave}>
            保存
          </Button>
          <Button type="submit" onClick={handlePublish}>
            刊登
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditEbayGoods;
