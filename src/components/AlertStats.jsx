import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MQ2_SMOKE_ALERT_THRESHOLD_PPM, TEMP_ALERT_THRESHOLD_C } from '../constants/sensors';

const StatRow = ({ label, value, valueColor }) => (
    <div className="stats-row">
        <span style={{ color: '#9ab0cc' }}>{label}</span>
        <span style={{ color: valueColor || '#f8fbff' }}>{value}</span>
    </div>
);

const ChartTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const item = payload[0];
    return (
        <div className="stats-tooltip">
            <strong>{item.name}</strong>
            <p>{item.value}</p>
        </div>
    );
};

const AlertStats = ({ historyData, copy }) => {
    const totalRecords = historyData?.length ?? 0;
    const fireDetectedCount = historyData?.filter(item => item.fireDetected).length ?? 0;
    const highTempCount = historyData?.filter(item => Number(item.temperature || 0) >= TEMP_ALERT_THRESHOLD_C).length ?? 0;
    const highSmokeCount = historyData?.filter(item => Number(item.gasLevel || 0) >= MQ2_SMOKE_ALERT_THRESHOLD_PPM).length ?? 0;
    const safeCount = totalRecords - fireDetectedCount;

    const avgTemperature = totalRecords > 0
        ? (historyData.reduce((sum, item) => sum + (item.temperature || 0), 0) / totalRecords).toFixed(1)
        : '—';

    const avgGasLevel = totalRecords > 0
        ? (historyData.reduce((sum, item) => sum + (item.gasLevel || 0), 0) / totalRecords).toFixed(1)
        : '—';

    const maxTemperature = totalRecords > 0
        ? Math.max(...historyData.map(item => item.temperature || 0)).toFixed(1)
        : '—';

    const maxGasLevel = totalRecords > 0
        ? Math.max(...historyData.map(item => item.gasLevel || 0)).toFixed(1)
        : '—';

    const pieData = [
        { name: copy.safe, value: safeCount, color: '#16a34a' },
        { name: copy.fireAlert, value: fireDetectedCount, color: '#dc2626' },
    ];
    const dominantSegment = fireDetectedCount >= safeCount
        ? { label: copy.fireAlert, value: fireDetectedCount, color: '#fb7185' }
        : { label: copy.safe, value: safeCount, color: '#4ade80' };
    const alertRate = totalRecords > 0 ? ((fireDetectedCount / totalRecords) * 100).toFixed(0) : '0';

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.08) return null;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontSize: '13px', fontWeight: 600 }}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <section className="data-panel glass-panel">
            <div className="panel-head">
                <div className="panel-copy">
                    <div className="section-kicker">{copy.kicker}</div>
                    <h2 className="panel-title">{copy.title}</h2>
                    <p className="panel-description">
                        {copy.description}
                    </p>
                </div>
                <div className="chart-note">{totalRecords} {copy.records}</div>
            </div>

            <div className="stats-layout">
                <div className="stats-summary">
                    <StatRow label={copy.totalRecords} value={totalRecords} valueColor="#60a5fa" />
                    <StatRow label={copy.fireCount} value={fireDetectedCount} valueColor="#fb7185" />
                    <StatRow label={copy.highTemp} value={`${highTempCount}`} valueColor="#f59e0b" />
                    <StatRow label={copy.highSmoke} value={`${highSmokeCount}`} valueColor="#f59e0b" />
                    <StatRow
                        label={copy.tempAvgMax}
                        value={totalRecords > 0 ? `${avgTemperature}°C / ${maxTemperature}°C` : '—'}
                        valueColor="#fda4af"
                    />
                    <StatRow
                        label={copy.smokeAvgMax}
                        value={totalRecords > 0 ? `${avgGasLevel} / ${maxGasLevel} ppm` : '—'}
                        valueColor="#fcd34d"
                    />
                </div>

                <div className="stats-chart-wrap">
                    {totalRecords === 0 ? (
                        <div className="empty-state" style={{ height: '236px' }}>
                            {copy.noData}
                        </div>
                    ) : (
                        <div className="stats-chart-shell">
                            <div className="stats-chart-visual">
                                <ResponsiveContainer width="100%" height={214}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            outerRadius={88}
                                            innerRadius={58}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="stats-chart-center">
                                    <div className="stats-chart-center__label">{copy.fireAlert}</div>
                                    <div className="stats-chart-center__value">{alertRate}%</div>
                                    <div className="stats-chart-center__meta">
                                        {fireDetectedCount} / {totalRecords}
                                    </div>
                                </div>
                            </div>

                            <div className="stats-chart-summary">
                                <div className="stats-chart-summary__row">
                                    <span className="stats-chart-summary__label">{copy.title}</span>
                                    <span className="stats-chart-summary__value" style={{ color: dominantSegment.color }}>
                                        {dominantSegment.label}: {dominantSegment.value}
                                    </span>
                                </div>
                            </div>

                            <div className="stats-legend">
                                {pieData.map((entry) => (
                                    <div key={entry.name} className="stats-legend__item">
                                        <span className="stats-legend__dot" style={{ backgroundColor: entry.color }} />
                                        <span className="stats-legend__text">{entry.name}</span>
                                        <span className="stats-legend__value">{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default AlertStats;
