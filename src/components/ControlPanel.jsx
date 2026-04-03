import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ACTIONS = [
    {
        group: 'water',
        buttons: [
            { action: 'pump_on', tone: 'primary' },
            { action: 'pump_off', tone: 'neutral' },
        ],
    },
    {
        group: 'alert',
        buttons: [
            { action: 'test_alarm', tone: 'warning' },
            { action: 'emergency_alert', tone: 'danger' },
            { action: 'emergency_off', tone: 'success' },
        ],
    },
    {
        group: 'system',
        buttons: [
            { action: 'full_test', tone: 'info' },
            { action: 'reset_system', tone: 'accent' },
            { action: 'all_outputs_off', tone: 'neutral' },
        ],
    },
];

const ControlPanel = ({ onControl, copy }) => {
    const [loading, setLoading] = useState(null);

    const handleControl = async (action) => {
        setLoading(action);
        try {
            await onControl(action);
            setTimeout(() => setLoading(null), 1000);
        } catch (error) {
            console.error('Control error:', error);
            setLoading(null);
        }
    };

    return (
        <section className="control-panel glass-panel">
            <div className="panel-head">
                <div className="panel-copy">
                    <div className="section-kicker">{copy.kicker}</div>
                    <h2 className="panel-title">{copy.title}</h2>
                    <p className="panel-description">
                        {copy.description}
                    </p>
                </div>
                <div className="chart-note">{copy.tag}</div>
            </div>

            <div className="manual-warning">
                <div className="manual-warning__icon">
                    <AlertTriangle size={18} />
                </div>
                <div className="manual-warning__content">
                    <strong>{copy.warningTitle}</strong>
                    <p>{copy.warningBody}</p>
                </div>
            </div>

            <div className="control-groups">
                {ACTIONS.map((group) => (
                    <div key={group.group} className="control-group">
                        <div className="control-group__head">
                            <div className="control-subtitle">{copy.groups[group.group]}</div>
                        </div>
                        <div className="control-buttons">
                            {group.buttons.map(({ action, tone }) => (
                                <button
                                    className={`control-button control-button--${tone}${loading === action ? ' is-loading' : ''}`}
                                    key={action}
                                    onClick={() => handleControl(action)}
                                    disabled={loading !== null}
                                    title={copy.descriptions[action]}
                                    style={{
                                        opacity: loading !== null && loading !== action ? 0.5 : 1,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {loading === action ? copy.loading : copy.buttons[action]}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ControlPanel;
