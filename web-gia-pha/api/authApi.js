import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor đính kèm token vào request 
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token"); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// API đăng nhập
export const loginApi = async (loginData) => {
    try {
        const response = await api.post('/auth/login', loginData);
        return response.data; 
    } catch (error) {
        throw error.response ? error.response.data : { message: "Lỗi kết nối server" };
    }
};

// API đăng ký
export const registerApi = async (registerData) => {
    try {
        const response = await api.post('/auth/register', registerData);
        return response.data; 
    } catch (error) {
        throw error.response ? error.response.data : { message: "Lỗi kết nối server" };
    }
};