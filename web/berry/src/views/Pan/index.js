import { useState, useEffect, useRef } from 'react';
// import { showError, showSuccess } from 'utils/common';
import { API } from 'utils/api';
import {  Card,  Stack, Typography } from '@mui/material';
import { store } from '../../store';
import { LOGIN } from '../../store/actions';
import config from '../../config';

export default function Pan() {
  const iframeRef = useRef(null);
  const REACT_APP_IFEAME_URL= process.env.REACT_APP_IFEAME_URL;
  console.log(process.env.REACT_APP_IFEAME_URL);
  console.log(process.env.REACT_APP_VERSION);
  console.log(process.env.AAA);
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== REACT_APP_IFEAME_URL) return; // Replace with actual origin
      if(event.data === '401') {
        localStorage.removeItem('user');
        store.dispatch({ type: LOGIN, payload: null });
        window.location.href = config.basename + 'login';
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const sendMessageToIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage('Hello from parent', 'https://child-origin.com');
    }
  };

  return (
    <>
      <Card>
        <iframe ref={iframeRef} src={REACT_APP_IFEAME_URL} width='100%' height={window.innerHeight - 150} style={{border:'none'}}></iframe>
      </Card>
    </>
  )
}