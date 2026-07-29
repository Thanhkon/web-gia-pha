import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const updateProfileApi = async (profileData) => {
    try {
        const response = await axios.put(`${API_URL}/users/profile`, profileData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : { message: "Lỗi kết nối server" };
    }
};