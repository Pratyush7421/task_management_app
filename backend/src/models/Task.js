/**
 * ============================================================================
 * TASK MODEL - Mongoose Schema Definition
 * ============================================================================
 * This file defines the Task schema for MongoDB using Mongoose.
 * Tasks represent work items assigned to users with various properties
 * like status, priority, and due dates.
 * 
 * Key Concepts:
 * - Referencing: userId references User model (foreign key pattern)
 * - Indexing: Compound indexes optimize common query patterns
 * - Enums: Restrict field values to predefined options
 * - Validation: Ensure data integrity at the database level
 * 
 * Relationships:
 * - Task belongs to User (many-to-one)
 * - User has many Tasks (one-to-many)
 * ============================================================================
 */

// Import Mongoose for schema definition
const mongoose = require('mongoose');

/**
 * Task Schema Definition
 * 
 * Represents a task/work item in the system.
 * Tasks track work progress from creation to completion.
 */
const taskSchema = new mongoose.Schema({
    /**
     * User ID (Foreign Key)
     * - References the User who owns this task
     * - type: ObjectId - MongoDB's unique identifier type
     * - ref: 'User' - enables population to get full user details
     * - required: Every task must belong to a user
     * - index: true - creates index for faster user-based queries
     */
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },

    /**
     * Task Title
     * - Brief description of the task
     * - trim: Removes accidental whitespace
     * - maxlength: Prevents excessively long titles
     */
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },

    /**
     * Task Description
     * - Detailed explanation of the task
     * - optional field (no required constraint)
     * - default: '' - empty string if not provided
     */
    description: {
        type: String,
        trim: true,
        default: ''
    },

    /**
     * Task Status
     * - Tracks the current state of the task
     * - enum: Only allows specific values
     *   - 'pending': Task created but not started
     *   - 'in_progress': Currently being worked on
     *   - 'completed': Task finished
     * - default: 'pending' - new tasks start as pending
     */
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
    },

    /**
     * Task Priority
     * - Indicates importance/urgency level
     * - enum: Only allows specific values
     *   - 'low': Can be done when convenient
     *   - 'medium': Normal priority
     *   - 'high': Urgent, needs attention
     * - default: 'medium' - standard priority
     */
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    /**
     * Due Date
     * - When the task should be completed
     * - type: Date - stores JavaScript Date objects
     * - default: null - no due date by default
     */
    dueDate: {
        type: Date,
        default: null
    },

    /**
     * Attachment URL
     * - Path to uploaded file associated with task
     * - Stores relative path like '/uploads/filename.jpg'
     * - default: null - no attachment by default
     */
    attachmentUrl: {
        type: String,
        default: null
    }
}, {
    /**
     * Schema Options
     * timestamps: true automatically adds:
     * - createdAt: When task was created
     * - updatedAt: When task was last modified
     */
    timestamps: true
});

// ============================================================================
// INDEXES FOR QUERY OPTIMIZATION
// ============================================================================

/**
 * Compound Index: userId + status
 * Optimizes queries like: "Find all pending tasks for user X"
 * Common use case: Dashboard filtering by status
 */
taskSchema.index({ userId: 1, status: 1 });

/**
 * Compound Index: userId + priority
 * Optimizes queries like: "Find all high priority tasks for user X"
 * Common use case: Priority-based task sorting
 */
taskSchema.index({ userId: 1, priority: 1 });

/**
 * Compound Index: userId + createdAt (descending)
 * Optimizes queries like: "Find user's tasks sorted by newest first"
 * Common use case: Default task list ordering
 * -1 means descending (newest first)
 */
taskSchema.index({ userId: 1, createdAt: -1 });

/**
 * Export the Task Model
 * 
 * Creates a Mongoose model named 'Task'
 * Collection name automatically becomes 'tasks'
 */
module.exports = mongoose.model('Task', taskSchema);