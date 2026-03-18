import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const AlertStats = ({ historyData }) => {
    // Calculate statistics
    const totalRecords = historyData && historyData.length ? historyData.length : 0;
    const fireDetectedCount = historyData && historyData.length ? historyData.filter(item => item.fireDetected).length : 0;
    const safeCount = totalRecords - fireDetectedCount;
    
    const avgTemperature = totalRecords > 0 && historyData
        ? (historyData.reduce((sum, item) => sum + (item.temperature || 0), 0) / totalRecords).toFixed(1)
        : 0;
    
    const avgGasLevel = totalRecords > 0 && historyData
        ? (historyData.reduce((sum, item) => sum + (item.gasLevel || 0), 0) / totalRecords).toFixed(1)
        : 0;

    const maxTemperature = totalRecords > 0 && historyData
        ? Math.max(...historyData.map(item => item.temperature || 0)).toFixed(1)
        : 0;

    const maxGasLevel = totalRecords > 0 && historyData
        ? Math.max(...historyData.map(item => item.gasLevel || 0)).toFixed(1)
        : 0;

    // Data for pie chart
    const pieData = [
        { name: 'An toàn', value: safeCount, color: '#2ecc71' },
        { name: 'Cảnh báo cháy', value: fireDetectedCount, color: '#e74c3c' }
    ];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor={x > cx ? 'start' : 'end'} 
                dominantBaseline="central"
                style={{ fontSize: '14px', fontWeight: 'bold' }}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
            <h3 style={{ margin: '0 0 20px', color: '#2c3e50', fontSize: '18px' }}>
                📈 Thống kê & Phân tích
            </h3>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Statistics Cards */}
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#7f8c8d', fontSize: '14px' }}>
                            🔢 Tổng số bản ghi
                        </h4>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                            {totalRecords}
                        </p>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#7f8c8d', fontSize: '14px' }}>
                            🔥 Số lần cảnh báo
                        </h4>
                        <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                            {fireDetectedCount}
                        </p>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 10px', color: '#7f8c8d', fontSize: '14px' }}>
                            🌡️ Nhiệt độ TB / Cao nhất
                        </h4>
                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
                            {avgTemperature}°C / {maxTemperature}°C
                        </p>
                    </div>

                    <div>
                        <h4 style={{ margin: '0 0 10px', color: '#7f8c8d', fontSize: '14px' }}>
                            ☁️ Khói TB / Cao nhất
                        </h4>
                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#f39c12' }}>
                            {avgGasLevel} ppm / {maxGasLevel} ppm
                        </p>
                    </div>
                </div>

                {/* Pie Chart */}
                <div style={{ flex: '1', minWidth: '250px' }}>
                    {totalRecords === 0 ? (
                        <div style={{
                            height: '250px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#7f8c8d',
                            fontSize: '14px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px'
                        }}>
                            📈 Chưa có dữ liệu
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertStats;
