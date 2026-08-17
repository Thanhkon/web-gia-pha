import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

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
      store.dispatch(logout());
    }

    return Promise.reject(error);
  }
);

export default apiClient;
