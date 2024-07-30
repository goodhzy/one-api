import { useState, useEffect } from "react";
import SubCard from "ui-component/cards/SubCard";
import Cascader from 'rsuite/Cascader'
import  Uploader  from 'rsuite/Uploader'
import handleIdentify from 'utils/image-processing'
import {getOpenaiMsg} from 'utils/common'
import {MODEL} from 'utils/preset'
import {
  Select, MenuItem, FormControl, InputLabel, FormHelperText,
  FormLabel, RadioGroup, FormControlLabel, Radio, Stack, OutlinedInput,
  Box,Button
} from '@mui/material';
import {LoadingButton } from '@mui/lab'
import {  IconPlus,IconLoader} from '@tabler/icons-react';
import { showSuccess, showError,showInfo, verifyJSON } from "utils/common";
import { useNavigate } from 'react-router';
import { ImageUrl, setEbayAccountId } from 'utils/api';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useTheme } from '@mui/material/styles';
import OptionsApi from './component/EditOptions/OptionsApi';

const validationSchema = Yup.object().shape({
  siteId: Yup.string().required('站点不能为空'),
  categoryId: Yup.string().required('刊登类目为必填'),
  title: Yup.string().required('商品标题不能为空'),
});

const originInputs = {
  is_edit: false,
  type: 'AUCTION',  //刊登类型
  siteId: '',  //站点
  ebayId:'', //ebay账号
  categoryId:'',  //刊登类目
  title:'',  //标题
  childTitle:'' ,//子标题
  image:[],//主图

  display_name: '',
  categories: '',
};

export default function EditEbayGoods(){
  const theme = useTheme();
  const navigate = useNavigate();
  const {fetchSitesOption,fetchTypeOption,fetchCategoryOption,fetchEbayAccountOption,fetchPromp} =OptionsApi()
  const [inputs, setInputs] = useState(originInputs);

  const [sitesOptions, setSitesOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [accountList, setAccountList] = useState([]);
  const [imageFileList,setImageFileList] = useState([])
  const [prompt,setPrompt] = useState('');

  const [synthesisButtonLoading,setSynthesisButtonLoading] = useState(false)

  const fetchOptions = async ()=>{
    setSitesOptions(await fetchSitesOption());
    setTypeOptions(await fetchTypeOption());
    setPrompt(await fetchPromp())
    let accounts =  await fetchEbayAccountOption()
    setAccountList(accounts);
    if(inputs.ebayId === '') {
      if(accounts[0]){
        // setInputs({ ...inputs, ebayId: accounts[0].id })
        setInputs(prevInputs => ({ ...prevInputs, ebayId: accounts[0].id }))
        setEbayAccountId(accounts[0].id)
        setCategoryLoading(true);
        setCategoryOptions(await fetchCategoryOption());
        setCategoryLoading(false);
      }else {
        showInfo('请添加先ebay账号')
        // await new Promise((resolve) => setTimeout(resolve, 2000));
        navigate('/panel/profile');
      }

    }
  }

  const previewFile = (file,index) =>{
    let newImgList = [...imageFileList];
    const reader = new FileReader();
    reader.onloadend = () => {
      newImgList[index] = reader.result
      console.log(newImgList);
      setImageFileList(newImgList)
    }
    reader.readAsDataURL(file);
  }

  const identify = async (setFieldValue)=>{
    setSynthesisButtonLoading(true)
    try {
      if(imageFileList && imageFileList.length===0){
        showError('请先上传两张主图')
        return
      }

      if(!imageFileList[0]){
        showError('请上传第一张图')
        return
      }

      if(!imageFileList[1]){
        showError('请上传第二张图')
        return
      }
      // compositeDiagrams
      const {url} =  await handleIdentify(imageFileList)
      console.log(url);
      MODEL.STARCARD.context[0].content[1].image_url.url = url
      MODEL.STARCARD.context[0].content[0].text = prompt
      const {data} = await getOpenaiMsg({
        ...MODEL.STARCARD.modelConfig,
        messages: MODEL.STARCARD.context
      })
      console.log(inputs)
      setFieldValue('title', data.choices[0].message.content);
      console.log(inputs)
    }catch (err){
      console.log(err);
    }finally {
      setSynthesisButtonLoading(false)
    }
  }


  useEffect(() => {
    fetchOptions().then()
  }, []);

  const submit = (values)=>{
    console.log(values);
  }

  return(
    <>
      <Formik initialValues={inputs} enableReinitialize validationSchema={validationSchema} onSubmit={submit}>
        {({errors, handleBlur, handleChange, handleSubmit, touched, values, isSubmitting,setFieldValue })=>(
          <form noValidate onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <SubCard title='基础信息'>
                <Stack
                  direction='column'
                  justifyContent="flex-start"
                  alignItems="flex-start"
                  spacing={{ xs: 1, sm: 2, md: 4 }}
                >
                  {/*站点*/}
                  <FormControl style={{ minWidth: 300 }} error={Boolean(touched.siteId && errors.siteId)} sx={{ ...theme.typography.otherInput }}>
                    <InputLabel htmlFor="channel-sites-label">站点</InputLabel>
                    <Select
                      id="channel-sites-label"
                      label="站点"
                      value={values.siteId}
                      name="siteId"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 200
                          }
                        }
                      }}
                    >
                      {sitesOptions.map((option) => {
                        return(
                          <MenuItem key={option.id} value={option.siteId}>
                            {option.name}
                          </MenuItem>
                        )
                      })}
                    </Select>
                    {touched.siteId && errors.siteId && (
                      <FormHelperText error id="helper-tex-channel-sites-label">
                        {errors.siteId}
                      </FormHelperText>
                    )}
                  </FormControl>
                  {/*标题*/}
                  <FormControl  error={Boolean(touched.title && errors.title)} sx={{ ...theme.typography.otherInput }}>
                    <Stack direction='row' spacing={5} alignItems="center">
                      <Stack>
                        <InputLabel htmlFor="channel-title-label">商品标题</InputLabel>
                        <OutlinedInput
                          id="channel-title-label"
                          style={{width:'650px'}}
                          label="商品标题"
                          type="text"
                          value={values.title}
                          name="title"
                          onBlur={handleBlur}
                          onChange={handleChange}
                          inputProps={{ autoComplete: 'title' }}
                          aria-describedby="helper-text-channel-title-label"
                        />
                      </Stack>
                      <LoadingButton
                          loading={synthesisButtonLoading}
                          variant="outlined"
                          startIcon={<IconLoader/>}
                          onClick={()=>identify(setFieldValue)}
                      >
                        识别
                      </LoadingButton>
                    </Stack>
                    {touched.title && errors.title && (
                      <FormHelperText error id="helper-tex-channel-title-label">
                        {errors.title}
                      </FormHelperText>
                    )}
                  </FormControl>
                  {/*主图*/}
                  <FormControl style={{ minWidth: 500 }} error={Boolean(touched.image && errors.image)} sx={{ ...theme.typography.otherInput }}>
                    <FormLabel htmlFor="channel-image-label">主图</FormLabel>

                    <Stack direction={{ xs: 'column', md:'row' }}  spacing={2}>
                      <Uploader listType='picture' action=''
                                fileListVisible={false}
                                onUpload={file => {
                                  previewFile(file.blobFile, 0)
                                }}
                      >
                        <Box style={{width:'200px',height:'300px'}}>
                            {imageFileList[0] ?(
                                <img alt='第一张' style={{ width: '200px', height: '300px' }}
                                     src={imageFileList[0]} />
                            ):(
                              <IconPlus></IconPlus>
                            )}
                        </Box>

                      </Uploader>

                      <Uploader listType='picture' action=''
                                fileListVisible={false}
                                onUpload={file => {
                                  previewFile(file.blobFile, 1)
                                }}
                      >
                        <Box style={{width:'200px',height:'300px'}}>
                          {imageFileList[1] ?(
                            <img alt='第二张' style={{ width: '200px', height: '300px' }}
                                 src={imageFileList[1]} />
                          ):(
                            <IconPlus></IconPlus>
                          )}
                        </Box>
                      </Uploader>
                    </Stack>

                  </FormControl>


                  <FormControl style={{ minWidth: 300 }} error={Boolean(touched.ebayId && errors.ebayId)} sx={{ ...theme.typography.otherInput }}>
                    <InputLabel htmlFor="channel-ebayId-label">eBay账号</InputLabel>
                    <Select
                      id="channel-ebayId-label"
                      label="eBay账号"
                      value={values.ebayId}
                      name="ebayId"
                      onBlur={handleBlur}
                      onChange={(e)=>{
                        setEbayAccountId(e.target.value)
                        handleChange(e)
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
                        return(
                          <MenuItem key={option.id} value={option.id}>
                            {option.username}
                          </MenuItem>
                        )
                      })}
                    </Select>
                    {touched.ebayId && errors.ebayId && (
                      <FormHelperText error id="helper-tex-channel-ebayId-label">
                        {errors.ebayId}
                      </FormHelperText>
                    )}
                  </FormControl>


                  <FormControl style={{ minWidth: 300 }} error={Boolean(touched.childTitle && errors.childTitle)} sx={{ ...theme.typography.otherInput }}>
                    <InputLabel htmlFor="channel-title-label">子标题</InputLabel>
                    <OutlinedInput
                      id="channel-childTitle-label"
                      label="子标题"
                      type="text"
                      value={values.childTitle}
                      name="childTitle"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      inputProps={{ autoComplete: 'title' }}
                      aria-describedby="helper-text-channel-childTitle-label"
                    />
                    {touched.childTitle && errors.childTitle && (
                      <FormHelperText error id="helper-tex-channel-childTitle-label">
                        {errors.childTitle}
                      </FormHelperText>
                    )}
                  </FormControl>

                  <FormControl style={{ minWidth: 300 }} error={Boolean(touched.type && errors.type)} sx={{ ...theme.typography.otherInput }}>
                    <FormLabel htmlFor="channel-type-label">刊登类型</FormLabel>
                    <RadioGroup row  id="channel-type-label" name="type" value={values.type} onChange={handleChange}>
                      {typeOptions.map((option,index) => {
                        return(
                          <FormControlLabel key={index} value={option.value} control={<Radio />} label={option.label} />
                        )
                      })}
                    </RadioGroup>
                  </FormControl>

                  <FormControl style={{ minWidth: 300 }} error={Boolean(touched.categoryId && errors.categoryId)} sx={{ ...theme.typography.otherInput }}>
                    <FormLabel htmlFor="channel-category-label" style={{marginBottom:'10px'}}>刊登类目</FormLabel>
                    <Cascader data={categoryOptions}  appearance="default" placeholder="刊登类目选择" size="lg" loading={categoryLoading} onChange={(val,event)=> {
                      values.categoryId = val?val:''
                    } } onBlur={handleBlur} ></Cascader>
                    { errors.categoryId && (
                      <FormHelperText error id="helper-tex-channel-category-label">
                        {errors.categoryId}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Stack>
              </SubCard>
            </Stack>
          </form>
        )}

      </Formik>
    </>
  )
}