import { useState, useEffect } from 'react';
// import { showError, showSuccess } from 'utils/common';
import { API } from 'utils/api';
import {  Card,  Stack, Typography } from '@mui/material';

export default function Pan() {

  return (
    <>
      <Card>
        <iframe src={`http://localhost:3003`} width='100%' height={1000} style={{border:'none'}}></iframe>
      </Card>
    </>
  )
}