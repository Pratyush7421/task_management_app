import { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import TaskForm from '../components/TaskForm';

export default function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [filters, setFilters] = useState({ status: '', priority: '' });

    useEffect(() => {
        fetchTasks();
        fetchStats();
    }, [filters]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            
            const response = await api.get(`/tasks?${params}`);
            setTasks(response.data.tasks);
        } catch (err) {
            setError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/tasks/stats');
            setStats(response.data.stats);
        } catch (err) {
            console.error('Failed to load stats');
        }
    };

    const handleCreate = async (formData) => {
        try {
            await api.post('/tasks', formData);
            setShowForm(false);
            fetchTasks();
            fetchStats();
        } catch (err) {
            setError('Failed to create task');
        }
    };

    const handleUpdate = async (formData) => {
        try {
            await api.put(`/tasks/${editingTask._id}`, formData);
            setEditingTask(null);
            fetchTasks();
            fetchStats();
        } catch (err) {
            setError('Failed to update task');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
            fetchStats();
        } catch (err) {
            setError('Failed to delete task');
        }
    };

    const getPriorityClass = (priority) => {
        return `priority-${priority}`;
    };

    const getStatusClass = (status) => {
        return `status-${status}`;
    };

    return (
        <div className="dashboard">
            <Navbar />
            <div className="container">
                <h1>My Tasks</h1>
                
                {error && <div className="error-message">{error}</div>}
                
                {/* Stats Section */}
                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h4>Total</h4>
                            <p>{stats.total}</p>
                        </div>
                        <div className="stat-card">
                            <h4>Pending</h4>
                            <p>{stats.pending}</p>
                        </div>
                        <div className="stat-card">
                            <h4>In Progress</h4>
                            <p>{stats.in_progress}</p>
                        </div>
                        <div className="stat-card">
                            <h4>Completed</h4>
                            <p>{stats.completed}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="filters">
                    <select 
                        value={filters.status} 
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    <select 
                        value={filters.priority} 
                        onChange={(e) => setFilters({...filters, priority: e.target.value})}
                    >
                        <option value="">All Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                    <button onClick={() => setShowForm(true)} className="btn-primary">
                        + New Task
                    </button>
                </div>

                {/* Task List */}
                {loading ? (
                    <p>Loading...</p>
                ) : tasks.length === 0 ? (
                    <p>No tasks found. Create your first task!</p>
                ) : (
                    <div className="task-list">
                        {tasks.map(task => (
                            <div key={task._id} className="task-card">
                                <div className="task-header">
                                    <h3>{task.title}</h3>
                                    <span className={getPriorityClass(task.priority)}>
                                        {task.priority}
                                    </span>
                                </div>
                                <p className="task-description">{task.description}</p>
                                <div className="task-meta">
                                    <span className={getStatusClass(task.status)}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                    {task.dueDate && (
                                        <span className="due-date">
                                            Due: {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <div className="task-actions">
                                    <button 
                                        onClick={() => setEditingTask(task)}
                                        className="btn-edit"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(task._id)}
                                        className="btn-delete"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modals */}
                {showForm && (
                    <TaskForm 
                        onSubmit={handleCreate} 
                        onCancel={() => setShowForm(false)} 
                    />
                )}
                {editingTask && (
                    <TaskForm 
                        task={editingTask}
                        onSubmit={handleUpdate} 
                        onCancel={() => setEditingTask(null)} 
                    />
                )}
            </div>
        </div>
    );
}