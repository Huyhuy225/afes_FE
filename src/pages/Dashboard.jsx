import React, { useEffect, useState } from 'react';
import sensorApi from '../api/sensorApi';
import SensorCard from '../components/SensorCard';
import TrendChart from '../components/TrendChart';
import AlertStats from '../components/AlertStats';
import ControlPanel from '../components/ControlPanel';

const Dashboard = () => {
    // Vẫn giữ nguyên cấu trúc state cũ để không làm hỏng các Component con
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
                // 1. Lấy dữ liệu Lịch sử (Chứa toàn bộ data)
                const historyRes = await sensorApi.getHistory();
                const rawData = historyRes.data ? historyRes.data : historyRes;

                if (rawData && Array.isArray(rawData) && rawData.length > 0) {
                    // Sắp xếp dữ liệu mới nhất lên đầu
                    const sortedData = [...rawData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                    // --- BƯỚC 1: XỬ LÝ LATEST DATA CHO CÁC THẺ CARD ---
                    // Tìm bản ghi khói và lửa mới nhất trong đống data
                    const latestSmoke = sortedData.find(item => item.topic && item.topic.includes('smoke'));
                    const latestFlame = sortedData.find(item => item.topic && item.topic.includes('flame'));
                    const latestDht = sortedData.find(item => item.topic && item.topic.includes('dht20'));

                    // Firmware đang publish FLAME theo % (0..100), cao hơn nghĩa là cháy mạnh hơn.
                    const isFire = latestFlame ? latestFlame.mainValue >= 70 : false;

                    setLatestData({
                        temperature: latestDht ? Number(latestDht.mainValue).toFixed(1) : 0,
                        gasLevel: latestSmoke ? latestSmoke.mainValue : 0,
                        fireDetected: isFire,
                        timestamp: latestDht
                            ? latestDht.timestamp
                            : (latestSmoke ? latestSmoke.timestamp : (latestFlame ? latestFlame.timestamp : ''))
                    });

                    // --- BƯỚC 2: XỬ LÝ HISTORY DATA CHO BIỂU ĐỒ ---
                    // Biến đổi cấu trúc mảng mới thành mảng cũ để TrendChart không bị lỗi
                    const mappedHistory = sortedData.map(item => ({
                        timestamp: item.timestamp,
                        temperature: item.topic.includes('dht20') ? item.mainValue : 0,
                        gas_level: item.topic.includes('smoke') ? item.mainValue : 0,
                        fire_detected: item.topic.includes('flame') ? (item.mainValue >= 70 ? 1 : 0) : 0
                    }));

                    setHistoryData(mappedHistory);
                }
            } catch (err) {
                console.error("Lỗi lấy dữ liệu:", err);
            }
        };

        fetchData();
        const timer = setInterval(fetchData, 5000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (timeStr) => {
        if (!timeStr) return "Đang cập nhật...";
        return new Date(timeStr).toLocaleString('vi-VN');
    };

    const handleControl = async (action) => {
        try {
            let response;
            switch(action) {
                case 'pump_on': response = await sensorApi.pumpOn(); alert('✅ Đã bật bơm nước'); break;
                case 'pump_off': response = await sensorApi.pumpOff(); alert('✅ Đã tắt bơm nước'); break;
                case 'test_alarm': response = await sensorApi.testAlarm(); alert('✅ Đang kiểm tra còi báo...'); break;
                case 'reset_system': response = await sensorApi.resetSystem(); alert('✅ Đã reset hệ thống'); break;
                case 'full_test': response = await sensorApi.fullTest(); alert('✅ Đang thực hiện test đầy đủ...'); break;
                case 'emergency_alert': response = await sensorApi.emergencyAlert(); alert('🚨 Đã kích hoạt cảnh báo khẩn cấp!'); break;
                default: response = await sensorApi.control(action);
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
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ margin: '0 0 10px', color: '#2c3e50', fontSize: '32px' }}>🔥 Dashboard Hệ thống AFES</h1>
                    <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>Automatic Fire Extinguisher System - Giám sát thời gian thực</p>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: 0, color: '#7f8c8d', fontSize: '12px' }}>🕒 Cập nhật lần cuối</p>
                    <p style={{ margin: '5px 0 0', color: '#2c3e50', fontSize: '16px', fontWeight: 'bold' }}>{formatTime(latestData.timestamp)}</p>
                </div>
            </div>

            {/* Current Status Cards */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 15px', color: '#2c3e50', fontSize: '20px' }}>📍 Trạng thái hiện tại</h2>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <SensorCard title="Nhiệt độ hiện tại" value={latestData.temperature} unit="°C" icon="🌡️" color="#e74c3c" />
                    <SensorCard title="Nồng độ khói" value={latestData.gasLevel} unit="ppm" icon="☁️" color="#f39c12" />
                    <SensorCard title="Trạng thái cháy" value={latestData.fireDetected ? "CẢNH BÁO" : "AN TOÀN"} unit="" icon="🔥" color={latestData.fireDetected ? "#c0392b" : "#2ecc71"} />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}><ControlPanel onControl={handleControl} /></div>
            <div style={{ marginBottom: '30px' }}><TrendChart data={historyData} /></div>
            <div style={{ marginBottom: '30px' }}><AlertStats historyData={historyData} /></div>

            {/* System Info */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 15px', color: '#2c3e50', fontSize: '18px' }}>ℹ️ Thông tin hệ thống</h3>
                <div style={{ color: '#7f8c8d', fontSize: '14px', lineHeight: '1.8' }}>
                    <p style={{ margin: '5px 0' }}><strong>Cảm biến khí:</strong> MQ-2 (Phát hiện khói và khí dễ cháy)</p>
                    <p style={{ margin: '5px 0' }}><strong>Cảm biến nhiệt độ:</strong> DHT20</p>
                    <p style={{ margin: '5px 0' }}><strong>Vi điều khiển:</strong> ESP32 với kết nối WiFi</p>
                    <p style={{ margin: '5px 0' }}><strong>Cập nhật dữ liệu:</strong> Mỗi 5 giây</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;