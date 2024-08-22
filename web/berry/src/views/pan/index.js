import { useState, useEffect } from 'react';
// import { showError, showSuccess } from 'utils/common';
import { API } from 'utils/api';
import {  Card,  Stack, Typography } from '@mui/material';

export default function Pan() {
  const [key, setKey] = useState('')



  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>

      </Stack>

      <Card>
        {/*<Stack direction='row' alignItems='center'>*/}
        {/*    <Button onClick={startIdentify}>开始识别</Button>*/}
        {/*</Stack>*/}
        {/*<iframe src='https://gptupload.prompts666.com/#/?settings={"key":"sk-2yYQTVtkgvYmHYnx6028D902E785494487B86403B2D843D0"}' width='100%' height={1000} style={{border:'none'}}></iframe>*/}
        {/* eslint-disable-next-line jsx-a11y/iframe-has-title */}
        <iframe src={`http://localhost:5212/home?path=%2F11`} width='100%' height={1000} style={{border:'none'}}></iframe>
      </Card>
    </>
  )
}