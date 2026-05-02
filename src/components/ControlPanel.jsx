import React, { useMemo, useState } from 'react';
import {
    AlertTriangle,
    Droplet,
    DropletOff,
    PowerOff,
    RefreshCcw,
    ShieldAlert,
    ShieldOff,
    Siren,
    TestTube2,
} from 'lucide-react';

const ACTION_ICONS = {
    pump_on: Droplet,
    pump_off: DropletOff,
    test_alarm: Siren,
    emergency_alert: ShieldAlert,
    emergency_off: ShieldOff,
    full_test: TestTube2,
    reset_system: RefreshCcw,
    all_outputs_off: PowerOff,
};

const DEFAULT_ACTIONS = [
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

const ControlPanel = ({ onControl, copy, actions, allowedActions }) => {
    const [loading, setLoading] = useState(null);

    const resolvedActions = useMemo(() => {
        const base = Array.isArray(actions) && actions.length > 0 ? actions : DEFAULT_ACTIONS;
        if (!Array.isArray(allowedActions) || allowedActions.length === 0) return base;

        const allowed = new Set(allowedActions);
        return base
            .map((group) => ({
                ...group,
                buttons: (group.buttons || []).filter((btn) => allowed.has(btn.action)),
            }))
            .filter((group) => (group.buttons || []).length > 0);
    }, [actions, allowedActions]);

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
                {resolvedActions.map((group) => (
                    <div key={group.group} className="control-group">
                        <div className="control-group__head">
                            <div className="control-subtitle">{copy.groups[group.group]}</div>
                        </div>
                        <div className="control-buttons">
                            {group.buttons.map(({ action, tone }) => {
                                const Icon = ACTION_ICONS[action];
                                const label = loading === action ? copy.loading : copy.buttons[action];

                                return (
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
                                        {Icon ? <Icon size={16} /> : null}
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ControlPanel;
