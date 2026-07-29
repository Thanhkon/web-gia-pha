import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

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

export const changePasswordApi = async (passwordData) => {
    try {
        const response = await api.put('/auth/change-password', passwordData);
        return response.data; 
    } catch (error) {
        throw error.response ? error.response.data : { message: "Lỗi kết nối server" };
    }
};