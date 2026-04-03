import React from 'react';

const SensorCard = ({ title, value, unit, color, icon: Icon, status, caption }) => {
    return (
        <article className="sensor-card glass-panel" style={{ '--accent': color || '#f8fbff' }}>
            <div className="sensor-card__top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {Icon && (
                        <div className="sensor-card__icon">
                            <Icon size={18} />
                        </div>
                    )}
                    <div>
                        <div className="data-label">{title}</div>
                    </div>
                </div>
                {status && <div className="sensor-card__status">{status}</div>}
            </div>

            <div className="sensor-card__body">
                <div className="sensor-card__value">
                    <strong>{value}</strong>
                    {unit && <span>{unit}</span>}
                </div>
                {caption && <div className="sensor-card__caption">{caption}</div>}
            </div>
        </article>
    );
};

export default SensorCard;