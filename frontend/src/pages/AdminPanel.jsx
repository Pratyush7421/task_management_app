import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data.users);
        } catch (err) {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Failed to load stats');
        }
    };

    const handleRoleChange = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            setSelectedUser(null);
            setNewRole('');
            fetchUsers();
            fetchStats();
        } catch (err) {
            setError('Failed to update role');
        }
    };

    const getRoleBadgeClass = (role) => {
        return `role-badge role-${role}`;
    };

    return (
        <div className="admin-panel">
            <Navbar />
            <div className="container">
                <h1>Admin Dashboard</h1>
                
                {error && <div className="error-message">{error}</div>}

                {/* System Stats */}
                {stats && (
                    <div className="admin-stats">
                        <h2>System Overview</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h4>Total Users</h4>
                                <p>{stats.users.total}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Total Tasks</h4>
                                <p>{stats.tasks.total}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Pending Tasks</h4>
                                <p>{stats.tasks.pending}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Completed Tasks</h4>
                                <p>{stats.tasks.completed}</p>
                            </div>
                        </div>
                        
                        <h3>Users by Role</h3>
                        <div className="role-distribution">
                            {Object.entries(stats.users.byRole).map(([role, count]) => (
                                <span key={role} className={getRoleBadgeClass(role)}>
                                    {role}: {count}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Users List */}
                <h2>All Users</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="users-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={getRoleBadgeClass(user.role)}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button 
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setNewRole(user.role);
                                                }}
                                                className="btn-edit"
                                            >
                                                Change Role
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Role Change Modal */}
                {selectedUser && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3>Change Role for {selectedUser.name}</h3>
                            <p>Current role: <strong>{selectedUser.role}</strong></p>
                            <div className="form-group">
                                <label>New Role</label>
                                <select 
                                    value={newRole} 
                                    onChange={(e) => setNewRole(e.target.value)}
                                >
                                    <option value="user">User</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button 
                                    onClick={() => setSelectedUser(null)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleRoleChange(selectedUser._id)}
                                    className="btn-primary"
                                >
                                    Update Role
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}