import axios from 'axios';
import { store } from '../store/store'; // We will use this to get token from Redux

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm Interceptor để tự động đính kèm Token vào mọi request
apiClient.interceptors.request.use(
  (config) => {
    // Lấy state hiện tại từ Redux store
    const state = store.getState();
    let token = state.auth.token;

    // TODO: Xoá dòng này khi tính năng Đăng nhập được nối API thật
    if (!token) {
      token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5fMTc4NDc4MTg0NDU4M0BnaWFwaGEuY29tIiwiaWF0IjoxNzg0ODg2MDYwLCJleHAiOjQ5Mzg0ODYwNjB9.pfL2GoHoHDvfKybHz7BkEJk42hyKNYDn62TddcgEE74';
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Tự động xử lý lỗi 401 (Hết hạn Token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token hết hạn hoặc không hợp lệ -> có thể dispatch action logout ở đây
      console.warn('Lỗi 401: Token không hợp lệ hoặc đã hết hạn.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
