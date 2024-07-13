import { Link,  useSearchParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { showError } from 'utils/common';
import useLogin from 'hooks/useLogin';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Grid, Stack, Typography, useMediaQuery, CircularProgress } from '@mui/material';

// project imports
import AuthWrapper from '../AuthWrapper';
import AuthCardWrapper from '../AuthCardWrapper';
import Logo from 'ui-component/Logo';

const EbayAuth = () =>{
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

  const [searchParams] = useSearchParams();
  const [prompt, setPrompt] = useState('处理中...');
  const { ebayLogin } = useLogin();

  const sendCode = async (code) => {
    const { success, message } = await ebayLogin(code);
    if(success){
      if(message){
        showError(message)
      }
    }
  }

  useEffect(() => {
    let code = searchParams.get('code');
    console.log(code)
    sendCode(code).then();
  }, []);

return(
    <AuthWrapper>
      <Grid container direction="column" justifyContent="flex-end">
        <Grid item xs={12}>
          <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 136px)' }}>
            <Grid item sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
              <AuthCardWrapper>
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                  <Grid item sx={{ mb: 3 }}>
                    <Link to="#">
                      <Logo />
                    </Link>
                  </Grid>
                  <Grid item xs={12}>
                    <Grid container direction={matchDownSM ? 'column-reverse' : 'row'} alignItems="center" justifyContent="center">
                      <Grid item>
                        <Stack alignItems="center" justifyContent="center" spacing={1}>
                          <Typography color={theme.palette.primary.main} gutterBottom variant={matchDownSM ? 'h3' : 'h2'}>
                            ebay绑定
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} container direction="column" justifyContent="center" alignItems="center" style={{ height: '200px' }}>
                    <CircularProgress />
                    <Typography variant="h3" paddingTop={'20px'}>
                      {prompt}
                    </Typography>
                  </Grid>
                </Grid>
              </AuthCardWrapper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </AuthWrapper>
)
}

export default EbayAuth;