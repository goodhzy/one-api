import { showError } from './common';
import axios from 'axios';
import { store } from 'store/index';
import { LOGIN } from 'store/actions';
import config from 'config';

export const API = axios.create({
  baseURL: process.env.REACT_APP_SERVER ? process.env.REACT_APP_SERVER : '/'
  // baseURL: 'http://192.168.1.72:3000'
  // baseURL: 'http://localhost:3000'
});

export const ImageUrl = 'https://ball-star-card.oss-cn-guangzhou.aliyuncs.com/'

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      store.dispatch({ type: LOGIN, payload: null });
      window.location.href = config.basename + 'login';
    }

    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    showError(error);
  }
);

const requestConf = (config) => {
  config.headers['Ebay-id'] = localStorage.getItem('ebayId') || ''
  config.headers['Authorization'] = `Bearer ${localStorage.getItem('token') || ''}`
  config.headers['X-EBAY-SOA-GLOBAL-ID'] = localStorage.getItem('globalId') || ''
  return config
}

API.interceptors.request.use(requestConf, (error) => {})
