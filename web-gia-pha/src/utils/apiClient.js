import axios from 'axios';
import { store } from '../store/store';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;

    let finalToken = token;
    // TODO: Xoá dòng này khi tính năng Đăng nhập được nối API thật (main)
    if (!finalToken) {
      finalToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5fMTc4NDc4MTg0NDU4M0BnaWFwaGEuY29tIiwiaWF0IjoxNzg0ODg2MDYwLCJleHAiOjQ5Mzg0ODYwNjB9.pfL2GoHoHDvfKybHz7BkEJk42hyKNYDn62TddcgEE74';
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    if (finalToken) {
      config.headers.Authorization = `Bearer ${finalToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized or expired token.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
