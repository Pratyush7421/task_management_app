/**
 * ============================================================================
 * ADMIN PANEL PAGE
 * ============================================================================
 * Administrative interface for system management.
 * 
 * Features:
 * - View system statistics (users, tasks, roles)
 * - List all users with pagination
 * - Change user roles
 * - View user task statistics
 * 
 * Access Control:
 * - Only accessible to users with 'admin' role
 * - Protected by ProtectedRoute with requiredRole="admin"
 * 
 * State Management:
 * - users: Array of all users
 * - stats: System-wide statistics
 * - loading: Loading state
 * - error: Error messages
 * - selectedUser: User being edited (for role change modal)
 * - newRole: New role value for selected user
 * 
 * Admin Operations:
 * - View all users and their roles
 * - Change user roles (user, manager, admin)
 * - View system statistics
 * ============================================================================
 */

// React hooks for state and side effects
import { useState, useEffect } from 'react';

// API client for backend communication
import api from '../api/axios';

// Child components
import Navbar from '../components/Navbar';

/**
 * Admin Panel Page Component
 * 
 * Administrative dashboard for system management.
 * 
 * @returns {JSX.Element} Admin panel JSX
 */
export default function AdminPanel() {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    
    /**
     * Users State
     * 
     * Array of all users in the system.
     * Fetched from admin API endpoint.
     */
    const [users, setUsers] = useState([]);
    
    /**
     * Statistics State
     * 
     * System-wide statistics including:
     * - User counts by role
     * - Task counts by status
     * - Top users by task count
     */
    const [stats, setStats] = useState(null);
    
    /**
     * Loading State
     * 
     * True while fetching data from API.
     */
    const [loading, setLoading] = useState(true);
    
    /**
     * Error State
     * 
     * Error message to display to user.
     */
    const [error, setError] = useState('');
    
    /**
     * Selected User State
     * 
     * User object currently being edited (for role change).
     * null when no user is selected.
     */
    const [selectedUser, setSelectedUser] = useState(null);
    
    /**
     * New Role State
     * 
     * New role value for the selected user.
     * Updated when admin selects different role in modal.
     */
    const [newRole, setNewRole] = useState('');

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------
    
    /**
     * Fetch Data on Mount
     * 
     * Runs once when component mounts.
     * Fetches users and statistics.
     */
    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, []); // Empty dependency array = run once on mount

    /**
     * Fetch All Users
     * 
     * GET /api/v1/admin/users
     * 
     * Fetches paginated list of all users.
     * Requires admin authentication.
     */
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

    /**
     * Fetch System Statistics
     * 
     * GET /api/v1/admin/stats
     * 
     * Fetches system-wide statistics.
     * Requires admin authentication.
     */
    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Failed to load stats');
        }
    };

    // -------------------------------------------------------------------------
    // ADMIN OPERATIONS
    // -------------------------------------------------------------------------
    
    /**
     * Change User Role
     * 
     * PUT /api/v1/admin/users/:id/role
     * 
     * Updates the role of the selected user.
     * Refreshes user list and stats on success.
     * 
     * @param {string} userId - User ID to update
     */
    const handleRoleChange = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            setSelectedUser(null);  // Close modal
            setNewRole('');         // Reset role
            fetchUsers();           // Refresh user list
            fetchStats();           // Refresh statistics
        } catch (err) {
            setError('Failed to update role');
        }
    };

    // -------------------------------------------------------------------------
    // UTILITY FUNCTIONS
    // -------------------------------------------------------------------------
    
    /**
     * Get CSS Class for Role Badge
     * 
     * Returns class name based on user role.
     * Used for styling role indicators.
     * 
     * @param {string} role - 'user', 'manager', or 'admin'
     * @returns {string} CSS class name
     */
    const getRoleBadgeClass = (role) => {
        return `role-badge role-${role}`;
    };

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    
    return (
        <div className="admin-panel">
            {/* Navigation bar */}
            <Navbar />
            
            {/* Main content container */}
            <div className="container">
                <h1>Admin Dashboard</h1>
                
                {/* Error message display */}
                {error && <div className="error-message">{error}</div>}

                {/* System Statistics Section */}
                {stats && (
                    <div className="admin-stats">
                        <h2>System Overview</h2>
                        
                        {/* Statistics Cards */}
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
                        
                        {/* Role Distribution */}
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

                {/* Users List Section */}
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
                                            {/* Change Role Button */}
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
                            
                            {/* Role Selection */}
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
                            
                            {/* Action Buttons */}
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