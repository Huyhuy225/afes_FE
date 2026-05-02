import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplet,
  DropletOff,
  Globe2,
  Megaphone,
  PowerOff,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Siren,
  TestTube2,
  X,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import {
  FLAME_ALERT_PERCENT,
  MQ2_SMOKE_ALERT_THRESHOLD_PPM,
  TEMP_ALERT_THRESHOLD_C,
} from '../constants/sensors';
import '../styles/AdminDashboard.css';

const LOGO_SRC = `${import.meta.env.BASE_URL}afes-logo.png`;

const COPY = {
  vi: {
    locale: 'vi-VN',
    brandSubtitle: 'Bảng điều khiển quản trị',
    welcome: (name) => `Xin chào, ${name || 'Admin'}`,
    logout: 'Đăng xuất',
    tabs: {
      rooms: 'Phòng',
      users: 'Quản lý người dùng',
    },
    rooms: {
      overviewTitle: 'Tổng quan phòng',
      overviewDesc: 'Xem nhanh trạng thái các phòng. Bấm “Xem chi tiết” để thao tác phòng cụ thể.',
      refresh: 'Làm mới',
      broadcastTitle: 'Phát lệnh',
      broadcastHelp: 'Kích hoạt còi ở tất cả phòng',
      broadcastButton: 'Kích hoạt còi (Tất cả phòng)',
      loadingRooms: 'Đang tải danh sách phòng...',
      noRooms: 'Không có phòng nào',
      temp: 'Nhiệt độ',
      smoke: 'Khói',
      flame: 'Lửa',
      updated: 'Cập nhật',
      monitoringOn: 'Giám sát BẬT',
      monitoringOff: 'Giám sát TẮT',
      usersCount: (n) => `${n || 0} người dùng`,
      viewDetails: 'Xem chi tiết',
      enableMonitoring: 'Bật giám sát',
      disableMonitoring: 'Tắt giám sát',
    },
    modal: {
      title: 'Chi tiết phòng',
      close: 'Đóng',
      loading: 'Đang tải dữ liệu phòng...',
    },
    stats: {
      usersInRoom: 'Người dùng trong phòng',
      sensorRecords: 'Bản ghi cảm biến',
      assignedUsers: 'Người dùng được gán',
      currentTemp: 'Nhiệt độ hiện tại',
      currentSmoke: 'Khói hiện tại',
      currentFlame: 'Tín hiệu lửa',
      lastUpdated: 'Cập nhật lúc',
      statusSafe: 'Ổn định',
      statusAlert: 'Cảnh báo',
    },
    control: {
      title: 'Điều khiển phòng',
      sending: 'Đang gửi...',
      selectRoomFirst: 'Vui lòng chọn phòng trước',
      sent: (action) => `Đã gửi lệnh: ${action}`,
      error: 'Không thể thực hiện lệnh. Vui lòng thử lại.',
      actions: {
        pump_on: 'Bật bơm',
        pump_off: 'Tắt bơm',
        test_alarm: 'Kích hoạt còi',
        emergency_alert: 'Chế độ khẩn cấp',
        emergency_off: 'Tắt khẩn cấp',
        full_test: 'Chẩn đoán',
        reset_system: 'Khởi động lại hệ thống',
        all_outputs_off: 'Tắt toàn bộ output',
      },
      broadcastSent: 'Đã phát lệnh: kích hoạt còi tất cả phòng',
    },
    roomUsers: {
      title: 'Người dùng của phòng',
      loading: 'Đang tải người dùng...',
      empty: 'Chưa có người dùng nào được gán cho phòng này',
      edit: 'Sửa',
      unassign: 'Bỏ gán',
      confirmUnassign: 'Bỏ gán người dùng này khỏi phòng?',
      unassigned: 'Đã bỏ gán người dùng',
    },
    users: {
      title: 'Quản lý người dùng',
      desc: 'Gán người dùng vào phòng và quản lý thông tin đăng nhập.',
      addNew: '+ Thêm người dùng',
      cancel: 'Hủy',
      save: 'Lưu',
      loading: 'Đang tải danh sách người dùng...',
      confirmDelete: 'Bạn chắc chắn muốn xoá người dùng này?',
      deleteError: 'Không thể xoá người dùng',
      saveError: 'Không thể lưu người dùng',
      newPasswordRequired: 'Vui lòng nhập mật khẩu cho người dùng mới',
      form: {
        username: 'Tên đăng nhập',
        email: 'Email',
        fullName: 'Họ và tên',
        password: (editing) => `Mật khẩu${editing ? ' (để trống nếu không đổi)' : ''}`,
        passwordPlaceholder: (editing) => (editing ? 'Không bắt buộc' : 'Nhập mật khẩu'),
        role: 'Vai trò',
        room: 'Phòng',
        noRoom: 'Không có phòng',
        active: 'Kích hoạt',
      },
      table: {
        id: 'ID',
        username: 'Tên đăng nhập',
        email: 'Email',
        fullName: 'Họ và tên',
        role: 'Vai trò',
        room: 'Phòng',
        assign: 'Gán phòng',
        status: 'Trạng thái',
        actions: 'Thao tác',
      },
      assign: 'Gán',
      edit: 'Sửa',
      delete: 'Xoá',
      activeStatus: 'Hoạt động',
      inactiveStatus: 'Ngưng',
      selectRoomToAssign: 'Vui lòng chọn phòng để gán',
      assigned: 'Đã gán người dùng vào phòng',
      assignError: 'Không thể gán người dùng',
    },
    monitoring: {
      updateError: 'Không thể cập nhật trạng thái giám sát',
    },
  },
  en: {
    locale: 'en-US',
    brandSubtitle: 'Admin Console',
    welcome: (name) => `Welcome, ${name || 'Admin'}`,
    logout: 'Logout',
    tabs: {
      rooms: 'Rooms',
      users: 'User Management',
    },
    rooms: {
      overviewTitle: 'Room Overview',
      overviewDesc: 'Quick view of room status. Use “View details” to control a specific room.',
      refresh: 'Refresh',
      broadcastTitle: 'Broadcast',
      broadcastHelp: 'Activate all sirens in all rooms',
      broadcastButton: 'Broadcast Siren (All rooms)',
      loadingRooms: 'Loading rooms...',
      noRooms: 'No rooms found',
      temp: 'Temp',
      smoke: 'Smoke',
      flame: 'Flame',
      updated: 'Updated',
      monitoringOn: 'Monitoring ON',
      monitoringOff: 'Monitoring OFF',
      usersCount: (n) => `${n || 0} users`,
      viewDetails: 'View details',
      enableMonitoring: 'Enable monitoring',
      disableMonitoring: 'Disable monitoring',
    },
    modal: {
      title: 'Room Details',
      close: 'Close',
      loading: 'Loading room details...',
    },
    stats: {
      usersInRoom: 'Users in room',
      sensorRecords: 'Sensor records',
      assignedUsers: 'Assigned users',
      currentTemp: 'Current temperature',
      currentSmoke: 'Current smoke',
      currentFlame: 'Flame signal',
      lastUpdated: 'Last updated',
      statusSafe: 'Stable',
      statusAlert: 'Alert',
    },
    control: {
      title: 'Room Control',
      sending: 'Sending...',
      selectRoomFirst: 'Please select a room first',
      sent: (action) => `Room control sent: ${action}`,
      error: 'Failed to execute room control',
      actions: {
        pump_on: 'Activate Pump',
        pump_off: 'Stop Pump',
        test_alarm: 'Activate Siren',
        emergency_alert: 'Emergency Mode',
        emergency_off: 'Clear Emergency',
        full_test: 'Full Diagnostics',
        reset_system: 'Restart System',
        all_outputs_off: 'Disable All Outputs',
      },
      broadcastSent: 'Broadcast alarm sent: all sirens activated',
    },
    roomUsers: {
      title: 'Room Users',
      loading: 'Loading room users...',
      empty: 'No users assigned to this room',
      edit: 'Edit',
      unassign: 'Unassign',
      confirmUnassign: 'Unassign this user from their room?',
      unassigned: 'User unassigned',
    },
    users: {
      title: 'User Management',
      desc: 'Assign each user to a room and keep the login data in sync.',
      addNew: '+ Add New User',
      cancel: 'Cancel',
      save: 'Save',
      loading: 'Loading users...',
      confirmDelete: 'Are you sure you want to delete this user?',
      deleteError: 'Failed to delete user',
      saveError: 'Failed to save user',
      newPasswordRequired: 'Please enter a password for new user',
      form: {
        username: 'Username',
        email: 'Email',
        fullName: 'Full Name',
        password: (editing) => `Password${editing ? ' (leave blank to keep current password)' : ''}`,
        passwordPlaceholder: (editing) => (editing ? 'Optional' : 'Enter password'),
        role: 'Role',
        room: 'Room',
        noRoom: 'No room',
        active: 'Active',
      },
      table: {
        id: 'ID',
        username: 'Username',
        email: 'Email',
        fullName: 'Full Name',
        role: 'Role',
        room: 'Room',
        assign: 'Assign',
        status: 'Status',
        actions: 'Actions',
      },
      assign: 'Assign',
      edit: 'Edit',
      delete: 'Delete',
      activeStatus: 'Active',
      inactiveStatus: 'Inactive',
      selectRoomToAssign: 'Please select a room to assign',
      assigned: 'User assigned to room',
      assignError: 'Failed to assign user',
    },
    monitoring: {
      updateError: 'Failed to update monitoring state',
    },
  },
};

const EMPTY_FORM = {
  username: '',
  email: '',
  fullName: '',
  password: '',
  role: 'USER',
  isActive: true,
  roomId: '',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomSummaries, setRoomSummaries] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);
  const [roomOverview, setRoomOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomSummaryLoading, setRoomSummaryLoading] = useState(false);
  const [roomDetailLoading, setRoomDetailLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assignRoomSelection, setAssignRoomSelection] = useState({});
  const [controlLoading, setControlLoading] = useState(null);
  const [language, setLanguage] = useState('vi');
  const navigate = useNavigate();

  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const copy = COPY[language];

  useEffect(() => {
    if (user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    fetchUsers();
    fetchRooms();
    fetchRoomSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRoomId || !detailsOpen) {
      setRoomUsers([]);
      setRoomOverview(null);
      return;
    }

    fetchRoomDetails(selectedRoomId);
  }, [detailsOpen, selectedRoomId]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || null,
    [rooms, selectedRoomId],
  );

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const response = await axiosClient.get('/admin/rooms');
      const nextRooms = response.data || [];
      setRooms(nextRooms);
      if (!selectedRoomId && nextRooms.length > 0) {
        setSelectedRoomId(nextRooms[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchRoomSummaries = async () => {
    try {
      setRoomSummaryLoading(true);
      const response = await axiosClient.get('/admin/rooms/summary');
      setRoomSummaries(response.data || []);
    } catch (error) {
      console.error('Failed to fetch room summaries:', error);
      setRoomSummaries([]);
    } finally {
      setRoomSummaryLoading(false);
    }
  };

  const fetchRoomDetails = async (roomId) => {
    try {
      setRoomDetailLoading(true);
      const [usersResponse, overviewResponse] = await Promise.all([
        axiosClient.get(`/admin/rooms/${roomId}/users`),
        axiosClient.get(`/admin/rooms/${roomId}/overview`),
      ]);
      setRoomUsers(usersResponse.data || []);
      setRoomOverview(overviewResponse.data || null);
    } catch (error) {
      console.error('Failed to fetch room details:', error);
      setRoomUsers([]);
      setRoomOverview(null);
    } finally {
      setRoomDetailLoading(false);
    }
  };

  const refreshRooms = async () => {
    await fetchRooms();
    await fetchRoomSummaries();
    if (selectedRoomId && detailsOpen) {
      await fetchRoomDetails(selectedRoomId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axiosClient.defaults.headers.common.Authorization;
    delete axiosClient.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      username: item.username || '',
      email: item.email || '',
      fullName: item.fullName || '',
      password: '',
      role: item.role || 'USER',
      isActive: item.isActive !== false,
      roomId: item.roomId || '',
    });
    setShowForm(true);
    setActiveTab('users');
  };

  const handleDelete = async (id) => {
    if (!window.confirm(copy.users.confirmDelete)) {
      return;
    }

    try {
      await axiosClient.delete(`/auth/users/${id}`);
      await fetchUsers();
      await refreshRooms();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || copy.users.deleteError);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        isActive: formData.isActive,
        role: { name: formData.role || 'USER' },
        room: formData.roomId ? { id: Number(formData.roomId) } : null,
      };

      if (!editingId) {
        if (!formData.password) {
          alert(copy.users.newPasswordRequired);
          return;
        }

        payload.password = formData.password;
        await axiosClient.post('/auth/users', payload);
      } else {
        await axiosClient.put(`/auth/users/${editingId}`, payload);
      }

      await fetchUsers();
      await refreshRooms();
      setShowForm(false);
      setFormData(EMPTY_FORM);
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save user:', error);
      alert(error.response?.data?.message || copy.users.saveError);
    }
  };

  const handleOpenRoomDetails = (roomId) => {
    setSelectedRoomId(roomId);
    setDetailsOpen(true);
    setActiveTab('rooms');
  };

  const handleCloseRoomDetails = () => {
    setDetailsOpen(false);
  };

  const handleToggleMonitoring = async (room) => {
    try {
      await axiosClient.put(`/admin/rooms/${room.id}/monitoring`, {
        enabled: !room.monitoringEnabled,
      });
      await refreshRooms();
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
      alert(error.response?.data?.message || copy.monitoring.updateError);
    }
  };

  const formatSummaryNumber = (value, decimals = 0) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    const num = Number(value);
    if (decimals <= 0) return String(Math.round(num));
    return num.toFixed(decimals);
  };

  const formatSummaryTime = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString(copy.locale);
    } catch {
      return '—';
    }
  };

  const handleRoomControl = async (action) => {
    if (!selectedRoomId) {
      alert(copy.control.selectRoomFirst);
      return;
    }

    try {
      setControlLoading(action);
      await axiosClient.post(`/admin/rooms/${selectedRoomId}/control`, { action });
      alert(copy.control.sent(action));
      if (detailsOpen) await fetchRoomDetails(selectedRoomId);
    } catch (error) {
      console.error('Failed to execute room control:', error);
      alert(error.response?.data?.error || error.message || copy.control.error);
    } finally {
      setControlLoading(null);
    }
  };

  const handleBroadcastAlarm = async () => {
    try {
      setControlLoading('broadcast_alarm');
      await axiosClient.post('/admin/rooms/broadcast-alarm');
      alert(copy.control.broadcastSent);
    } catch (error) {
      console.error('Failed to broadcast alarm:', error);
      alert(error.response?.data?.error || error.message || copy.control.error);
    } finally {
      setControlLoading(null);
    }
  };

  const assignRoomToUser = async (userId, roomId) => {
    if (!roomId) {
      alert(copy.users.selectRoomToAssign);
      return;
    }

    try {
      await axiosClient.put(`/admin/rooms/${roomId}/users/${userId}`);
      await fetchUsers();
      if (selectedRoomId && detailsOpen) await fetchRoomDetails(selectedRoomId);
      await refreshRooms();
      alert(copy.users.assigned);
    } catch (error) {
      console.error('Failed to assign user to room:', error);
      alert(error.response?.data?.message || copy.users.assignError);
    }
  };

  const unassignUser = async (user) => {
    if (!window.confirm(copy.roomUsers.confirmUnassign)) return;
    try {
      const payload = {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive !== false,
        role: { name: user.role || 'USER' },
        room: null,
      };
      await axiosClient.put(`/auth/users/${user.id}`, payload);
      await fetchUsers();
      if (selectedRoomId && detailsOpen) await fetchRoomDetails(selectedRoomId);
      await refreshRooms();
      alert(copy.roomUsers.unassigned);
    } catch (error) {
      console.error('Failed to unassign user:', error);
      alert(error.response?.data?.message || copy.users.assignError);
    }
  };

  const overviewSummary = roomOverview?.summary || roomSummaries.find((s) => s.id === selectedRoomId) || null;
  const currentTemp = Number(overviewSummary?.temperature ?? 0);
  const currentSmoke = Number(overviewSummary?.smokeTotal ?? 0);
  const currentFlame = Number(overviewSummary?.flame ?? 0);
  const tempAlert = overviewSummary?.temperature != null && currentTemp >= TEMP_ALERT_THRESHOLD_C;
  const smokeAlert = overviewSummary?.smokeTotal != null && currentSmoke >= MQ2_SMOKE_ALERT_THRESHOLD_PPM;
  const flameAlert = overviewSummary?.flame != null && currentFlame >= FLAME_ALERT_PERCENT;
  const hasAnyAlert = tempAlert || smokeAlert || flameAlert;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-page">
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <div className="dashboard-brand-mark">
              <img src={LOGO_SRC} alt="AFES logo" className="dashboard-brand-logo" />
            </div>
            <div className="dashboard-brand-copy">
              <strong>AFES Dashboard</strong>
              <span>{copy.brandSubtitle}</span>
            </div>
          </div>
          <div className="dashboard-header-right">
            <div className="lang-toggle" aria-label="Language switcher" style={{ marginRight: 8 }}>
              <button
                type="button"
                className={`lang-toggle__button${language === 'vi' ? ' is-active' : ''}`}
                onClick={() => setLanguage('vi')}
                title="Tiếng Việt"
              >
                <Globe2 size={14} /> VI
              </button>
              <button
                type="button"
                className={`lang-toggle__button${language === 'en' ? ' is-active' : ''}`}
                onClick={() => setLanguage('en')}
                title="English"
              >
                <Globe2 size={14} /> EN
              </button>
            </div>
            <span className="dashboard-timestamp">{copy.welcome(user.fullName)}</span>
            <div className="role-pill role-pill--admin">
              <ShieldCheck size={14} />
              <span>ADMIN</span>
            </div>
            <button type="button" onClick={handleLogout} className="dashboard-logout-btn">{copy.logout}</button>
          </div>
        </header>

        <nav className="admin-tabs glass-panel">
          <button className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>
            {copy.tabs.rooms}
          </button>
          <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            {copy.tabs.users}
          </button>
        </nav>

        <div className="admin-content">
        {activeTab === 'rooms' && (
          <div className="tab-content glass-panel">
            <div className="section-header">
              <div>
                <h2>{copy.rooms.overviewTitle}</h2>
                <p>{copy.rooms.overviewDesc}</p>
              </div>
              <button className="refresh-btn" onClick={refreshRooms}>{copy.rooms.refresh}</button>
            </div>

            <div className="room-detail__controls" style={{ marginTop: 10 }}>
              <h3>{copy.rooms.broadcastTitle}</h3>
              <div className="control-buttons" style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className={`control-button control-button--danger${controlLoading === 'broadcast_alarm' ? ' is-loading' : ''}`}
                  onClick={handleBroadcastAlarm}
                  disabled={controlLoading !== null}
                  title={copy.rooms.broadcastHelp}
                >
                  {controlLoading === 'broadcast_alarm' ? (
                    copy.control.sending
                  ) : (
                    <>
                      <Megaphone size={16} />
                      {copy.rooms.broadcastButton}
                    </>
                  )}
                </button>
              </div>
            </div>

            {roomsLoading || roomSummaryLoading ? (
              <p>{copy.rooms.loadingRooms}</p>
            ) : roomSummaries.length === 0 ? (
              <p className="no-data">{copy.rooms.noRooms}</p>
            ) : (
              <div className="mini-table" style={{ marginTop: 14 }}>
                {roomSummaries.map((summary) => {
                  const isSelected = selectedRoomId === summary.id;
                  const room = rooms.find((r) => r.id === summary.id) || summary;
                  return (
                    <div
                      key={summary.id}
                      className="mini-table__row"
                      style={{
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: isSelected ? 'rgba(31, 79, 147, 0.08)' : undefined,
                        borderRadius: 14,
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'grid', gap: 4, minWidth: 220 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--text)' }}>{summary.code}</strong>
                          <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{summary.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-2)' }}>
                          <span title={copy.rooms.temp}>
                            {copy.rooms.temp}: <strong style={{ color: 'var(--text)' }}>{formatSummaryNumber(summary.temperature, 1)}°C</strong>
                          </span>
                          <span title={copy.rooms.smoke}>
                            {copy.rooms.smoke}: <strong style={{ color: 'var(--text)' }}>{formatSummaryNumber(summary.smokeTotal, 0)}</strong>
                          </span>
                          <span title={copy.rooms.flame}>
                            {copy.rooms.flame}: <strong style={{ color: 'var(--text)' }}>{formatSummaryNumber(summary.flame, 0)}</strong>
                          </span>
                          <span title={copy.rooms.updated}>
                            {copy.rooms.updated}: <strong style={{ color: 'var(--text)' }}>{formatSummaryTime(summary.updatedAt)}</strong>
                          </span>
                        </div>
                      </div>

                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span className={`room-badge ${summary.monitoringEnabled ? 'room-badge--on' : 'room-badge--off'}`}>
                          {summary.monitoringEnabled ? copy.rooms.monitoringOn : copy.rooms.monitoringOff}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{copy.rooms.usersCount(summary.userCount)}</span>
                        <button className="edit-btn" onClick={() => handleOpenRoomDetails(summary.id)}>{copy.rooms.viewDetails}</button>
                        <button className="save-btn" onClick={() => handleToggleMonitoring(room)}>
                          {summary.monitoringEnabled ? copy.rooms.disableMonitoring : copy.rooms.enableMonitoring}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {detailsOpen && selectedRoomId && (
              <div
                className="dashboard-modal-overlay"
                role="presentation"
                onMouseDown={handleCloseRoomDetails}
              >
                <div
                  className="dashboard-modal dashboard-modal--wide dashboard-modal--tall glass-panel"
                  role="dialog"
                  aria-modal="true"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0 }}>{copy.modal.title}</h2>
                        {overviewSummary && (
                          <span className={`room-badge ${overviewSummary.monitoringEnabled ? 'room-badge--on' : 'room-badge--off'}`}>
                            {overviewSummary.monitoringEnabled ? copy.rooms.monitoringOn : copy.rooms.monitoringOff}
                          </span>
                        )}
                        <span className={`status-pill ${hasAnyAlert ? 'status-pill--warning' : 'status-pill--stable'}`}>
                          {hasAnyAlert ? (
                            <>
                              <ShieldAlert size={14} /> {copy.stats.statusAlert}
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} /> {copy.stats.statusSafe}
                            </>
                          )}
                        </span>
                      </div>
                      {selectedRoom && (
                        <div style={{ color: 'var(--text-2)', fontSize: 13 }}>
                          <strong style={{ color: 'var(--text)' }}>{selectedRoom.code}</strong> · {selectedRoom.name}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="control-button control-button--neutral"
                      onClick={handleCloseRoomDetails}
                      title={copy.modal.close}
                      style={{ padding: '10px 12px', borderRadius: 12 }}
                    >
                      <X size={16} /> {copy.modal.close}
                    </button>
                  </div>

                  {roomDetailLoading ? (
                    <p>{copy.modal.loading}</p>
                  ) : (
                    <section className="room-detail" style={{ margin: 0 }}>
                      <div className="room-detail__stats" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                        <div className="stat-pill">
                          <strong>{formatSummaryNumber(overviewSummary?.temperature, 1)}°C</strong>
                          <span>{copy.stats.currentTemp}</span>
                        </div>
                        <div className="stat-pill">
                          <strong>{formatSummaryNumber(overviewSummary?.smokeTotal, 0)}</strong>
                          <span>{copy.stats.currentSmoke}</span>
                        </div>
                        <div className="stat-pill">
                          <strong>{formatSummaryNumber(overviewSummary?.flame, 0)}</strong>
                          <span>{copy.stats.currentFlame}</span>
                        </div>
                        <div className="stat-pill">
                          <strong>{roomOverview?.sensorRecordCount ?? '—'}</strong>
                          <span>{copy.stats.sensorRecords}</span>
                        </div>
                      </div>

                      <div className="mini-table" style={{ marginBottom: 16 }}>
                        <div className="mini-table__row">
                          <span style={{ color: 'var(--text-2)' }}>{copy.stats.lastUpdated}</span>
                          <strong style={{ color: 'var(--text)' }}>{formatSummaryTime(overviewSummary?.updatedAt)}</strong>
                        </div>
                        <div className="mini-table__row">
                          <span style={{ color: 'var(--text-2)' }}>{copy.stats.usersInRoom}</span>
                          <strong style={{ color: 'var(--text)' }}>{overviewSummary?.userCount ?? selectedRoom?.userCount ?? 0}</strong>
                        </div>
                        <div className="mini-table__row">
                          <span style={{ color: 'var(--text-2)' }}>{copy.stats.assignedUsers}</span>
                          <strong style={{ color: 'var(--text)' }}>{roomUsers.length}</strong>
                        </div>
                      </div>

                      <div className="room-detail__controls">
                        <h3>{copy.control.title}</h3>
                        <div className="control-buttons" style={{ marginTop: '10px' }}>
                          <button type="button" className={`control-button control-button--primary${controlLoading === 'pump_on' ? ' is-loading' : ''}`} onClick={() => handleRoomControl('pump_on')} disabled={controlLoading !== null}>
                            {controlLoading === 'pump_on' ? (
                              copy.control.sending
                            ) : (
                              <>
                                <Droplet size={16} />
                                {copy.control.actions.pump_on}
                              </>
                            )}
                          </button>
                          <button type="button" className={`control-button control-button--neutral${controlLoading === 'pump_off' ? ' is-loading' : ''}`} onClick={() => handleRoomControl('pump_off')} disabled={controlLoading !== null}>
                            {controlLoading === 'pump_off' ? (
                              copy.control.sending
                            ) : (
                              <>
                                <DropletOff size={16} />
                                {copy.control.actions.pump_off}
                              </>
                            )}
                          </button>
                          <button type="button" className={`control-button control-button--warning${controlLoading === 'test_alarm' ? ' is-loading' : ''}`} onClick={() => handleRoomControl('test_alarm')} disabled={controlLoading !== null}>
                            {controlLoading === 'test_alarm' ? (
                              copy.control.sending
                            ) : (
                              <>
                                <Siren size={16} />
                                {copy.control.actions.test_alarm}
                              </>
                            )}
                          </button>
                          <button type="button" className={`control-button control-button--danger${controlLoading === 'emergency_alert' ? ' is-loading' : ''}`} onClick={() => handleRoomControl('emergency_alert')} disabled={controlLoading !== null}>
                            {controlLoading === 'emergency_alert' ? (
                              copy.control.sending
                            ) : (
                              <>
                                <ShieldAlert size={16} />
                                {copy.control.actions.emergency_alert}
                              </>
                            )}
                          </button>
                          <button type="button" className={`control-button control-button--success${controlLoading === 'emergency_off' ? ' is-loading' : ''}`} onClick={() => handleRoomControl('emergency_off')} disabled={controlLoading !== null}>
                            {controlLoading === 'emergency_off' ? (
                              copy.control.sending
                            ) : (
                              <>
                                <ShieldOff size={16} />
                                {copy.control.actions.emergency_off}
                              </>
                            )}
                          </button>
                          <button type="button" className={`control-button control-button--info${controlLoading === 'full_test' ? ' is-loading' : ''}`} onClick={() => handleRoomControl('full_test')} disabled={controlLoading !== null}>
                            {controlLoading === 'full_test' ? (
                              copy.control.sending
                            ) : (
                              <>
                                <TestTube2 size={16} />
                                {copy.control.actions.full_test}
                              </>
                            )}
                          </button>
                          <button type="button" className={`control-button control-button--accent${controlLoading === 'reset_system' ? ' is-loading' : ''}`} onClick={() => handleRoomControl('reset_system')} disabled={controlLoading !== null}>
                            {controlLoading === 'reset_system' ? (
                              copy.control.sending
                            ) : (
                              <>
                                <RefreshCcw size={16} />
                                {copy.control.actions.reset_system}
                              </>
                            )}
                          </button>
                          <button type="button" className={`control-button control-button--neutral${controlLoading === 'all_outputs_off' ? ' is-loading' : ''}`} onClick={() => handleRoomControl('all_outputs_off')} disabled={controlLoading !== null}>
                            {controlLoading === 'all_outputs_off' ? (
                              copy.control.sending
                            ) : (
                              <>
                                <PowerOff size={16} />
                                {copy.control.actions.all_outputs_off}
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="room-detail__grid" style={{ marginBottom: 0 }}>
                        <div>
                          <h3>{copy.roomUsers.title}</h3>
                          {roomDetailLoading ? (
                            <p>{copy.roomUsers.loading}</p>
                          ) : roomUsers.length === 0 ? (
                            <p className="no-data">{copy.roomUsers.empty}</p>
                          ) : (
                            <div className="mini-table">
                              {roomUsers.map((roomUser) => (
                                <div key={roomUser.id} className="mini-table__row">
                                  <span>{roomUser.fullName || roomUser.username}</span>
                                  <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span>{roomUser.role}</span>
                                    <button className="edit-btn" onClick={() => handleEdit(roomUser)}>{copy.roomUsers.edit}</button>
                                    <button className="delete-btn" onClick={() => unassignUser(roomUser)}>{copy.roomUsers.unassign}</button>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <h3>{copy.stats.statusAlert}</h3>
                          <div className="mini-table">
                            <div className="mini-table__row">
                              <span style={{ color: 'var(--text-2)' }}>{copy.rooms.temp}</span>
                              <strong style={{ color: 'var(--text)' }}>{tempAlert ? copy.stats.statusAlert : copy.stats.statusSafe}</strong>
                            </div>
                            <div className="mini-table__row">
                              <span style={{ color: 'var(--text-2)' }}>{copy.rooms.smoke}</span>
                              <strong style={{ color: 'var(--text)' }}>{smokeAlert ? copy.stats.statusAlert : copy.stats.statusSafe}</strong>
                            </div>
                            <div className="mini-table__row">
                              <span style={{ color: 'var(--text-2)' }}>{copy.rooms.flame}</span>
                              <strong style={{ color: 'var(--text)' }}>{flameAlert ? copy.stats.statusAlert : copy.stats.statusSafe}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content glass-panel">
            <div className="section-header">
              <div>
                <h2>{copy.users.title}</h2>
                <p>{copy.users.desc}</p>
              </div>
              <button className="add-btn" onClick={() => {
                setFormData(EMPTY_FORM);
                setEditingId(null);
                setShowForm(!showForm);
              }}>
                {showForm ? copy.users.cancel : copy.users.addNew}
              </button>
            </div>

            {showForm && (
              <div className="form-container">
                <div className="form-grid">
                  <div className="form-group">
                    <label>{copy.users.form.username}</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={editingId !== null}
                    />
                  </div>
                  <div className="form-group">
                    <label>{copy.users.form.email}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{copy.users.form.fullName}</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{copy.users.form.password(Boolean(editingId))}</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={copy.users.form.passwordPlaceholder(Boolean(editingId))}
                    />
                  </div>
                  <div className="form-group">
                    <label>{copy.users.form.role}</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{copy.users.form.room}</label>
                    <select
                      value={formData.roomId}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    >
                      <option value="">{copy.users.form.noRoom}</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group form-group--inline">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.isActive !== false}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      {copy.users.form.active}
                    </label>
                  </div>
                </div>
                <button onClick={handleSave} className="save-btn">{copy.users.save}</button>
              </div>
            )}

            {loading ? (
              <p>{copy.users.loading}</p>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{copy.users.table.id}</th>
                    <th>{copy.users.table.username}</th>
                    <th>{copy.users.table.email}</th>
                    <th>{copy.users.table.fullName}</th>
                    <th>{copy.users.table.role}</th>
                    <th>{copy.users.table.room}</th>
                    <th>{copy.users.table.assign}</th>
                    <th>{copy.users.table.status}</th>
                    <th>{copy.users.table.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.username}</td>
                      <td>{item.email}</td>
                      <td>{item.fullName}</td>
                      <td><span className={`role-badge ${item.role}`}>{item.role}</span></td>
                      <td>{item.roomName || copy.users.form.noRoom}</td>
                      <td>
                        <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                          <select
                            value={assignRoomSelection[item.id] ?? (item.roomId || '')}
                            onChange={(e) => setAssignRoomSelection({ ...assignRoomSelection, [item.id]: e.target.value })}
                          >
                            <option value="">{copy.users.form.noRoom}</option>
                            {rooms.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <button className="save-btn" onClick={() => assignRoomToUser(item.id, assignRoomSelection[item.id] ?? (item.roomId || ''))}>
                            {copy.users.assign}
                          </button>
                        </div>
                      </td>
                      <td>{item.isActive ? copy.users.activeStatus : copy.users.inactiveStatus}</td>
                      <td>
                        <button onClick={() => handleEdit(item)} className="edit-btn">{copy.users.edit}</button>
                        <button onClick={() => handleDelete(item.id)} className="delete-btn">{copy.users.delete}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
