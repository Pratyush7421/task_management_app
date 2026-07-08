import { useState, useEffect } from 'react';
import api from '../api/axios';

const getInitialFormData = () => ({
    userId: '',
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: ''
});

export default function AdminTaskForm({ onSubmit, onCancel, resetKey = 0 }) { // form for admin to create tasks for users
    const [formData, setFormData] = useState(getInitialFormData());
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(true);

    useEffect(() => { // fetches users list when component mounts or resets
        fetchUsers();
        setFormData(getInitialFormData());
    }, [resetKey]);

    const fetchUsers = async () => { // loads users from admin API
        try {
            setUsersLoading(true);
            const response = await api.get('/admin/users');
            setUsers(response.data.users);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleChange = (e) => { // updates form field on input change
        setFormData({ 
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => { // submits form data to parent
        e.preventDefault();
        
        if (!formData.userId) {
            alert('Please select a user');
            return;
        }
        
        onSubmit(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3>Create Task for User</h3>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Select User *</label>
                            {usersLoading ? (
                                <select disabled>
                                    <option>Loading users...</option>
                                </select>
                            ) : (
                                <select 
                                    name="userId" 
                                    value={formData.userId} 
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Choose a user...</option>
                                    {users.map(user => (
                                        <option key={user._id} value={user._id}>
                                            {user.name} ({user.email}) - {user.role}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                maxLength={200}
                                placeholder="Enter task title"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Enter task description"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Status</label>
                                <select 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleChange}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Priority</label>
                                <select 
                                    name="priority" 
                                    value={formData.priority} 
                                    onChange={handleChange}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Due Date</label>
                            <input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                            />
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    
                    <button 
                        type="button"
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        disabled={loading || usersLoading}
                    >
                        {loading ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
}
