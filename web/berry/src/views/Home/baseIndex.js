import { Box, Typography, Container, Stack } from '@mui/material';
// import {  Button} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
// import { GitHub } from '@mui/icons-material';

const BaseIndex = () => (
  <Box
    sx={{
      minHeight: 'calc(100vh - 136px)',
      backgroundImage: 'linear-gradient(to right, #3498ff, #59afff)',
      color: 'white',
      p: 4
    }}
  >
    <Container maxWidth='xl' >
      <Grid container columns={12} wrap="nowrap"  sx={{ minHeight: 'calc(100vh - 230px)' }}>
        <Grid >
          <Stack spacing={3}>
            <Typography variant="h1" sx={{ fontSize: '4rem', color: '#fff', lineHeight: 1.5 }}>
              Robban - 最智能的卡片销售AI助手，自动化您的卡片销售流程
            </Typography>
            <Typography variant="h4" sx={{ fontSize: '1.5rem', color: '#fff', lineHeight: 1.5 }}>
              <video autoPlay playsInline loop muted style={{width:'100%'}} src='https://cmsassets.rgpub.io/sanity/files/dsfx7636/news/8ab3e227121c53aacab0c9b9f7a48adbc65db520.webm'></video>
            </Typography>
            {/*<Button*/}
            {/*  variant="contained"*/}
            {/*  startIcon={<GitHub />}*/}
            {/*  href="https://github.com/songquanpeng/one-api"*/}
            {/*  target="_blank"*/}
            {/*  sx={{ backgroundColor: '#24292e', color: '#fff', width: 'fit-content', boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)' }}*/}
            {/*>*/}
            {/*  GitHub*/}
            {/*</Button>*/}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  </Box>
);

export default BaseIndex;
