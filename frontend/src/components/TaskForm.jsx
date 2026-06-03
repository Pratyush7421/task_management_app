/**
 * ============================================================================
 * TASK FORM COMPONENT
 * ============================================================================
 * Modal form for creating and editing tasks.
 * 
 * Features:
 * - Create new tasks
 * - Edit existing tasks
 * - Form validation (required fields)
 * - Controlled inputs (React state drives form values)
 * - Modal overlay with cancel functionality
 * 
 * Form Fields:
 * - Title (required, max 200 chars)
 * - Description (optional)
 * - Status (pending, in_progress, completed)
 * - Priority (low, medium, high)
 * - Due Date (optional, date picker)
 * 
 * Props:
 * - task: Existing task object (for edit mode) or null/undefined (for create)
 * - onSubmit: Callback function when form is submitted
 * - onCancel: Callback function when cancel is clicked
 * 
 * Controlled vs Uncontrolled:
 * - This form uses controlled inputs (value + onChange)
 * - React state is the "single source of truth"
 * - Enables validation and dynamic updates
 * ============================================================================
 */

// React hooks for state and side effects
import { useState, useEffect } from 'react';

/**
 * TaskForm Component
 * 
 * Modal dialog for task creation and editing.
 * 
 * @param {Object} props - Component props
 * @param {Object} [props.task] - Existing task for edit mode (undefined for create)
 * @param {Function} props.onSubmit - Callback with form data on submit
 * @param {Function} props.onCancel - Callback when cancel button clicked
 * @returns {JSX.Element} Modal form JSX
 */
export default function TaskForm({ task, onSubmit, onCancel }) {
    // -------------------------------------------------------------------------
    // FORM STATE
    // -------------------------------------------------------------------------
    
    /**
     * Form Data State
     * 
     * Stores current values of all form fields.
     * Initialized with defaults for create mode.
     * 
     * Shape:
     * {
     *   title: string,
     *   description: string,
     *   status: 'pending' | 'in_progress' | 'completed',
     *   priority: 'low' | 'medium' | 'high',
     *   due_date: string (YYYY-MM-DD format)
     * }
     */
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: ''
    });

    // -------------------------------------------------------------------------
    // INITIALIZATION EFFECT
    // -------------------------------------------------------------------------
    
    /**
     * Populate Form for Edit Mode
     * 
     * Runs when task prop changes.
     * If task exists (edit mode), populate form with task data.
     * If task is null/undefined (create mode), keep default empty values.
     * 
     * useEffect dependencies: [task]
     * - Runs when component mounts
     * - Runs whenever task prop changes
     */
    useEffect(() => {
        if (task) {
            // EDIT MODE: Populate form with existing task data
            setFormData({
                title: task.title || '',           // Fallback to empty string
                description: task.description || '',
                status: task.status || 'pending',
                priority: task.priority || 'medium',
                // Convert ISO date to YYYY-MM-DD for date input
                // task.dueDate: "2024-01-15T00:00:00.000Z"
                // .split('T')[0]: "2024-01-15"
                due_date: task.dueDate ? task.dueDate.split('T')[0] : ''
            });
        }
        // If task is null/undefined, keep default state (create mode)
    }, [task]); // Dependency array - re-run when task changes

    // -------------------------------------------------------------------------
    // EVENT HANDLERS
    // -------------------------------------------------------------------------
    
    /**
     * Handle Input Change
     * 
     * Updates form state when any input changes.
     * Uses computed property name to update correct field.
     * 
     * @param {Object} e - React synthetic event
     * @param {string} e.target.name - Input field name (matches formData key)
     * @param {string} e.target.value - New input value
     */
    const handleChange = (e) => {
        // Spread operator preserves other fields
        // Computed property [e.target.name] updates specific field
        setFormData({ 
            ...formData,           // Copy existing values
            [e.target.name]: e.target.value  // Update changed field
        });
    };

    /**
     * Handle Form Submit
     * 
     * Prevents default form submission (page reload),
     * validates required fields, and calls onSubmit callback.
     * 
     * @param {Object} e - React form submit event
     */
    const handleSubmit = (e) => {
        // Prevent default browser form submission (page reload)
        e.preventDefault();
        
        // Call parent callback with current form data
        // Parent component handles API call
        onSubmit(formData);
    };

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    
    return (
        // Modal overlay - dark background that covers entire screen
        <div className="modal-overlay">
            {/* Modal content container */}
            <div className="modal">
                {/* 
                    Dynamic title based on mode
                    task ? "Edit Task" : "Create New Task"
                */}
                <h3>{task ? 'Edit Task' : 'Create New Task'}</h3>

                {/* Form element with submit handler */}
                <form onSubmit={handleSubmit}>
                    
                    {/* TITLE FIELD */}
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            name="title"           // Matches formData key
                            value={formData.title} // Controlled input
                            onChange={handleChange} // Updates state on every keystroke
                            required               // HTML5 validation
                            maxLength={200}        // Prevent超长输入
                        />
                    </div>

                    {/* DESCRIPTION FIELD */}
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}               // Show 3 lines by default
                        />
                    </div>

                    {/* STATUS & PRIORITY ROW */}
                    <div className="form-row">
                        {/* STATUS DROPDOWN */}
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

                        {/* PRIORITY DROPDOWN */}
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

                    {/* DUE DATE FIELD */}
                    <div className="form-group">
                        <label>Due Date</label>
                        <input
                            type="date"            // HTML5 date picker
                            name="due_date"
                            value={formData.due_date}
                            onChange={handleChange}
                        />
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="form-actions">
                        {/* Cancel button - type="button" prevents form submit */}
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        
                        {/* Submit button */}
                        <button 
                            type="submit" 
                            className="btn-primary"
                        >
                            {/* Dynamic button text based on mode */}
                            {task ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}