import React, { useState } from 'react';

const ControlPanel = ({ onControl }) => {
    const [loading, setLoading] = useState(null);

    const handleControl = async (action, label) => {
        setLoading(action);
        try {
            await onControl(action);
            // Show success feedback
            setTimeout(() => setLoading(null), 1000);
        } catch (error) {
            console.error('Control error:', error);
            setLoading(null);
        }
    };

    const ControlButton = ({ icon, label, action, color, description }) => (
        <div style={{
            flex: '1',
            minWidth: '200px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s'
        }}>
            <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
                <h4 style={{ margin: '0 0 5px', color: '#2c3e50', fontSize: '16px' }}>
                    {label}
                </h4>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '12px', lineHeight: '1.4' }}>
                    {description}
                </p>
            </div>
            <button
                onClick={() => handleControl(action, label)}
                disabled={loading !== null}
                style={{
                    width: '100%',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: loading === action ? '#95a5a6' : color,
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: loading !== null ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    opacity: loading !== null && loading !== action ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                    if (loading === null) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    }
                }}
                onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                }}
            >
                {loading === action ? '⏳ Đang xử lý...' : `Kích hoạt`}
            </button>
        </div>
    );

    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px', color: '#2c3e50', fontSize: '18px' }}>
                    🎛️ Bảng điều khiển thủ công
                </h3>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '13px' }}>
                    Điều khiển thủ công hệ thống phòng cháy chữa cháy
                </p>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <ControlButton
                    icon="💧"
                    label="Kích hoạt bơm nước"
                    description="Bật hệ thống bơm nước dập lửa"
                    action="pump_on"
                    color="#3498db"
                />
                
                <ControlButton
                    icon="🛑"
                    label="Tắt bơm nước"
                    description="Dừng hệ thống bơm nước"
                    action="pump_off"
                    color="#e74c3c"
                />

                <ControlButton
                    icon="🔔"
                    label="Kiểm tra còi báo"
                    description="Test buzzer và LED cảnh báo"
                    action="test_alarm"
                    color="#f39c12"
                />

                <ControlButton
                    icon="🔄"
                    label="Reset hệ thống"
                    description="Khởi động lại và reset trạng thái"
                    action="reset_system"
                    color="#9b59b6"
                />

                <ControlButton
                    icon="🧪"
                    label="Test đầy đủ"
                    description="Kiểm tra toàn bộ hệ thống"
                    action="full_test"
                    color="#16a085"
                />

                <ControlButton
                    icon="🚨"
                    label="Cảnh báo khẩn cấp"
                    description="Kích hoạt cảnh báo khẩn cấp"
                    action="emergency_alert"
                    color="#c0392b"
                />
            </div>

            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#fff3cd',
                borderLeft: '4px solid #f39c12',
                borderRadius: '4px'
            }}>
                <p style={{ margin: 0, color: '#856404', fontSize: '13px' }}>
                    ⚠️ <strong>Lưu ý:</strong> Chỉ sử dụng điều khiển thủ công khi cần thiết. 
                    Hệ thống tự động sẽ hoạt động khi phát hiện cháy.
                </p>
            </div>
        </div>
    );
};

export default ControlPanel;
