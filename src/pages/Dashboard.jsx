import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BellRing, Flame, Globe2, ShieldCheck, Thermometer, Wind } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import sensorApi from '../api/sensorApi';
import SensorCard from '../components/SensorCard';
import TrendChart from '../components/TrendChart';
import AlertStats from '../components/AlertStats';
import ControlPanel from '../components/ControlPanel';
import {
    FLAME_ALERT_PERCENT,
    TEMP_ALERT_THRESHOLD_C,
    SMOKE_ALERT_THRESHOLD_PPM,
} from '../constants/sensors';

const resolveSensorType = (item) => {
    const name = String(item?.sensorName || '').toLowerCase();
    if (name.includes('temp')) return 'temperature';
    if (name.includes('smoke')) return 'smoke';
    if (name.includes('flame')) return 'flame';

    const topic = String(item?.topic || '').toLowerCase();
    if (topic.includes('dht20') || topic.includes('temp')) return 'temperature';
    if (topic.includes('smoke')) return 'smoke';
    if (topic.includes('flame')) return 'flame';
    return '';
};

const buildHistorySeries = (rawData) => {
    if (!Array.isArray(rawData) || rawData.length === 0) return [];

    const sorted = [...rawData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    let currentTemperature = 0;
    let currentSmokeLevel = 0;
    let currentFireDetected = false;

    return sorted.map((item) => {
        const value = Number(item.mainValue || 0);
        const sensorType = resolveSensorType(item);

        if (sensorType === 'temperature') {
            currentTemperature = value;
        } else if (sensorType === 'smoke') {
            currentSmokeLevel = value;
        } else if (sensorType === 'flame') {
            currentFireDetected = value >= FLAME_ALERT_PERCENT;
        }

        return {
            timestamp: item.timestamp,
            temperature: currentTemperature,
            smokeLevel: currentSmokeLevel,
            fireDetected: currentFireDetected,
        };
    });
};

const buildAlertMessages = ({ temperature, smokeLevel, fireDetected }, messages) => {
    const alerts = [];
    if (temperature >= TEMP_ALERT_THRESHOLD_C) {
        alerts.push({ code: 'HIGH_TEMP', message: messages.highTemp, color: '#d97706' });
    }
    if (smokeLevel >= SMOKE_ALERT_THRESHOLD_PPM) {
        alerts.push({ code: 'SMOKE_HIGH', message: messages.highSmoke, color: '#d97706' });
    }
    if (fireDetected) {
        alerts.push({ code: 'FIRE_ALERT', message: messages.fireDetected, color: '#dc2626' });
    }
    return alerts;
};

const DATA_POLL_MS = 2000;
const LOGO_SRC = `${import.meta.env.BASE_URL}afes-logo.png`;

const COPY = {
    vi: {
        locale: 'vi-VN',
        brandName: 'AFES Dashboard',
        brandSubtitle: 'Fire Alarm Systems',
        liveBadge: 'Vận hành thời gian thực',
        title: 'Bảng thông tin và điều khiển',
        description: 'Theo dõi dữ liệu cảm biến và quản lý lệnh điều khiển trong một giao diện rõ ràng, tập trung và dễ giám sát.',
        updateBadge: `Cập nhật mỗi ${DATA_POLL_MS / 1000}s`,
        recentRecords: 'bản ghi gần đây',
        activeAlerts: 'cảnh báo đang kích hoạt',
        headerSafe: 'Trạng thái ổn định',
        headerAlert: 'Yêu cầu kiểm tra',
        tempPeakTitle: 'Nhiệt độ cực đại',
        tempPeakHelp: 'Giá trị nhiệt độ cao nhất được ghi nhận trong tập dữ liệu hiện tại.',
        statusTitle: 'Tình trạng hệ thống',
        statusSafe: 'Vận hành ổn định',
        statusAlert: 'Cần xử lý ngay',
        statusSafeHelp: (peakSmoke) => `Nồng độ khói cao nhất hiện tại là ${peakSmoke} ppm và chưa ghi nhận tín hiệu cháy.`,
        currentStatus: 'Thông số hiện tại',
        temperature: 'Nhiệt độ',
        smoke: 'Nồng độ khói',
        fire: 'Tín hiệu cháy',
        statusHigh: 'Mức cao',
        statusStable: 'Ổn định',
        statusWarning: 'Vượt chuẩn',
        statusNormal: 'Trong chuẩn',
        statusCritical: 'Khẩn cấp',
        statusWatch: 'Theo dõi',
        fireSafeValue: 'BÌNH THƯỜNG',
        fireAlertValue: 'NGUY CƠ CAO',
        tempCaption: `Ngưỡng giám sát từ ${TEMP_ALERT_THRESHOLD_C}°C`,
        smokeCaption: `Ngưỡng giám sát từ ${SMOKE_ALERT_THRESHOLD_PPM} ppm`,
        fireSafeCaption: 'Chưa ghi nhận tín hiệu lửa vượt ngưỡng cấu hình.',
        fireAlertCaption: 'Đang ghi nhận tín hiệu lửa cần được kiểm tra ngay.',
        systemInfoKicker: 'Thông tin hệ thống',
        systemInfoTitle: 'Thiết bị và hạ tầng vận hành',
        systemInfoDescription: 'Tổng hợp cảm biến, bộ điều khiển và chu kỳ cập nhật dữ liệu của hệ thống.',
        online: 'Online',
        toast: {
            success: 'Thao tác thành công',
            error: 'Không thể thực hiện',
        },
        alerts: {
            modalTitle: 'Thông báo cảnh báo hệ thống',
            modalDescription: 'Hệ thống đang ghi nhận điều kiện vận hành vượt ngưỡng an toàn. Vui lòng kiểm tra hiện trường và xác nhận trạng thái thiết bị.',
            acknowledge: 'Xác nhận',
            highTemp: 'Nhiệt độ đã vượt ngưỡng an toàn cấu hình',
            highSmoke: 'Nồng độ khói đã vượt ngưỡng giám sát',
            fireDetected: 'Đã ghi nhận tín hiệu lửa - nguy cơ cháy',
        },
        chart: {
            kicker: 'Diễn biến thời gian thực',
            title: 'Xu hướng nhiệt độ và nồng độ khói',
            description: 'Đường khói hiển thị giá trị smoke (30 mốc gần nhất).',
            note: '30 mốc dữ liệu gần nhất',
            waiting: 'Đang chờ dữ liệu đầu vào...',
            temperatureLine: 'Nhiệt độ (°C)',
            smokeLine: 'Nồng độ khói (ppm)',
        },
        stats: {
            kicker: 'Thống kê và phân tích',
            title: 'Tổng quan rủi ro vận hành',
            description: 'Tóm tắt lịch sử vượt ngưỡng và tỷ lệ trạng thái an toàn để phục vụ giám sát tổng thể.',
            records: 'bản ghi',
            totalRecords: 'Tổng số bản ghi',
            fireCount: 'Số lần ghi nhận tín hiệu cháy',
            highTemp: 'Số lần nhiệt độ cao',
            highSmoke: 'Số lần khói cao',
            tempAvgMax: 'Nhiệt độ trung bình / cực đại',
            smokeAvgMax: 'Khói trung bình / cực đại',
            safe: 'An toàn',
            fireAlert: 'Nguy cơ cháy',
            noData: 'Chưa có dữ liệu thống kê',
        },
        control: {
            kicker: 'Điều khiển thủ công',
            title: 'Bảng điều khiển tác vụ',
            description: 'Chỉ sử dụng khi cần can thiệp vận hành có kiểm soát.',
            tag: 'Manual override',
            warningTitle: 'Cảnh báo thao tác',
            warningBody: 'Các lệnh bên dưới có thể ghi đè chế độ AUTO và tác động trực tiếp đến thiết bị đầu ra. Chỉ thực hiện khi đã xác nhận hiện trường an toàn và có người phụ trách vận hành.',
            groups: {
                water: 'Hệ thống nước',
                alert: 'Báo động và cảnh báo',
                system: 'Quản trị hệ thống',
            },
            buttons: {
                pump_on: 'Kích hoạt bơm',
                pump_off: 'Ngừng bơm',
                test_alarm: 'Kiểm tra báo động',
                emergency_alert: 'Kích hoạt khẩn cấp',
                emergency_off: 'Kết thúc cảnh báo',
                full_test: 'Kiểm tra toàn bộ',
                reset_system: 'Khởi động lại hệ thống',
                all_outputs_off: 'Ngắt toàn bộ đầu ra',
            },
            descriptions: {
                pump_on: 'Kích hoạt bơm phục vụ dập lửa',
                pump_off: 'Ngừng vận hành bơm nước',
                test_alarm: 'Kiểm tra còi và đèn cảnh báo',
                emergency_alert: 'Kích hoạt chế độ cảnh báo khẩn',
                emergency_off: 'Đưa hệ thống về chế độ AUTO',
                full_test: 'Thực hiện kiểm tra tổng thể',
                reset_system: 'Khởi động lại bộ điều khiển',
                all_outputs_off: 'Ngắt LED, còi và bơm',
            },
            loading: 'Đang thực thi...',
        },
        systemInfo: [
            { label: 'Cảm biến khói', value: 'Smoke  ·  Giám sát nồng độ' },
            { label: 'Cảm biến nhiệt', value: 'DHT20' },
            { label: 'Vi điều khiển', value: 'ESP32  ·  WiFi' },
            { label: 'Chu kỳ cập nhật', value: '~2 giây  ·  MQTT' },
        ],
        feedback: {
            updating: 'Đang cập nhật...',
            pump_on: 'Đã gửi lệnh kích hoạt bơm thành công.',
            pump_off: 'Đã gửi lệnh ngừng bơm thành công.',
            test_alarm: 'Hệ thống đang thực hiện quy trình kiểm tra báo động.',
            reset_system: 'Đã gửi lệnh khởi động lại hệ thống.',
            full_test: 'Đang thực hiện quy trình kiểm tra tổng thể.',
            emergency_alert: 'Đã kích hoạt chế độ cảnh báo khẩn cấp.',
            all_outputs_off: 'Đã ngắt toàn bộ đầu ra. Hệ thống trở về trạng thái tự động.',
            emergency_off: 'Đã kết thúc cảnh báo khẩn cấp. Hệ thống quay lại chế độ AUTO.',
            error: 'Không thể thực hiện lệnh. Vui lòng kiểm tra kết nối hệ thống và thử lại.',
        },
    },
    en: {
        locale: 'en-GB',
        brandName: 'AFES Dashboard',
        brandSubtitle: 'Fire Alarm Systems',
        liveBadge: 'Real-time operations',
        title: 'Information and Control Dashboard',
        description: 'Monitor sensor data and manage control actions through a clearer, more focused operating interface.',
        updateBadge: `Refresh every ${DATA_POLL_MS / 1000}s`,
        recentRecords: 'recent records',
        activeAlerts: 'active alerts',
        headerSafe: 'System stable',
        headerAlert: 'Inspection required',
        tempPeakTitle: 'Peak temperature',
        tempPeakHelp: 'Highest temperature value recorded in the current dataset.',
        statusTitle: 'System condition',
        statusSafe: 'Operating normally',
        statusAlert: 'Immediate action required',
        statusSafeHelp: (peakSmoke) => `Current peak smoke concentration is ${peakSmoke} ppm with no fire signal detected.`,
        currentStatus: 'Current readings',
        temperature: 'Temperature',
        smoke: 'Smoke level',
        fire: 'Fire signal',
        statusHigh: 'Elevated',
        statusStable: 'Stable',
        statusWarning: 'Above limit',
        statusNormal: 'Within limit',
        statusCritical: 'Critical',
        statusWatch: 'Monitoring',
        fireSafeValue: 'NORMAL',
        fireAlertValue: 'HIGH RISK',
        tempCaption: `Monitoring threshold from ${TEMP_ALERT_THRESHOLD_C}°C`,
        smokeCaption: `Monitoring threshold from ${SMOKE_ALERT_THRESHOLD_PPM} ppm`,
        fireSafeCaption: 'No fire signal has exceeded the configured threshold.',
        fireAlertCaption: 'A fire signal is currently being detected and requires inspection.',
        systemInfoKicker: 'System information',
        systemInfoTitle: 'Devices and operating stack',
        systemInfoDescription: 'Summary of sensors, controller hardware and the system telemetry update interval.',
        online: 'Online',
        toast: {
            success: 'Action completed',
            error: 'Action failed',
        },
        alerts: {
            modalTitle: 'System alert notification',
            modalDescription: 'The system is detecting operating conditions beyond the configured safety threshold. Please inspect the site and confirm device status immediately.',
            acknowledge: 'Confirm',
            highTemp: 'Temperature has exceeded the configured safety threshold',
            highSmoke: 'Smoke concentration has exceeded the monitoring threshold',
            fireDetected: 'Fire signal detected - potential ignition risk',
        },
        chart: {
            kicker: 'Real-time trend',
            title: 'Temperature and smoke level',
            description: 'Smoke line shows the latest smoke concentration values (latest 30 points).',
            note: 'Latest 30 data points',
            waiting: 'Waiting for incoming data...',
            temperatureLine: 'Temperature (°C)',
            smokeLine: 'Smoke level (ppm)',
        },
        stats: {
            kicker: 'Stats & Insights',
            title: 'Operational risk overview',
            description: 'Summarises threshold breaches and safe-to-alert distribution for ongoing system supervision.',
            records: 'records',
            totalRecords: 'Total records',
            fireCount: 'Fire signal events',
            highTemp: 'High temperature events',
            highSmoke: 'High smoke events',
            tempAvgMax: 'Average / peak temperature',
            smokeAvgMax: 'Average / peak smoke',
            safe: 'Safe',
            fireAlert: 'Fire risk',
            noData: 'No statistical data available',
        },
        control: {
            kicker: 'Manual control',
            title: 'Control Actions',
            description: 'Use only when supervised operational intervention is required.',
            tag: 'Manual override',
            warningTitle: 'Operational warning',
            warningBody: 'The controls below can override AUTO behaviour and directly affect field devices. Execute them only after the area has been verified and a responsible operator is present.',
            groups: {
                water: 'Water system',
                alert: 'Alarm and alerting',
                system: 'System administration',
            },
            buttons: {
                pump_on: 'Activate pump',
                pump_off: 'Stop pump',
                test_alarm: 'Run alarm test',
                emergency_alert: 'Activate emergency mode',
                emergency_off: 'Clear emergency mode',
                full_test: 'Run full diagnostics',
                reset_system: 'Restart system',
                all_outputs_off: 'Disable all outputs',
            },
            descriptions: {
                pump_on: 'Activate the suppression water pump',
                pump_off: 'Stop pump operation',
                test_alarm: 'Run buzzer and LED verification',
                emergency_alert: 'Trigger emergency alert mode',
                emergency_off: 'Return the system to AUTO mode',
                full_test: 'Execute full device diagnostics',
                reset_system: 'Restart the controller',
                all_outputs_off: 'Disable LED, buzzer and pump outputs',
            },
            loading: 'Executing...',
        },
        systemInfo: [
            { label: 'Smoke sensor', value: 'Smoke  ·  Concentration monitoring' },
            { label: 'Temperature sensor', value: 'DHT20' },
            { label: 'Controller', value: 'ESP32  ·  WiFi' },
            { label: 'Update cycle', value: '~2 seconds  ·  MQTT' },
        ],
        feedback: {
            updating: 'Updating...',
            pump_on: 'Pump activation command has been submitted successfully.',
            pump_off: 'Pump stop command has been submitted successfully.',
            test_alarm: 'Alarm verification sequence is now in progress.',
            reset_system: 'System restart command has been submitted.',
            full_test: 'Full diagnostic sequence is now in progress.',
            emergency_alert: 'Emergency alert mode has been activated.',
            all_outputs_off: 'All output devices have been disabled. The system has returned to automatic mode.',
            emergency_off: 'Emergency alert mode has been cleared. The system has returned to AUTO mode.',
            error: 'Unable to complete the requested command. Please verify system connectivity and try again.',
        },
    },
};

const Dashboard = () => {
    const navigate = useNavigate();
    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
    const role = String((typeof user.role === 'string' ? user.role : user?.role?.name) || '').replace(/^ROLE_/, '');
    const isAdmin = role === 'ADMIN';
    const [language, setLanguage] = useState('vi');
    const [latestData, setLatestData] = useState({
        temperature: 0,
        smokeLevel: 0,
        fireDetected: false,
        timestamp: '',
    });
    const [historyData, setHistoryData] = useState([]);
    const [dismissedAlertKey, setDismissedAlertKey] = useState(null);
    const [toast, setToast] = useState(null);
    const copy = COPY[language];
    const activeAlerts = useMemo(() => buildAlertMessages(latestData, copy.alerts), [copy.alerts, latestData]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axiosClient.defaults.headers.common.Authorization;
        delete axiosClient.defaults.headers.common['Authorization'];
        navigate('/login');
    };

    useEffect(() => {
        if (!toast) return undefined;

        const timer = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const historyRes = await sensorApi.getHistory();
                const rawData = historyRes.data ? historyRes.data : historyRes;

                if (rawData && Array.isArray(rawData) && rawData.length > 0) {
                    const sortedData = [...rawData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    const latestTemp = sortedData.find(item => resolveSensorType(item) === 'temperature');
                    const latestSmoke = sortedData.find(item => resolveSensorType(item) === 'smoke');
                    const latestFlame = sortedData.find(item => resolveSensorType(item) === 'flame');

                    const latestTemperature = latestTemp ? Number(latestTemp.mainValue || 0) : 0;
                    const latestSmokeLevel = latestSmoke ? Number(latestSmoke.mainValue || 0) : 0;
                    const isFire = latestFlame ? Number(latestFlame.mainValue || 0) >= FLAME_ALERT_PERCENT : false;
                    const latestTimestamp = latestTemp?.timestamp
                        ?? latestSmoke?.timestamp
                        ?? latestFlame?.timestamp
                        ?? '';

                    setLatestData({
                        temperature: Number(latestTemperature.toFixed(1)),
                        smokeLevel: Number(latestSmokeLevel.toFixed(1)),
                        fireDetected: isFire,
                        timestamp: latestTimestamp,
                    });
                    setHistoryData(buildHistorySeries(rawData));
                } else {
                    setLatestData({
                        temperature: 0,
                        smokeLevel: 0,
                        fireDetected: false,
                        timestamp: '',
                    });
                    setHistoryData([]);
                }
            } catch (err) {
                console.error('Lỗi lấy dữ liệu:', err);
            }
        };

        fetchData();
        const timer = setInterval(fetchData, DATA_POLL_MS);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (timeStr) => {
        if (!timeStr) return copy.feedback.updating;
        return new Date(timeStr).toLocaleString(copy.locale);
    };

    const showToast = (type, message) => {
        setToast({
            id: Date.now(),
            type,
            title: copy.toast[type],
            message,
        });
    };

    const handleControl = async (action) => {
        try {
            let response;
            switch (action) {
                case 'pump_on':        response = await sensorApi.pumpOn();         showToast('success', copy.feedback.pump_on); break;
                case 'pump_off':       response = await sensorApi.pumpOff();        showToast('success', copy.feedback.pump_off); break;
                case 'test_alarm':     response = await sensorApi.testAlarm();      showToast('success', copy.feedback.test_alarm); break;
                case 'reset_system':   response = await sensorApi.resetSystem();    showToast('success', copy.feedback.reset_system); break;
                case 'full_test':      response = await sensorApi.fullTest();       showToast('success', copy.feedback.full_test); break;
                case 'emergency_alert':response = await sensorApi.emergencyAlert(); showToast('success', copy.feedback.emergency_alert); break;
                case 'all_outputs_off':response = await sensorApi.allOutputsOff();  showToast('success', copy.feedback.all_outputs_off); break;
                case 'emergency_off':  response = await sensorApi.emergencyOff();   showToast('success', copy.feedback.emergency_off); break;
                default:               response = await sensorApi.control(action);
            }
            console.log('Control response:', response);
        } catch (error) {
            console.error('Control error:', error);
            showToast('error', copy.feedback.error);
        }
    };

    const isAlert = activeAlerts.length > 0;
    const alertKey = useMemo(() => activeAlerts.map((a) => a.code).join('|'), [activeAlerts]);
    const showHazardModal = isAlert && dismissedAlertKey !== alertKey;
    const latestTimestampLabel = formatTime(latestData.timestamp);
    const peakTemperature = historyData.length > 0
        ? Math.max(...historyData.map((item) => Number(item.temperature || 0))).toFixed(1)
        : '0.0';
    const peakSmoke = historyData.length > 0
        ? Math.max(...historyData.map((item) => Number(item.smokeLevel || 0))).toFixed(0)
        : '0';
    const statusLabel = isAlert ? copy.headerAlert : copy.headerSafe;
    const heroStatus = isAlert ? copy.statusAlert : copy.statusSafe;
    const heroStatusDescription = isAlert
        ? activeAlerts.map((item) => item.message).join(' · ')
        : copy.statusSafeHelp(peakSmoke);

    const userActions = useMemo(
        () => ([
            {
                group: 'alert',
                buttons: [{ action: 'test_alarm', tone: 'warning' }],
            },
        ]),
        [],
    );

    return (
        <div className={`dashboard-shell${isAlert ? ' dashboard-shell--alert' : ''}`}>
            {toast && (
                <div className={`dashboard-toast dashboard-toast--${toast.type}`} role="status" aria-live="polite">
                    <div className="dashboard-toast__content">
                        <strong>{toast.title}</strong>
                        <p>{toast.message}</p>
                    </div>
                    <button
                        type="button"
                        className="dashboard-toast__close"
                        onClick={() => setToast(null)}
                        aria-label="Dismiss notification"
                    >
                        x
                    </button>
                </div>
            )}
            {showHazardModal && (
                <div
                    className="dashboard-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="hazard-modal-title"
                    onClick={() => setDismissedAlertKey(alertKey)}
                >
                    <div
                        className="dashboard-modal glass-panel"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dashboard-modal__bar" />
                        <div>
                            <h2 id="hazard-modal-title" className="dashboard-modal__title">
                                {copy.alerts.modalTitle}
                            </h2>
                            <p className="dashboard-modal__description">
                                {copy.alerts.modalDescription}
                            </p>
                            <div className="dashboard-modal__list">
                                {activeAlerts.map((a) => (
                                    <div key={a.code} className="dashboard-modal__item">
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: a.color, flexShrink: 0 }} />
                                        <span>{a.message}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                className="dashboard-modal__button"
                                type="button"
                                onClick={() => setDismissedAlertKey(alertKey)}
                            >
                                {copy.alerts.acknowledge}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-page">
                <header className="dashboard-header">
                    <div className="dashboard-brand">
                        <div className="dashboard-brand-mark">
                            <img src={LOGO_SRC} alt="AFES logo" className="dashboard-brand-logo" />
                        </div>
                        <div className="dashboard-brand-copy">
                            <strong>{copy.brandName}</strong>
                            <span>{copy.brandSubtitle}</span>
                        </div>
                    </div>
                    <div className="dashboard-header-right">
                        <div className="lang-toggle" aria-label="Language switcher">
                            <Globe2 size={14} />
                            <button
                                type="button"
                                className={`lang-toggle__button${language === 'vi' ? ' is-active' : ''}`}
                                onClick={() => setLanguage('vi')}
                            >
                                VI
                            </button>
                            <button
                                type="button"
                                className={`lang-toggle__button${language === 'en' ? ' is-active' : ''}`}
                                onClick={() => setLanguage('en')}
                            >
                                EN
                            </button>
                        </div>
                        <div className={`status-pill ${isAlert ? 'status-pill--alert' : 'status-pill--safe'}`}>
                            <div className="status-pill__dot" />
                            <span>{statusLabel}</span>
                        </div>
                        <div className={`role-pill ${isAdmin ? 'role-pill--admin' : 'role-pill--user'}`}>
                            {isAdmin ? <ShieldCheck size={14} /> : <Activity size={14} />}
                            <span>{isAdmin ? 'ADMIN' : 'USER'}</span>
                        </div>
                        <span className="dashboard-timestamp">{latestTimestampLabel}</span>
                        <button type="button" className="dashboard-logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                <main>
                    <section className="hero-panel glass-panel">
                        <div className="hero-copy">
                            <div className="hero-eyebrow">
                                <Activity size={14} />
                                {copy.liveBadge}
                            </div>
                            <h1 className="hero-title">
                                {copy.title}
                            </h1>
                            <p className="hero-description">
                                {copy.description}
                            </p>
                            <div className="hero-badges">
                                <div className="hero-badge">{copy.updateBadge}</div>
                                <div className="hero-badge">{historyData.length} {copy.recentRecords}</div>
                                <div className="hero-badge">{activeAlerts.length} {copy.activeAlerts}</div>
                            </div>
                        </div>

                        <div className="hero-side">
                            <div className="hero-side-card hero-side-card--accent">
                                <div className="metric-kicker">{copy.tempPeakTitle}</div>
                                <div className="metric-value">{peakTemperature}°C</div>
                                <div className="metric-helper">{copy.tempPeakHelp}</div>
                            </div>
                            <div className={`hero-side-card ${isAlert ? 'hero-side-card--danger' : ''}`}>
                                <div className="metric-kicker">{copy.statusTitle}</div>
                                <div className="metric-value">{heroStatus}</div>
                                <div className="metric-helper">{heroStatusDescription}</div>
                            </div>
                        </div>
                    </section>

                    {isAlert && (
                        <div className="alert-banner">
                            <BellRing size={16} />
                            <div className="alert-banner__dot" />
                            <p>{activeAlerts.map((item) => item.message).join('  ·  ')}</p>
                        </div>
                    )}

                    <section className="section-stack">
                        <div className="section-kicker">{copy.currentStatus}</div>
                        <div className="card-grid">
                            <SensorCard
                                title={copy.temperature}
                                value={latestData.temperature}
                                unit="°C"
                                color="#fb7185"
                                icon={Thermometer}
                                status={latestData.temperature >= TEMP_ALERT_THRESHOLD_C ? copy.statusHigh : copy.statusStable}
                                caption={copy.tempCaption}
                            />
                            <SensorCard
                                title={copy.smoke}
                                value={latestData.smokeLevel}
                                unit="ppm"
                                color="#f59e0b"
                                icon={Wind}
                                status={latestData.smokeLevel >= SMOKE_ALERT_THRESHOLD_PPM ? copy.statusWarning : copy.statusNormal}
                                caption={copy.smokeCaption}
                            />
                            <SensorCard
                                title={copy.fire}
                                value={latestData.fireDetected ? copy.fireAlertValue : copy.fireSafeValue}
                                unit=""
                                color={latestData.fireDetected ? '#fb7185' : '#22c55e'}
                                icon={latestData.fireDetected ? Flame : ShieldCheck}
                                status={latestData.fireDetected ? copy.statusCritical : copy.statusWatch}
                                caption={latestData.fireDetected ? copy.fireAlertCaption : copy.fireSafeCaption}
                            />
                        </div>
                    </section>

                    <section className="dashboard-grid" style={{ marginTop: '18px' }}>
                        <div className="grid-col-8">
                            <TrendChart data={historyData} copy={copy.chart} locale={copy.locale} />
                        </div>

                        <div className="grid-col-4">
                            <ControlPanel
                                onControl={handleControl}
                                copy={copy.control}
                                actions={isAdmin ? undefined : userActions}
                            />
                        </div>

                        <div className="grid-col-12">
                            <AlertStats historyData={historyData} copy={copy.stats} />
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;