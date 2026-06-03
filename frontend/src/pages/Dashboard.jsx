/**
 * ============================================================================
 * DASHBOARD PAGE
 * ============================================================================
 * Main application interface for managing tasks.
 * 
 * Features:
 * - Task list with filtering and sorting
 * - Task statistics display
 * - Create, edit, and delete tasks
 * - Modal forms for task creation/editing
 * - Loading states and error handling
 * 
 * State Management:
 * - tasks: Array of user's tasks
 * - stats: Task statistics object
 * - loading: Loading state for API calls
 * - error: Error messages
 * - showForm: Controls create task modal visibility
 * - editingTask: Task being edited (null if creating)
 * - filters: Active filters (status, priority)
 * 
 * Data Flow:
 * 1. Component mounts → fetch tasks and stats
 * 2. User interacts → update state → re-render
 * 3. User saves → API call → refresh data
 * 
 * Components Used:
 * - Navbar: Top navigation
 * - TaskForm: Modal for create/edit
 * ============================================================================
 */

// React hooks for state and side effects
import { useState, useEffect } from 'react';

// API client for backend communication
import api from '../api/axios';

// Child components
import Navbar from '../components/Navbar';
import TaskForm from '../components/TaskForm';

/**
 * Dashboard Page Component
 * 
 * Main task management interface.
 * 
 * @returns {JSX.Element} Dashboard page JSX
 */
export default function Dashboard() {
    // -------------------------------------------------------------------------
    // STATE
    // -------------------------------------------------------------------------
    
    /**
     * Tasks State
     * 
     * Array of task objects from API.
     * Updated when filters change or after CRUD operations.
     */
    const [tasks, setTasks] = useState([]);
    
    /**
     * Statistics State
     * 
     * Task counts by status from API.
     * Used for the stats cards display.
     */
    const [stats, setStats] = useState(null);
    
    /**
     * Loading State
     * 
     * True while fetching data from API.
     * Shows loading indicator instead of content.
     */
    const [loading, setLoading] = useState(true);
    
    /**
     * Error State
     * 
     * Error message to display to user.
     * Cleared on successful operations.
     */
    const [error, setError] = useState('');
    
    /**
     * Show Form State
     * 
     * Controls visibility of create task modal.
     * true = show modal, false = hide modal
     */
    const [showForm, setShowForm] = useState(false);
    
    /**
     * Editing Task State
     * 
     * Task object being edited, or null for create mode.
     * Passed to TaskForm to determine mode.
     */
    const [editingTask, setEditingTask] = useState(null);
    
    /**
     * Filters State
     * 
     * Active filter values for task list.
     * Changing filters triggers refetch.
     */
    const [filters, setFilters] = useState({ 
        status: '', 
        priority: '' 
    });

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------
    
    /**
     * Fetch Tasks Effect
     * 
     * Runs when component mounts or filters change.
     * Fetches filtered task list from API.
     */
    useEffect(() => {
        fetchTasks();
        fetchStats();
    }, [filters]); // Re-run when filters change

    /**
     * Fetch Tasks from API
     * 
     * GET /api/v1/tasks with query parameters for filtering.
     * Updates tasks state on success.
     */
    const fetchTasks = async () => {
        try {
            setLoading(true);
            
            // Build query string from filters
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            
            // API call with query parameters
            const response = await api.get(`/tasks?${params}`);
            setTasks(response.data.tasks);
        } catch (err) {
            setError('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch Statistics from API
     * 
     * GET /api/v1/tasks/stats
     * Updates stats state on success.
     */
    const fetchStats = async () => {
        try {
            const response = await api.get('/tasks/stats');
            setStats(response.data.stats);
        } catch (err) {
            console.error('Failed to load stats');
        }
    };

    // -------------------------------------------------------------------------
    // CRUD OPERATIONS
    // -------------------------------------------------------------------------
    
    /**
     * Create New Task
     * 
     * POST /api/v1/tasks
     * 
     * @param {Object} formData - Task data from form
     */
    const handleCreate = async (formData) => {
        try {
            await api.post('/tasks', formData);
            setShowForm(false);  // Close modal
            fetchTasks();        // Refresh task list
            fetchStats();        // Refresh statistics
        } catch (err) {
            setError('Failed to create task');
        }
    };

    /**
     * Update Existing Task
     * 
     * PUT /api/v1/tasks/:id
     * 
     * @param {Object} formData - Updated task data
     */
    const handleUpdate = async (formData) => {
        try {
            await api.put(`/tasks/${editingTask._id}`, formData);
            setEditingTask(null);  // Close edit modal
            fetchTasks();
            fetchStats();
        } catch (err) {
            setError('Failed to update task');
        }
    };

    /**
     * Delete Task
     * 
     * DELETE /api/v1/tasks/:id
     * Shows confirmation dialog before deleting.
     * 
     * @param {string} id - Task ID to delete
     */
    const handleDelete = async (id) => {
        // Confirm before delete
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        try {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
            fetchStats();
        } catch (err) {
            setError('Failed to delete task');
        }
    };

    // -------------------------------------------------------------------------
    // UTILITY FUNCTIONS
    // -------------------------------------------------------------------------
    
    /**
     * Get CSS Class for Priority Badge
     * 
     * Returns class name based on priority level.
     * Used for styling priority indicators.
     * 
     * @param {string} priority - 'low', 'medium', or 'high'
     * @returns {string} CSS class name
     */
    const getPriorityClass = (priority) => {
        return `priority-${priority}`;
    };

    /**
     * Get CSS Class for Status Badge
     * 
     * Returns class name based on status.
     * Used for styling status indicators.
     * 
     * @param {string} status - 'pending', 'in_progress', or 'completed'
     * @returns {string} CSS class name
     */
    const getStatusClass = (status) => {
        return `status-${status}`;
    };

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    
    return (
        <div className="dashboard">
            {/* Navigation bar */}
            <Navbar />
            
            {/* Main content container */}
            <div className="container">
                <h1>My Tasks</h1>
                
                {/* Error message display */}
                {error && <div className="error-message">{error}</div>}
                
                {/* Statistics Section */}
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

                {/* Filters Section */}
                <div className="filters">
                    {/* Status Filter */}
                    <select 
                        value={filters.status} 
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    
                    {/* Priority Filter */}
                    <select 
                        value={filters.priority} 
                        onChange={(e) => setFilters({...filters, priority: e.target.value})}
                    >
                        <option value="">All Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                    
                    {/* Create Task Button */}
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
                                {/* Task Header */}
                                <div className="task-header">
                                    <h3>{task.title}</h3>
                                    <span className={getPriorityClass(task.priority)}>
                                        {task.priority}
                                    </span>
                                </div>
                                
                                {/* Task Description */}
                                <p className="task-description">{task.description}</p>
                                
                                {/* Task Meta Info */}
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
                                
                                {/* Task Actions */}
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

                {/* Create Task Modal */}
                {showForm && (
                    <TaskForm 
                        onSubmit={handleCreate} 
                        onCancel={() => setShowForm(false)} 
                    />
                )}
                
                {/* Edit Task Modal */}
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