import React, { useEffect, useState } from 'react';
import sensorApi from '../api/sensorApi';
import SensorCard from '../components/SensorCard';
import TrendChart from '../components/TrendChart';
import AlertStats from '../components/AlertStats';
import ControlPanel from '../components/ControlPanel';

const Dashboard = () => {
    // 1. Khởi tạo đầy đủ các trường khớp với JSON từ BE
    const [latestData, setLatestData] = useState({
        temperature: 0,
        gasLevel: 0,
        fireDetected: false,
        timestamp: ''
    });

    const [historyData, setHistoryData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch latest data
                const res = await sensorApi.getLatest();
                const actualData = res.data ? res.data : res;
                const data = Array.isArray(actualData) ? actualData[0] : actualData;

                if (data) {
                    setLatestData(data);
                }

                // Fetch history data for charts
                const historyRes = await sensorApi.getHistory();
                const historyActualData = historyRes.data ? historyRes.data : historyRes;
                if (historyActualData && Array.isArray(historyActualData)) {
                    setHistoryData(historyActualData);
                }
            } catch (err) {
                console.error("Lỗi lấy dữ liệu:", err);
            }
        };

        fetchData();
        const timer = setInterval(fetchData, 5000);
        return () => clearInterval(timer);
    }, []);

    // Hàm định dạng lại thời gian cho dễ nhìn
    const formatTime = (timeStr) => {
        if (!timeStr) return "Đang cập nhật...";
        return new Date(timeStr).toLocaleString('vi-VN');
    };

    // Hàm xử lý điều khiển thủ công
    const handleControl = async (action) => {
        try {
            let response;
            switch(action) {
                case 'pump_on':
                    response = await sensorApi.pumpOn();
                    alert('✅ Đã bật bơm nước');
                    break;
                case 'pump_off':
                    response = await sensorApi.pumpOff();
                    alert('✅ Đã tắt bơm nước');
                    break;
                case 'test_alarm':
                    response = await sensorApi.testAlarm();
                    alert('✅ Đang kiểm tra còi báo...');
                    break;
                case 'reset_system':
                    response = await sensorApi.resetSystem();
                    alert('✅ Đã reset hệ thống');
                    break;
                case 'full_test':
                    response = await sensorApi.fullTest();
                    alert('✅ Đang thực hiện test đầy đủ...');
                    break;
                case 'emergency_alert':
                    response = await sensorApi.emergencyAlert();
                    alert('🚨 Đã kích hoạt cảnh báo khẩn cấp!');
                    break;
                default:
                    response = await sensorApi.control(action);
            }
            console.log('Control response:', response);
        } catch (error) {
            console.error('Control error:', error);
            alert('❌ Lỗi: Không thể thực hiện lệnh. Vui lòng kiểm tra kết nối với hệ thống.');
        }
    };

    return (
        <div style={{ padding: '30px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            {/* Header Section */}
            <div style={{ 
                marginBottom: '30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div>
                    <h1 style={{ margin: '0 0 10px', color: '#2c3e50', fontSize: '32px' }}>
                        🔥 Dashboard Hệ thống AFES
                    </h1>
                    <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                        Automatic Fire Extinguisher System - Giám sát thời gian thực
                    </p>
                </div>
                <div style={{
                    backgroundColor: '#fff',
                    padding: '15px 25px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ margin: 0, color: '#7f8c8d', fontSize: '12px' }}>
                        🕒 Cập nhật lần cuối
                    </p>
                    <p style={{ margin: '5px 0 0', color: '#2c3e50', fontSize: '16px', fontWeight: 'bold' }}>
                        {formatTime(latestData.timestamp)}
                    </p>
                </div>
            </div>

            {/* Current Status Cards */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 15px', color: '#2c3e50', fontSize: '20px' }}>
                    📍 Trạng thái hiện tại
                </h2>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <SensorCard
                        title="Nhiệt độ hiện tại"
                        value={latestData.temperature}
                        unit="°C"
                        icon="🌡️"
                        color="#e74c3c"
                    />
                    <SensorCard
                        title="Nồng độ khói"
                        value={latestData.gasLevel}
                        unit="ppm"
                        icon="☁️"
                        color="#f39c12"
                    />
                    <SensorCard
                        title="Trạng thái cháy"
                        value={latestData.fireDetected ? "CẢNH BÁO" : "AN TOÀN"}
                        unit=""
                        icon="🔥"
                        color={latestData.fireDetected ? "#c0392b" : "#2ecc71"}
                    />
                    <SensorCard
                        title="Mã bản ghi"
                        value={latestData.id}
                        unit="#"
                        icon="🆔"
                        color="#34495e"
                    />
                </div>
            </div>

            {/* Control Panel Section */}
            <div style={{ marginBottom: '30px' }}>
                <ControlPanel onControl={handleControl} />
            </div>

            {/* Trend Chart Section */}
            <div style={{ marginBottom: '30px' }}>
                <TrendChart data={historyData} />
            </div>

            {/* Statistics Section */}
            <div style={{ marginBottom: '30px' }}>
                <AlertStats historyData={historyData} />
            </div>

            {/* System Info */}
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                marginTop: '20px'
            }}>
                <h3 style={{ margin: '0 0 15px', color: '#2c3e50', fontSize: '18px' }}>
                    ℹ️ Thông tin hệ thống
                </h3>
                <div style={{ color: '#7f8c8d', fontSize: '14px', lineHeight: '1.8' }}>
                    <p style={{ margin: '5px 0' }}>
                        <strong>Cảm biến khí:</strong> MQ-2 (Phát hiện khói và khí dễ cháy)
                    </p>
                    <p style={{ margin: '5px 0' }}>
                        <strong>Cảm biến nhiệt độ:</strong> DHT20 (Độ chính xác cao)
                    </p>
                    <p style={{ margin: '5px 0' }}>
                        <strong>Vi điều khiển:</strong> ESP32 với kết nối WiFi
                    </p>
                    <p style={{ margin: '5px 0' }}>
                        <strong>Hệ thống dập lửa:</strong> Bơm nước tự động + Vòi phun
                    </p>
                    <p style={{ margin: '5px 0' }}>
                        <strong>Cập nhật dữ liệu:</strong> Mỗi 5 giây
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
