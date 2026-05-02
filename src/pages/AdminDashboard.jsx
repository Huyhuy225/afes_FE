import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../styles/AdminDashboard.css';

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
  const [roomUsers, setRoomUsers] = useState([]);
  const [roomHistory, setRoomHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomDetailLoading, setRoomDetailLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [assignRoomSelection, setAssignRoomSelection] = useState({});
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }

    fetchUsers();
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoomId) {
      setRoomUsers([]);
      setRoomHistory([]);
      return;
    }

    fetchRoomDetails(selectedRoomId);
  }, [selectedRoomId]);

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

  const fetchRoomDetails = async (roomId) => {
    try {
      setRoomDetailLoading(true);
      const [usersResponse, historyResponse] = await Promise.all([
        axiosClient.get(`/admin/rooms/${roomId}/users`),
        axiosClient.get(`/admin/rooms/${roomId}/history`),
      ]);
      setRoomUsers(usersResponse.data || []);
      setRoomHistory(historyResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch room details:', error);
      setRoomUsers([]);
      setRoomHistory([]);
    } finally {
      setRoomDetailLoading(false);
    }
  };

  const refreshRooms = async () => {
    await fetchRooms();
    if (selectedRoomId) {
      await fetchRoomDetails(selectedRoomId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axiosClient.defaults.headers.common.Authorization;
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
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await axiosClient.delete(`/auth/users/${id}`);
      await fetchUsers();
      await refreshRooms();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
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
          alert('Please enter a password for new user');
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
      alert(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleSelectRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setActiveTab('rooms');
  };

  const handleToggleMonitoring = async (room) => {
    try {
      await axiosClient.put(`/admin/rooms/${room.id}/monitoring`, {
        enabled: !room.monitoringEnabled,
      });
      await refreshRooms();
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
      alert(error.response?.data?.message || 'Failed to update monitoring state');
    }
  };

  const handleRoomControl = async (action) => {
    if (!selectedRoomId) {
      alert('Please select a room first');
      return;
    }

    try {
      await axiosClient.post(`/admin/rooms/${selectedRoomId}/control`, { action });
      alert(`Room control sent: ${action}`);
      await fetchRoomDetails(selectedRoomId);
    } catch (error) {
      console.error('Failed to execute room control:', error);
      alert(error.response?.data?.error || error.message || 'Failed to execute room control');
    }
  };

  const assignRoomToUser = async (userId, roomId) => {
    if (!roomId) {
      alert('Please select a room to assign');
      return;
    }

    try {
      await axiosClient.put(`/admin/rooms/${roomId}/users/${userId}`);
      await fetchUsers();
      if (selectedRoomId) await fetchRoomDetails(selectedRoomId);
      await refreshRooms();
      alert('User assigned to room');
    } catch (error) {
      console.error('Failed to assign user to room:', error);
      alert(error.response?.data?.message || 'Failed to assign user');
    }
  };

  const unassignUser = async (user) => {
    if (!window.confirm('Unassign this user from their room?')) return;
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
      if (selectedRoomId) await fetchRoomDetails(selectedRoomId);
      await refreshRooms();
      alert('User unassigned');
    } catch (error) {
      console.error('Failed to unassign user:', error);
      alert(error.response?.data?.message || 'Failed to unassign user');
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-info">
          <span>Welcome, {user.fullName}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>
          Rooms
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          User Management
        </button>
      </nav>

      <div className="admin-content">
        {activeTab === 'rooms' && (
          <div className="tab-content">
            <div className="section-header">
              <div>
                <h2>Room Management</h2>
                <p>Choose a room to monitor fire status and perform room-specific actions.</p>
              </div>
              <button className="refresh-btn" onClick={refreshRooms}>Refresh</button>
            </div>

            {roomsLoading ? (
              <p>Loading rooms...</p>
            ) : (
              <div className="rooms-grid">
                {rooms.map((room) => (
                  <article key={room.id} className={`room-card ${selectedRoomId === room.id ? 'room-card--active' : ''}`}>
                    <div className="room-card__head">
                      <div>
                        <div className="room-code">{room.code}</div>
                        <h3>{room.name}</h3>
                      </div>
                      <span className={`room-badge ${room.monitoringEnabled ? 'room-badge--on' : 'room-badge--off'}`}>
                        {room.monitoringEnabled ? 'Monitoring ON' : 'Monitoring OFF'}
                      </span>
                    </div>
                    <p className="room-card__desc">{room.description || 'No description available'}</p>
                    <div className="room-card__meta">
                      <span>{room.userCount || 0} users</span>
                      <span>{selectedRoomId === room.id ? 'Selected' : 'Not selected'}</span>
                    </div>
                    <div className="room-card__actions">
                      <button className="edit-btn" onClick={() => handleSelectRoom(room.id)}>Open room</button>
                      <button className="save-btn" onClick={() => handleToggleMonitoring(room)}>
                        {room.monitoringEnabled ? 'Disable monitoring' : 'Enable monitoring'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {selectedRoom && (
              <section className="room-detail">
                <div className="section-header">
                  <div>
                    <h2>{selectedRoom.name}</h2>
                    <p>{selectedRoom.description}</p>
                  </div>
                  <span className={`room-badge ${selectedRoom.monitoringEnabled ? 'room-badge--on' : 'room-badge--off'}`}>
                    {selectedRoom.monitoringEnabled ? 'Monitoring ON' : 'Monitoring OFF'}
                  </span>
                </div>

                <div className="room-detail__stats">
                  <div className="stat-pill">
                    <strong>{selectedRoom.userCount || 0}</strong>
                    <span>Users in room</span>
                  </div>
                  <div className="stat-pill">
                    <strong>{roomHistory.length}</strong>
                    <span>Sensor records</span>
                  </div>
                  <div className="stat-pill">
                    <strong>{roomUsers.length}</strong>
                    <span>Assigned users</span>
                  </div>
                </div>

                <div className="room-detail__grid">
                  <div>
                    <h3>Room Users</h3>
                    {roomDetailLoading ? (
                      <p>Loading room users...</p>
                    ) : roomUsers.length === 0 ? (
                      <p className="no-data">No users assigned to this room</p>
                    ) : (
                      <div className="mini-table">
                        {roomUsers.map((roomUser) => (
                                  <div key={roomUser.id} className="mini-table__row">
                                    <span>{roomUser.fullName || roomUser.username}</span>
                                    <span style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                                      <span>{roomUser.role}</span>
                                      <button className="edit-btn" onClick={() => handleEdit(roomUser)}>Edit</button>
                                      <button className="delete-btn" onClick={() => unassignUser(roomUser)}>Unassign</button>
                                    </span>
                                  </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3>Recent Readings</h3>
                    {roomDetailLoading ? (
                      <p>Loading readings...</p>
                    ) : roomHistory.length === 0 ? (
                      <p className="no-data">No room sensor data yet</p>
                    ) : (
                      <div className="mini-table mini-table--stacked">
                        {roomHistory.slice(0, 5).map((reading) => (
                          <div key={reading.id} className="mini-table__row mini-table__row--stacked">
                            <div className="mini-table__row-title">
                              <strong>{reading.sensorName || 'Unknown'}</strong>
                              <span>{reading.topic}</span>
                            </div>
                            <div className="mini-table__row-meta">
                              <span>Value: {reading.mainValue ?? 'N/A'}</span>
                              <span>{new Date(reading.timestamp).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="room-detail__controls">
                  <h3>Room Control</h3>
                  <div className="button-group button-group--wrap">
                    <button className="control-btn btn-success" onClick={() => handleRoomControl('pump_on')}>Activate Pump</button>
                    <button className="control-btn btn-danger" onClick={() => handleRoomControl('pump_off')}>Stop Pump</button>
                    <button className="control-btn btn-info" onClick={() => handleRoomControl('test_alarm')}>Test Alarm</button>
                    <button className="control-btn btn-warning" onClick={() => handleRoomControl('emergency_alert')}>Emergency Mode</button>
                    <button className="control-btn btn-secondary" onClick={() => handleRoomControl('emergency_off')}>Clear Emergency</button>
                    <button className="control-btn btn-primary" onClick={() => handleRoomControl('full_test')}>Full Diagnostics</button>
                    <button className="control-btn btn-primary" onClick={() => handleRoomControl('reset_system')}>Restart System</button>
                    <button className="control-btn btn-danger" onClick={() => handleRoomControl('all_outputs_off')}>Disable All Outputs</button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="section-header">
              <div>
                <h2>User Management</h2>
                <p>Assign each user to a room and keep the login data in sync.</p>
              </div>
              <button className="add-btn" onClick={() => {
                setFormData(EMPTY_FORM);
                setEditingId(null);
                setShowForm(!showForm);
              }}>
                {showForm ? 'Cancel' : '+ Add New User'}
              </button>
            </div>

            {showForm && (
              <div className="form-container">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={editingId !== null}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password {editingId ? '(leave blank to keep current password)' : ''}</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingId ? 'Optional' : 'Enter password'}
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Room</label>
                    <select
                      value={formData.roomId}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    >
                      <option value="">No room</option>
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
                      Active
                    </label>
                  </div>
                </div>
                <button onClick={handleSave} className="save-btn">Save</button>
              </div>
            )}

            {loading ? (
              <p>Loading users...</p>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>Room</th>
                    <th>Assign</th>
                    <th>Status</th>
                    <th>Actions</th>
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
                      <td>{item.roomName || 'No room'}</td>
                      <td>
                        <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                          <select
                            value={assignRoomSelection[item.id] ?? (item.roomId || '')}
                            onChange={(e) => setAssignRoomSelection({ ...assignRoomSelection, [item.id]: e.target.value })}
                          >
                            <option value="">No room</option>
                            {rooms.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <button className="save-btn" onClick={() => assignRoomToUser(item.id, assignRoomSelection[item.id] ?? (item.roomId || ''))}>
                            Assign
                          </button>
                        </div>
                      </td>
                      <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button onClick={() => handleEdit(item)} className="edit-btn">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="delete-btn">Delete</button>
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
  );
}
