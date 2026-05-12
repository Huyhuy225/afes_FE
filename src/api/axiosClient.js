import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tự động gắn Token vào Header mỗi khi gọi API
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Không tự động logout khi gặp 401 vì Dashboard đang polling liên tục
// Việc logout do mỗi trang tự xử lý (App.jsx ProtectedRoute + handleLogout)

export default axiosClient;