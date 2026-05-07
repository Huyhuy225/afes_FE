import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrendChart = ({ data, copy, locale = 'vi-VN' }) => {
    const chartData = data && data.length > 0
        ? data.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
            temperature: Number(item.temperature || 0),
            smokeLevel: Number(item.smokeLevel || 0),
            fullTimestamp: item.timestamp,
        })).slice(-30)
        : [];

    return (
        <section className="chart-panel chart-panel--fill glass-panel">
            <div className="panel-head">
                <div className="panel-copy">
                    <div className="section-kicker">{copy.kicker}</div>
                    <h2 className="panel-title">{copy.title}</h2>
                    <p className="panel-description">
                        {copy.description}
                    </p>
                </div>
                <div className="chart-note">{copy.note}</div>
            </div>

            <div className="chart-panel__body">
                {chartData.length === 0 ? (
                    <div className="chart-empty">
                        {copy.waiting}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 50 }}>
                            <defs>
                                <linearGradient id="tempStroke" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#fb7185" />
                                    <stop offset="100%" stopColor="#f97316" />
                                </linearGradient>
                                <linearGradient id="smokeStroke" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#fde047" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
                            <XAxis
                                dataKey="time"
                                style={{ fontSize: '11px', fill: '#7f95b6' }}
                                angle={-40}
                                textAnchor="end"
                                height={60}
                                tick={{ fill: '#7f95b6' }}
                                axisLine={{ stroke: 'rgba(148, 163, 184, 0.18)' }}
                                tickLine={false}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 11, fill: '#7f95b6' }}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: '°C', position: 'insideTopLeft', offset: 8, fill: '#8ea2c1', fontSize: 11 }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 11, fill: '#7f95b6' }}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: 'ppm', position: 'insideTopRight', offset: 8, fill: '#8ea2c1', fontSize: 11 }}
                            />
                            <Tooltip
                                formatter={(value, name) => {
                                    if (name.includes('Temperature') || name.includes('Nhiệt độ')) return [`${Number(value).toFixed(1)} °C`, name];
                                    return [`${Number(value).toFixed(0)} ppm`, name];
                                }}
                                labelFormatter={(_, payload) => {
                                    if (payload && payload[0]?.payload) {
                                        return new Date(payload[0].payload.fullTimestamp).toLocaleString(locale);
                                    }
                                    return '';
                                }}
                                contentStyle={{
                                    backgroundColor: 'rgba(8, 15, 28, 0.96)',
                                    border: '1px solid rgba(148, 163, 184, 0.16)',
                                    borderRadius: '14px',
                                    fontSize: '12px',
                                    color: '#e5eefc',
                                    boxShadow: '0 14px 36px rgba(2, 8, 23, 0.35)',
                                }}
                                labelStyle={{ color: '#f8fbff' }}
                            />
                            <Legend
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => (
                                    <span style={{ fontSize: '12px', color: '#c5d4ea' }}>{value}</span>
                                )}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="temperature"
                                stroke="url(#tempStroke)"
                                strokeWidth={2.5}
                                name={copy.temperatureLine}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 0, fill: '#fb7185' }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="smokeLevel"
                                stroke="url(#smokeStroke)"
                                strokeWidth={2.5}
                                name={copy.smokeLine}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 0, fill: '#f59e0b' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    );
};

export default TrendChart;