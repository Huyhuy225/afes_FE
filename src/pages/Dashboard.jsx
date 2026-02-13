import React, { useEffect, useState } from 'react';
import sensorApi from '../api/sensorApi';
import SensorCard from '../components/SensorCard';

const Dashboard = () => {
    // 1. Khởi tạo đầy đủ các trường khớp với JSON từ BE
    const [latestData, setLatestData] = useState({
        temperature: 0,
        gasLevel: 0,
        fireDetected: false,
        timestamp: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await sensorApi.getLatest();
                const actualData = res.data ? res.data : res;
                const data = Array.isArray(actualData) ? actualData[0] : actualData;

                if (data) {
                    setLatestData(data);
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

    return (
        <div style={{ padding: '30px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <h1>Dashboard Hệ thống AFES</h1>

            {/* Hiển thị thời gian cập nhật cuối cùng */}
            <p style={{ marginBottom: '20px', color: '#666' }}>
                🕒 Cập nhật lần cuối: <strong>{formatTime(latestData.timestamp)}</strong>
            </p>

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
                    value={latestData.gasLevel} // Khớp với CamelCase từ BE
                    unit="ppm"
                    icon="☁️"
                    color="#f39c12"
                />

                {/* Thông tin 3: Trạng thái cháy */}
                <SensorCard
                    title="Trạng thái cháy"
                    value={latestData.fireDetected ? "CẢNH BÁO" : "AN TOÀN"}
                    unit=""
                    icon="🔥"
                    color={latestData.fireDetected ? "#c0392b" : "#2ecc71"}
                />

                {/* Thông tin 4: ID bản ghi (Dùng để kiểm soát dữ liệu mới) */}
                <SensorCard
                    title="Mã bản ghi"
                    value={latestData.id}
                    unit="#"
                    icon="🆔"
                    color="#34495e"
                />
            </div>
        </div>
    );
};

export default Dashboard;
