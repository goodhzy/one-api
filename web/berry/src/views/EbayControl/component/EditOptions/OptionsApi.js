import { API } from 'utils/api';
import { showError } from '../../../../utils/common';

const OptionsApi = () => {
  //获取站点选项
  const fetchSitesOption = async () => {
    try {
      let res = await API.get('/api/ebay_sites');
      return res.data.data;
    } catch (error) {
      showError(error.message);
    }
  };

  //获取类型选项
  const fetchTypeOption = async () => {
    try {
      let res = await API.get('/api/ebay_format_type');
      return res.data.data;
    } catch (error) {
      showError(error.message);
    }
  };

  //递归处理类目添加value,label
  const recursiveCategory = (data) => {
    return data.map((item) => {
      if (item.childCategoryTreeNodes) {
        return {
          value: item.category.categoryId,
          label: item.category.categoryName,
          children: recursiveCategory(item.childCategoryTreeNodes)
        };
      } else {
        return {
          value: item.category.categoryId,
          label: item.category.categoryName
        };
      }
    });
  };

  // 获取默认分类id
  const fetchDefaultCategoryTreeId = async () => {
    try {
      let res = await API.get('/api/ebay_get_default_category_tree_id');
      const { data } = res;
      if (data.success) {
        return data.data.categoryTreeId;
      } else {
        showError(data.message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  //获取刊登类目
  const fetchCategoryOption = async ({ categoryTreeId }) => {
    try {
      const { data } = await API.get(`/api/ebay_category_tree?category_tree_id=${categoryTreeId}`);
      // console.log(recursiveCategory(data.data.rootCategoryNode.childCategoryTreeNodes));
      return recursiveCategory(data.data.rootCategoryNode.childCategoryTreeNodes);
    } catch (error) {
      showError(error.message);
    }
  };

  //获取店铺分类
  const fetchStoreCategories = async () => {
    try {
      let res = await API.get('/api/ebay_get_store_categories');
      return res.data.data;
    } catch (error) {
      showError(error.message);
    }
  };

  //获取ebay账号
  const fetchEbayAccountOption = async () => {
    try {
      let res = await API.get('/api/ebay_account_list');
      return res.data.data;
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchPrompt = async () => {
    try {
      let res = await API.get('/api/prompt');
      return res.data.data;
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchConditionOption = async (data) => {
    try {
      let res = await API.get('/api/ebay_get_item_condition_policies', {
        params: data
      });
      return res.data.data;
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchAspectsForCategory = async (data) => {
    try {
      let res = await API.get('/api/ebay_get_item_aspects_for_category', {
        params: data
      });
      console.log(res.data);
      console.log('--------------');
      if (res.data.success) {
        return res.data.data;
      } else {
        showError(res.data.message);
        return Promise.reject(res.data.message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchPaymentPolicy = async (data) => {
    try {
      let res = await API.get('/api/ebay_get_payment_policy', {
        params: data
      });
      if (res.data.success) {
        return res.data.data;
      } else {
        showError(res.data.message);
        return Promise.reject(res.data.message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchFulfillmentPolicy = async (data) => {
    try {
      let res = await API.get('/api/ebay_get_fulfillment_policies', {
        params: data
      });
      if (res.data.success) {
        return res.data.data;
      } else {
        showError(res.data.message);
        return Promise.reject(res.data.message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchReturnPolicy = async (data) => {
    try {
      let res = await API.get('/api/ebay_get_return_policy', {
        params: data
      });
      if (res.data.success) {
        return res.data.data;
      } else {
        showError(res.data.message);
        return Promise.reject(res.data.message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchInventoryLocation = async (data) => {
    try {
      let res = await API.get('/api/ebay_get_inventory_location', {
        params: data
      });
      if (res.data.success) {
        return res.data.data;
      } else {
        showError(res.data.message);
        return Promise.reject(res.data.message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchListingDuration = async () => {
    try {
      let res = await API.get('/api/ebay_get_listing_duration');
      return res.data.data;
    } catch (error) {
      showError(error.message);
    }
  };

  return {
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
    fetchFulfillmentPolicy,
    fetchReturnPolicy,
    fetchInventoryLocation,
    fetchListingDuration
  };
};

export default OptionsApi;
