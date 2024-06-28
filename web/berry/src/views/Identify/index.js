import { useState, useEffect } from 'react';
import { showError, showSuccess } from 'utils/common';
import { API } from 'utils/api';
import { Button, Card, Box, Stack, Container, Typography } from '@mui/material';

export default function Identify() {
  const upLoadImage = () => {
    console.log('upload image')
  }

  const startIdentify = () => {
    console.log('start identify')
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant='h4'>卡片识别</Typography>

      </Stack>

      <Card>
        <Stack direction='row' alignItems='center'>
          <Button onClick={startIdentify}>开始识别</Button>
        </Stack>
      </Card>
    </>
  )
}