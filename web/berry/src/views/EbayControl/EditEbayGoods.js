import { useState, useEffect } from "react";
import SubCard from "ui-component/cards/SubCard";
import { Select, MenuItem, FormControl, InputLabel, FormHelperText,
  FormLabel,RadioGroup,FormControlLabel,Radio,Stack
} from '@mui/material';
import { showSuccess, showError, verifyJSON } from "utils/common";
import { setEbayAccountId } from "utils/api";
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useTheme } from '@mui/material/styles';
import OptionsApi from './component/EditOptions/OptionsApi';

const validationSchema = Yup.object().shape({
  siteId: Yup.string().required('站点不能为空'),
});

const originInputs = {
  is_edit: false,
  type: 'AUCTION',
  siteId: '',
  ebayId:'',
  display_name: '',
  categories: '',
};

export default function EditEbayGoods(){
  const theme = useTheme();
  const {fetchSitesOption,fetchTypeOption,fetchCategoryOption,fetchEbayAccountOption} =OptionsApi()
  const [inputs, setInputs] = useState(originInputs);

  const [sitesOptions, setSitesOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [accountList, setAccountList] = useState([]);

  const fetchOptions = async ()=>{
    let accounts =  await fetchEbayAccountOption()
    setAccountList(accounts);
    if(inputs.ebayId === '') {
      setInputs({ ...inputs, ebayId: accounts[0].id })
      setEbayAccountId(accounts[0].id)
    }

    setSitesOptions(await fetchSitesOption());
    setTypeOptions(await fetchTypeOption());
    setCategoryOptions(await fetchCategoryOption());
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
        {({errors, handleBlur, handleChange, handleSubmit, touched, values, isSubmitting })=>(
          <form noValidate onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <SubCard title='站点类目'>
                <Stack
                  direction='column'
                  justifyContent="flex-start"
                  alignItems="flex-start"
                  spacing={{ xs: 1, sm: 2, md: 4 }}
                >
                  <FormControl style={{ minWidth: 200 }} error={Boolean(touched.type && errors.type)} sx={{ ...theme.typography.otherInput }}>
                    <FormLabel htmlFor="channel-type-label">刊登类型</FormLabel>
                    <RadioGroup row  id="channel-type-label" name="type" value={values.type} onChange={handleChange}>
                      {typeOptions.map((option,index) => {
                        return(
                          <FormControlLabel key={index} value={option.value} control={<Radio />} label={option.label} />
                        )
                      })}
                    </RadioGroup>
                  </FormControl>

                  <FormControl style={{ minWidth: 200 }} error={Boolean(touched.siteId && errors.siteId)} sx={{ ...theme.typography.otherInput }}>
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

                </Stack>
              </SubCard>

              <SubCard title='基本信息'>
                <FormControl style={{ minWidth: 200 }} error={Boolean(touched.ebayId && errors.ebayId)} sx={{ ...theme.typography.otherInput }}>
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
              </SubCard>
            </Stack>
          </form>
        )}

      </Formik>
    </>
  )
}