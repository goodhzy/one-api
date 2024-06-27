import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import useRegister from 'hooks/useRegister';
import Turnstile from 'react-turnstile';
import { useSearchParams } from 'react-router-dom';
import { API } from "utils/api";
// import { useSelector } from 'react-redux';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
  Select,
  MenuItem
} from '@mui/material';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import { strengthColor, strengthIndicator } from 'utils/password-strength';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { showError, showInfo } from 'utils/common';

// ===========================|| FIREBASE - REGISTER ||=========================== //

const RegisterForm = ({ ...others }) => {
  const theme = useTheme();
  const { register, sendVerificationCode } = useRegister();
  const siteInfo = useSelector((state) => state.siteInfo);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();

  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  const [strength, setStrength] = useState(0);
  const [level, setLevel] = useState();

  const [selectedCountryCodes, setSelectedCountryCodes] = useState([]);

  const getCountryCodes = async () =>{
    const res =  await API.get('/api/all_country_codes');
    if(Array.isArray(res.data.data)){
      setSelectedCountryCodes(res.data.data);
    }
  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };


  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const changePassword = (value) => {
    const temp = strengthIndicator(value);
    setStrength(temp);
    setLevel(strengthColor(temp));
  };

  const handleSendCode = async (email) => {
    if (email === '') {
      showError('请输入邮箱');
      return;
    }
    if (turnstileEnabled && turnstileToken === '') {
      showError('请稍后几秒重试，Turnstile 正在检查用户环境！');
      return;
    }

    const { success, message } = await sendVerificationCode(email, turnstileToken);
    if (!success) {
      showError(message);
      return;
    }
  };

  useEffect( () => {
    getCountryCodes().then()
    let affCode = searchParams.get('aff');
    if (affCode) {
      localStorage.setItem('aff', affCode);
    }
    setShowEmailVerification(siteInfo.email_verification);
    if (siteInfo.turnstile_check) {
      setTurnstileEnabled(true);
      setTurnstileSiteKey(siteInfo.turnstile_site_key);
    }
  }, [siteInfo]);

  return (
    <>
      <Formik
        initialValues={{
          username: '',
          password: '',
          confirmPassword: '',
          phone:'',
          phone_code:'86',
          email: showEmailVerification ? '' : undefined,
          verification_code: showEmailVerification ? '' : undefined,
          submit: null
        }}
        validationSchema={Yup.object().shape({
          username: Yup.string().max(255).required('用户名是必填项'),
          password: Yup.string().max(255).required('密码是必填项'),
          phone:Yup.string().max(255).required('手机号是必填项'),
          phone_code:Yup.string().max(255).required('区号是必选项'),
          confirmPassword: Yup.string()
            .required('确认密码是必填项')
            .oneOf([Yup.ref('password'), null], '两次输入的密码不一致'),
          email: showEmailVerification ? Yup.string().email('必须是有效的Email地址').max(255).required('Email是必填项') : Yup.mixed(),
          verification_code: showEmailVerification ? Yup.string().max(255).required('验证码是必填项') : Yup.mixed()
        })}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          console.log(values);
          if (turnstileEnabled && turnstileToken === '') {
            showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
            setSubmitting(false);
            return;
          }

          const { success, message } = await register(values, turnstileToken);
          if (success) {
            setStatus({ success: true });
          } else {
            setStatus({ success: false });
            if (message) {
              setErrors({ submit: message });
            }
          }
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
          <form noValidate onSubmit={handleSubmit} {...others}>
            <FormControl fullWidth error={Boolean(touched.username && errors.username)} sx={{ ...theme.typography.customInput }}>
              <InputLabel htmlFor="outlined-adornment-username-register">用户名</InputLabel>
              <OutlinedInput
                id="outlined-adornment-username-register"
                type="text"
                value={values.username}
                name="username"
                onBlur={handleBlur}
                onChange={handleChange}
                inputProps={{ autoComplete: 'username' }}
              />
              {touched.username && errors.username && (
                <FormHelperText error id="standard-weight-helper-text--register">
                  {errors.username}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={Boolean(touched.password && errors.password)} sx={{ ...theme.typography.customInput }}>
              <InputLabel htmlFor="outlined-adornment-password-register">密码</InputLabel>
              <OutlinedInput
                id="outlined-adornment-password-register"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                name="password"
                label="Password"
                onBlur={handleBlur}
                onChange={(e) => {
                  handleChange(e);
                  changePassword(e.target.value);
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      size="large"
                      color={'primary'}
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                }
                inputProps={{}}
              />
              {touched.password && errors.password && (
                <FormHelperText error id="standard-weight-helper-text-password-register">
                  {errors.password}
                </FormHelperText>
              )}
            </FormControl>
            <FormControl
              fullWidth
              error={Boolean(touched.confirmPassword && errors.confirmPassword)}
              sx={{ ...theme.typography.customInput }}
            >
              <InputLabel htmlFor="outlined-adornment-confirm-password-register">确认密码</InputLabel>
              <OutlinedInput
                id="outlined-adornment-confirm-password-register"
                type={showPassword ? 'text' : 'password'}
                value={values.confirmPassword}
                name="confirmPassword"
                label="Confirm Password"
                onBlur={handleBlur}
                onChange={handleChange}
                inputProps={{}}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <FormHelperText error id="standard-weight-helper-text-confirm-password-register">
                  {errors.confirmPassword}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl error={Boolean(touched.phone_code && errors.phone_code)}  sx={{ marginTop: 1,
              marginBottom: 1,width:'38%' }}>
              <InputLabel htmlFor="outlined-adornment-phone_code-register">区号</InputLabel>
              <Select
                id="outlined-adornment-phone_code-register"
                value={values.phone_code}
                name="phone_code"
                onBlur={handleBlur}
                onChange={handleChange}
              >
                {selectedCountryCodes.map((item) => (
                  <MenuItem key={item.id} value={item.phone_code}>{'+' + item.phone_code+item.chinese_name}</MenuItem>
                ))}
              </Select>
              {touched.phone_code && errors.phone_code && (
                <FormHelperText error id="standard-weight-helper-text--register">
                  {errors.phone_code}
                </FormHelperText>
              )}
            </FormControl>
            <div style={{width:'2%',display:'inline-block'}}></div>
            <FormControl  error={Boolean(touched.phone && errors.phone)} sx={{ marginTop: 1,
              marginBottom: 1,width:'60%'}}>
              <InputLabel htmlFor="outlined-adornment-phone-register">手机号</InputLabel>
              <OutlinedInput
                id="outlined-adornment-phone-register"
                type="text"
                value={values.phone}
                name="phone"
                onBlur={handleBlur}
                onChange={handleChange}
                inputProps={{ autoComplete: 'phone' }}
              />
              {touched.phone && errors.phone && (
                <FormHelperText error id="standard-weight-helper-text--register">
                  {errors.phone}
                </FormHelperText>
              )}
            </FormControl>

            {strength !== 0 && (
              <FormControl fullWidth>
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Box style={{ backgroundColor: level?.color }} sx={{ width: 85, height: 8, borderRadius: '7px' }} />
                    </Grid>
                    <Grid item>
                      <Typography variant="subtitle1" fontSize="0.75rem">
                        {level?.label}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </FormControl>
            )}

            {showEmailVerification && (
              <>
                <FormControl fullWidth error={Boolean(touched.email && errors.email)} sx={{ ...theme.typography.customInput }}>
                  <InputLabel htmlFor="outlined-adornment-email-register">Email</InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-email-register"
                    type="text"
                    value={values.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <Button variant="contained" color="primary" onClick={() => handleSendCode(values.email)}>
                          发送验证码
                        </Button>
                      </InputAdornment>
                    }
                    inputProps={{}}
                  />
                  {touched.email && errors.email && (
                    <FormHelperText error id="standard-weight-helper-text--register">
                      {errors.email}
                    </FormHelperText>
                  )}
                </FormControl>
                <FormControl
                  fullWidth
                  error={Boolean(touched.verification_code && errors.verification_code)}
                  sx={{ ...theme.typography.customInput }}
                >
                  <InputLabel htmlFor="outlined-adornment-verification_code-register">验证码</InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-verification_code-register"
                    type="text"
                    value={values.verification_code}
                    name="verification_code"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    inputProps={{}}
                  />
                  {touched.verification_code && errors.verification_code && (
                    <FormHelperText error id="standard-weight-helper-text--register">
                      {errors.verification_code}
                    </FormHelperText>
                  )}
                </FormControl>
              </>
            )}

            {errors.submit && (
              <Box sx={{ mt: 3 }}>
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Box>
            )}
            {turnstileEnabled ? (
              <Turnstile
                sitekey={turnstileSiteKey}
                onVerify={(token) => {
                  setTurnstileToken(token);
                }}
              />
            ) : (
              <></>
            )}

            <Box sx={{ mt: 2 }}>
              <AnimateButton>
                <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="primary">
                  注册
                </Button>
              </AnimateButton>
            </Box>
          </form>
        )}
      </Formik>
    </>
  );
};

export default RegisterForm;
