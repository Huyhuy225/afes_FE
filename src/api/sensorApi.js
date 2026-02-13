import axiosClient from './axiosClient';

const sensorApi = {
    getLatest: () => axiosClient.get('/sensors/history/latest'), // Hoặc đường dẫn API Bo đã test thành công
    getHistory: () => axiosClient.get('/sensors/history'),
};
export default sensorApi;