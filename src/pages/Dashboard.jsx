import React, { useEffect, useState } from 'react';
import sensorApi from '../api/sensorApi';
import SensorCard from '../components/SensorCard';
import TrendChart from '../components/TrendChart';
import AlertStats from '../components/AlertStats';
import ControlPanel from '../components/ControlPanel';
import {
    FLAME_ALERT_PERCENT,
    TEMP_ALERT_THRESHOLD_C,
    MQ2_SMOKE_ALERT_THRESHOLD_PPM,
} from '../constants/sensors';

const buildHistorySeries = (rawData) => {
    if (!Array.isArray(rawData) || rawData.length === 0) {
        return [];
    }

    const sorted = [...rawData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    let currentTemperature = 0;
    let currentGasLevel = 0;
    let currentFireDetected = false;

    return sorted.map((item) => {
        const topic = item.topic || '';
        const value = Number(item.mainValue || 0);

        if (topic.includes('dht20')) {
            currentTemperature = value;
        } else if (topic.includes('smoke')) {
            currentGasLevel = value;
        } else if (topic.includes('flame')) {
            currentFireDetected = value >= FLAME_ALERT_PERCENT;
        }

        return {
            timestamp: item.timestamp,
            temperature: currentTemperature,
            gasLevel: currentGasLevel,
            fireDetected: currentFireDetected
        };
    });
};

const buildAlertMessages = ({ temperature, gasLevel, fireDetected }) => {
    const alerts = [];
    if (temperature >= TEMP_ALERT_THRESHOLD_C) {
        alerts.push({ code: 'HIGH_TEMP', message: 'Nhiệt độ vượt ngưỡng an toàn', color: '#e67e22' });
    }
    if (gasLevel >= MQ2_SMOKE_ALERT_THRESHOLD_PPM) {
        alerts.push({ code: 'SMOKE_HIGH', message: 'Nồng độ khói vượt ngưỡng', color: '#f39c12' });
    }
    if (fireDetected) {
        alerts.push({ code: 'FIRE_ALERT', message: 'Phát hiện lửa / nguy cơ cháy', color: '#c0392b' });
    }
    return alerts;
};

const DATA_POLL_MS = 2000;

const Dashboard = () => {
    const [latestData, setLatestData] = useState({
        temperature: 0,
        gasLevel: 0,
        fireDetected: false,
        timestamp: ''
    });
    const [historyData, setHistoryData] = useState([]);
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [hazardModalDismissed, setHazardModalDismissed] = useState(false);

    useEffect(() => {
        if (activeAlerts.length === 0) {
            setHazardModalDismissed(false);
        }
    }, [activeAlerts.length]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const historyRes = await sensorApi.getHistory();
                const rawData = historyRes.data ? historyRes.data : historyRes;

                if (rawData && Array.isArray(rawData) && rawData.length > 0) {
                    const sortedData = [...rawData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    const latestSmoke = sortedData.find(item => item.topic && item.topic.includes('smoke'));
                    const latestFlame = sortedData.find(item => item.topic && item.topic.includes('flame'));
                    const latestDht = sortedData.find(item => item.topic && item.topic.includes('dht20'));

                    const latestTemperature = latestDht ? Number(latestDht.mainValue || 0) : 0;
                    const latestGasLevel = latestSmoke ? Number(latestSmoke.mainValue || 0) : 0;
                    const isFire = latestFlame ? Number(latestFlame.mainValue || 0) >= FLAME_ALERT_PERCENT : false;
                    const latestTimestamp = latestDht
                        ? latestDht.timestamp
                        : (latestSmoke ? latestSmoke.timestamp : (latestFlame ? latestFlame.timestamp : ''));

                    setLatestData({
                        temperature: Number(latestTemperature.toFixed(1)),
                        gasLevel: Number(latestGasLevel.toFixed(1)),
                        fireDetected: isFire,
                        timestamp: latestTimestamp
                    });

                    setHistoryData(buildHistorySeries(rawData));
                    setActiveAlerts(buildAlertMessages({
                        temperature: latestTemperature,
                        gasLevel: latestGasLevel,
                        fireDetected: isFire
                    }));
                } else {
                    setHistoryData([]);
                    setActiveAlerts([]);
                }
            } catch (err) {
                console.error("Lỗi lấy dữ liệu:", err);
            }
        };

        fetchData();
        const timer = setInterval(fetchData, DATA_POLL_MS);
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
                case 'all_outputs_off': response = await sensorApi.allOutputsOff(); alert('✅ Đã tắt LED, còi và bơm. Hệ thống về chế độ tự động.'); break;
                case 'emergency_off': response = await sensorApi.emergencyOff(); alert('✅ Đã tắt cảnh báo khẩn cấp, hệ thống quay lại AUTO'); break;
                default: response = await sensorApi.control(action);
            }
            console.log('Control response:', response);
        } catch (error) {
            console.error('Control error:', error);
            alert('❌ Lỗi: Không thể thực hiện lệnh. Vui lòng kiểm tra kết nối với hệ thống.');
        }
    };

    const showHazardModal = activeAlerts.length > 0 && !hazardModalDismissed;

    return (
        <div style={{ padding: '30px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            {showHazardModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="hazard-modal-title"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                    onClick={() => setHazardModalDismissed(true)}
                >
                    <div
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            maxWidth: '420px',
                            width: '100%',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            borderTop: '5px solid #c0392b',
                            overflow: 'hidden',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: '22px 24px 16px' }}>
                            <h2 id="hazard-modal-title" style={{ margin: '0 0 12px', color: '#c0392b', fontSize: '20px' }}>
                                Cảnh báo nguy hiểm
                            </h2>
                            <p style={{ margin: '0 0 16px', color: '#2c3e50', fontSize: '14px', lineHeight: 1.5 }}>
                                Hệ thống phát hiện tình huống bất thường. Vui lòng kiểm tra ngay.
                            </p>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#34495e', fontSize: '14px', lineHeight: 1.7 }}>
                                {activeAlerts.map((a) => (
                                    <li key={a.code} style={{ borderLeft: `3px solid ${a.color}`, paddingLeft: '10px', listStyle: 'none', marginBottom: '8px' }}>
                                        {a.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ padding: '12px 24px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8f9fa' }}>
                            <button
                                type="button"
                                onClick={() => setHazardModalDismissed(true)}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    backgroundColor: '#c0392b',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                Đã xem
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            <div style={{ marginBottom: '20px' }}>
                <div style={{
                    backgroundColor: activeAlerts.length > 0 ? '#fdecea' : '#eafaf1',
                    borderLeft: `5px solid ${activeAlerts.length > 0 ? '#e74c3c' : '#2ecc71'}`,
                    borderRadius: '8px',
                    padding: '14px 18px',
                    color: '#2c3e50'
                }}>
                    {activeAlerts.length > 0 ? (
                        <p style={{ margin: 0, fontWeight: 'bold' }}>
                            🚨 Cảnh báo: {activeAlerts.map(item => item.message).join(' | ')}
                        </p>
                    ) : (
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#27ae60' }}>
                            ✅ Hệ thống an toàn - AUTO MODE
                        </p>
                    )}
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
                    <p style={{ margin: '5px 0' }}><strong>Cập nhật dữ liệu:</strong> Khoảng 2 giây (dashboard và thiết bị gửi MQTT)</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;