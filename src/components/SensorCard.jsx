import React from 'react';

const SensorCard = ({ title, value, unit, icon, color }) => {
    return (
        <div style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#fff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            borderLeft: `6px solid ${color}`,
            flex: 1,
            minWidth: '200px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{icon}</span>
                <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '16px' }}>{title}</h3>
            </div>
            <h2 style={{ margin: '10px 0 0', fontSize: '28px', color: '#2c3e50' }}>
                {value} <span style={{ fontSize: '18px' }}>{unit}</span>
            </h2>
        </div>
    );
};

export default SensorCard;
