/**
 * ============================================================================
 * TASK CONTROLLER
 * ============================================================================
 * Handles all task-related business logic including CRUD operations,
 * filtering, pagination, and role-based access control.
 * 
 * Key Concepts:
 * - CRUD: Create, Read, Update, Delete operations
 * - Pagination: Breaking large datasets into manageable pages
 * - Aggregation: MongoDB pipeline for data analysis
 * - Role-based filtering: Different data access based on user role
 * 
 * Access Control:
 * - Admin: Can see all tasks in the system
 * - Manager: Can see own tasks + team members' tasks
 * - User: Can only see own tasks
 * ============================================================================
 */

// Mongoose for ObjectId conversion and aggregation
const mongoose = require('mongoose');

// Validation result extractor
const { validationResult } = require('express-validator');

// Database models
const Task = require('../models/Task');
const User = require('../models/User');

// ============================================================================
// GET ALL TASKS (with filtering, pagination, role-based access)
// ============================================================================

/**
 * Get All Tasks with Pagination and Filtering
 * GET /api/v1/tasks
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - status: Filter by status (pending, in_progress, completed)
 * - priority: Filter by priority (low, medium, high)
 * - search: Search in title/description
 * - sort_by: Column to sort by (default: createdAt)
 * - sort_order: asc or desc (default: desc)
 * 
 * Role-Based Access:
 * - Admin: Sees all tasks
 * - Manager: Sees own tasks + team members' tasks
 * - User: Sees only own tasks
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {Object} req.user - Authenticated user from JWT { userId, role }
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.getAllTasks = async (req, res, next) => {
    try {
        // Destructure query parameters with defaults
        // This pattern provides default values if parameters are missing
        const {
            page = 1,           // Default to page 1
            limit = 10,         // Default 10 items per page
            status,             // Optional filter
            priority,           // Optional filter
            search,             // Optional search term
            sort_by = 'createdAt',  // Default sort column
            sort_order = 'desc'     // Default sort direction
        } = req.query;

        // Get authenticated user info from JWT (set by auth middleware)
        const userId = req.user.userId;
        const userRole = req.user.role;

        // ---------------------------------------------------------------------
        // BUILD QUERY FILTER BASED ON USER ROLE
        // ---------------------------------------------------------------------
        let filter = {};

        if (userRole === 'admin') {
            // Admin sees all tasks - no filter needed
            filter = {};
        } else if (userRole === 'manager') {
            // Manager sees own tasks + team members' tasks
            // First, get the manager's team members
            const manager = await User.findById(userId).select('teamMembers');
            // Build array of allowed user IDs: manager + team members
            const allowedUserIds = [userId, ...(manager?.teamMembers || [])];
            // MongoDB $in operator matches any value in the array
            filter = { userId: { $in: allowedUserIds } };
        } else {
            // Regular user sees only their own tasks
            filter = { userId };
        }

        // ---------------------------------------------------------------------
        // APPLY ADDITIONAL FILTERS FROM QUERY PARAMETERS
        // ---------------------------------------------------------------------
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        
        if (search) {
            // $or operator matches if ANY condition is true
            // $regex enables pattern matching (case-insensitive with $options: 'i')
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // ---------------------------------------------------------------------
        // BUILD SORT CONFIGURATION
        // ---------------------------------------------------------------------
        const sort = {};
        // Whitelist allowed sort columns to prevent injection attacks
        const validSortColumns = ['createdAt', 'dueDate', 'priority', 'title'];
        // Use requested column if valid, otherwise default to createdAt
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'createdAt';
        // 1 = ascending, -1 = descending
        sort[sortColumn] = sort_order.toLowerCase() === 'asc' ? 1 : -1;

        // ---------------------------------------------------------------------
        // EXECUTE QUERIES (count + fetch)
        // ---------------------------------------------------------------------
        // Get total count for pagination metadata
        const total = await Task.countDocuments(filter);

        // Fetch paginated tasks
        // .sort() - applies sorting
        // .skip() - skips documents for pagination (page 2 skips first 10)
        // .limit() - restricts number of results
        // .lean() - returns plain JS objects instead of Mongoose documents (faster)
        const tasks = await Task.find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // ---------------------------------------------------------------------
        // RETURN PAGINATED RESPONSE
        // ---------------------------------------------------------------------
        res.json({
            tasks,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                total_pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        next(err);
    }
};

// ============================================================================
// GET TASK STATISTICS
// ============================================================================

/**
 * Get Task Statistics for Current User
 * GET /api/v1/tasks/stats
 * 
 * Uses MongoDB Aggregation Pipeline to calculate:
 * - Total tasks
 * - Tasks by status (pending, in_progress, completed)
 * - High priority tasks count
 * 
 * Aggregation Pipeline Stages:
 * 1. $match: Filter documents by userId
 * 2. $group: Calculate statistics using accumulators
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user { userId }
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.getStats = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // MongoDB Aggregation Pipeline
        // Pipeline is an array of stages that transform documents
        const stats = await Task.aggregate([
            // Stage 1: Match - Filter tasks for this user only
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(userId) 
                } 
            },
            
            // Stage 2: Group - Calculate statistics
            {
                $group: {
                    _id: null,  // Group all documents together (no grouping key)
                    
                    // $sum: 1 counts each document
                    total: { $sum: 1 },
                    
                    // $cond is like if-else: [condition, true_value, false_value]
                    pending: {
                        $sum: { 
                            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] 
                        }
                    },
                    in_progress: {
                        $sum: { 
                            $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] 
                        }
                    },
                    completed: {
                        $sum: { 
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] 
                        }
                    },
                    high_priority: {
                        $sum: { 
                            $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] 
                        }
                    }
                }
            }
        ]);

        // If user has no tasks, return zeros
        const result = stats.length > 0 ? stats[0] : {
            total: 0,
            pending: 0,
            in_progress: 0,
            completed: 0,
            high_priority: 0
        };

        res.json({ stats: result });
    } catch (err) {
        next(err);
    }
};

// ============================================================================
// GET SINGLE TASK BY ID
// ============================================================================

/**
 * Get Single Task by ID
 * GET /api/v1/tasks/:id
 * 
 * Access Control:
 * - Admin can view any task
 * - Regular users can only view their own tasks
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params.id - Task ID from URL
 * @param {Object} req.user - Authenticated user { userId, role }
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.getTaskById = async (req, res, next) => {
    try {
        const isAdmin = req.user.role === 'admin';
        
        // Build filter based on role
        // Admin: only filter by task ID
        // User: filter by task ID AND userId (ensures ownership)
        const filter = isAdmin
            ? { _id: req.params.id }
            : { _id: req.params.id, userId: req.user.userId };

        // .lean() returns plain object instead of Mongoose document
        const task = await Task.findOne(filter).lean();

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ task });
    } catch (err) {
        next(err);
    }
};

// ============================================================================
// CREATE NEW TASK
// ============================================================================

/**
 * Create New Task
 * POST /api/v1/tasks
 * 
 * Request Body:
 * - title: Task title (required)
 * - description: Task details (optional)
 * - status: pending, in_progress, completed (optional, default: pending)
 * - priority: low, medium, high (optional, default: medium)
 * - due_date: ISO date string (optional)
 * 
 * File Upload:
 * - Supports single file attachment via multipart/form-data
 * - File info available in req.file (set by multer middleware)
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Task data
 * @param {Object} req.file - Uploaded file info (optional)
 * @param {Object} req.user - Authenticated user { userId }
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.createTask = async (req, res, next) => {
    try {
        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Destructure fields with defaults for optional fields
        const { title, description, status, priority, due_date } = req.body;
        const userId = req.user.userId;
        
        // Check if file was uploaded (multer adds req.file)
        // If uploaded, store the relative path
        const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // Create task document
        const task = await Task.create({
            userId,
            title,
            description: description || '',  // Default to empty string
            status: status || 'pending',      // Default status
            priority: priority || 'medium',   // Default priority
            dueDate: due_date || null,        // Convert to Date or null
            attachmentUrl
        });

        res.status(201).json({
            message: 'Task created successfully',
            task
        });
    } catch (err) {
        next(err);
    }
};

// ============================================================================
// UPDATE TASK
// ============================================================================

/**
 * Update Existing Task
 * PUT /api/v1/tasks/:id
 * 
 * Partial Update:
 * - Only updates fields provided in request body
 * - Undefined fields are not modified
 * 
 * Access Control:
 * - Admin can update any task
 * - Regular users can only update their own tasks
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params.id - Task ID from URL
 * @param {Object} req.body - Updated task data
 * @param {Object} req.file - Uploaded file info (optional)
 * @param {Object} req.user - Authenticated user { userId, role }
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.updateTask = async (req, res, next) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, status, priority, due_date } = req.body;
        const taskId = req.params.id;
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';

        // Build ownership filter based on role
        const ownerFilter = isAdmin
            ? { _id: taskId }
            : { _id: taskId, userId };

        // Verify task exists and user has permission
        const existingTask = await Task.findOne(ownerFilter);
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Build update object - only include defined fields
        // This enables partial updates (PATCH-like behavior)
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (due_date !== undefined) updateData.dueDate = due_date;
        if (req.file) updateData.attachmentUrl = `/uploads/${req.file.filename}`;

        // Update task
        // { new: true } returns the updated document (not the old one)
        // { runValidators: true } runs schema validators on update
        const task = await Task.findByIdAndUpdate(
            taskId,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Task updated successfully',
            task
        });
    } catch (err) {
        next(err);
    }
};

// ============================================================================
// DELETE TASK
// ============================================================================

/**
 * Delete Task
 * DELETE /api/v1/tasks/:id
 * 
 * Access Control:
 * - Admin can delete any task
 * - Regular users can only delete their own tasks
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params.id - Task ID from URL
 * @param {Object} req.user - Authenticated user { userId, role }
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.deleteTask = async (req, res, next) => {
    try {
        const isAdmin = req.user.role === 'admin';
        
        // Build filter based on role
        const filter = isAdmin
            ? { _id: req.params.id }
            : { _id: req.params.id, userId: req.user.userId };

        // findOneAndDelete returns the deleted document
        const task = await Task.findOneAndDelete(filter);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        next(err);
    }
};