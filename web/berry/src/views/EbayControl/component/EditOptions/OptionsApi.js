import { API } from "utils/api";
import { showError } from '../../../../utils/common';

const OptionsApi = ()=>{
  //获取站点选项
  const fetchSitesOption = async ()=>{
    try{
      let  res = await API.get('/api/ebay_sites');
      return res.data.data
    }catch (error){
      showError(error.message)
    }
  }

  //获取类型选项
  const fetchTypeOption = async ()=>{
    try{
      let  res = await API.get('/api/ebay_format_type');
      return res.data.data
    }catch (error){
      showError(error.message)
    }
  }

  //获取刊登类目
  const fetchCategoryOption = async (siteId)=>{
    try{
      let  res = await API.get(`/api/ebay_get_default_category_tree_id`);
      const {data } = await API.get(`/api/ebay_category_tree?category_tree_id=${res.data.data.categoryTreeId}`);
      return data.data
    }catch (error){
      showError(error.message)
    }
  }

  //获取ebay账号
  const fetchEbayAccountOption = async ()=>{
    try{
      let  res = await API.get('/api/ebay_account_list');
      return res.data.data
    }catch (error){
      showError(error.message)
    }
  }


  return { fetchSitesOption, fetchTypeOption,fetchCategoryOption,fetchEbayAccountOption };
}

export default OptionsApi