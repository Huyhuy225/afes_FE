import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrendChart = ({ data }) => {
    const chartData = data && data.length > 0 ? data.map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        }),
        temperature: Number(item.temperature || 0),
        gasLevel: Number(item.gasLevel || 0),
        fullTimestamp: item.timestamp
    })).slice(-30) : [];

    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
            <h3 style={{ margin: '0 0 20px', color: '#2c3e50', fontSize: '18px' }}>
                📊 Biểu đồ theo dõi thời gian thực
            </h3>
            {chartData.length === 0 ? (
                <div style={{
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#7f8c8d',
                    fontSize: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                }}>
                    📊 Đang chờ dữ liệu lịch sử...
                </div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="time" 
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis 
                        yAxisId="left"
                        label={{ value: 'Nhiệt độ (°C)', angle: -90, position: 'insideLeft' }}
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                        yAxisId="right"
                        orientation="right"
                        label={{ value: 'Khói (ppm)', angle: 90, position: 'insideRight' }}
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                        formatter={(value, name) => {
                            if (name.includes('Nhiệt độ')) {
                                return [`${Number(value).toFixed(1)} °C`, name];
                            }
                            return [`${Number(value).toFixed(0)} ppm`, name];
                        }}
                        labelFormatter={(_, payload) => {
                            if (payload && payload[0] && payload[0].payload) {
                                return new Date(payload[0].payload.fullTimestamp).toLocaleString('vi-VN');
                            }
                            return '';
                        }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#e74c3c" 
                        strokeWidth={2}
                        name="Nhiệt độ (°C)"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                    <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="gasLevel" 
                        stroke="#f39c12" 
                        strokeWidth={2}
                        name="Nồng độ khói (ppm)"
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
            )}
        </div>
    );
};

export default TrendChart;
