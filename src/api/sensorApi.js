import axiosClient from './axiosClient';

const sensorApi = {
    getLatest: () => axiosClient.get('/sensors/history/latest'),
    getHistory: () => axiosClient.get('/sensors/history'),
    
    // Control endpoints
    control: (action) => axiosClient.post('/control', { action }),
    
    // Specific control actions
    pumpOn: () => axiosClient.post('/control/pump', { state: 'on' }),
    pumpOff: () => axiosClient.post('/control/pump', { state: 'off' }),
    testAlarm: () => axiosClient.post('/control/test-alarm'),
    resetSystem: () => axiosClient.post('/control/reset'),
    fullTest: () => axiosClient.post('/control/full-test'),
    emergencyAlert: () => axiosClient.post('/control/emergency'),
};
export default sensorApi;