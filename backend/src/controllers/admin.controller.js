/**
 * ============================================================================
 * ADMIN CONTROLLER
 * ============================================================================
 * Handles all admin-only operations including user management,
 * role assignments, team management, and system-wide statistics.
 * 
 * Key Concepts:
 * - Admin privileges: Full system access
 * - User management: CRUD operations on users
 * - Role hierarchy: user < manager < admin
 * - Team management: Managers can have team members
 * - System analytics: Aggregation pipelines for statistics
 * 
 * Security Considerations:
 * - All routes protected by isAdmin middleware
 * - Admin cannot demote themselves (prevents lockout)
 * - Team validation ensures data integrity
 * ============================================================================
 */

// Mongoose for ObjectId conversion and aggregation
const mongoose = require('mongoose');

// Validation result extractor
const { validationResult } = require('express-validator');

// Database models
const User = require('../models/User');
const Task = require('../models/Task');

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Get All Users (Admin Only)
 * GET /api/v1/admin/users
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - role: Filter by user role
 * - search: Search in name/email
 * 
 * Features:
 * - Excludes password field from results
 * - Populates team member details
 * - Supports pagination and filtering
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.getAllUsers = async (req, res, next) => {
    try {
        // Destructure query parameters with defaults
        const {
            page = 1,
            limit = 10,
            role,
            search
        } = req.query;

        // Build filter object
        const filter = {};
        if (role) filter.role = role;
        
        if (search) {
            // Search in both name and email fields (case-insensitive)
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await User.countDocuments(filter);

        // Fetch users with pagination
        const users = await User.find(filter)
            .select('-password')  // Exclude password field for security
            .populate('teamMembers', 'name email role')  // Get team member details
            .sort({ createdAt: -1 })  // Newest first
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        res.json({
            users,
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

/**
 * Get Single User Details (Admin Only)
 * GET /api/v1/admin/users/:id
 * 
 * Returns:
 * - User profile (without password)
 * - Team member details (if manager)
 * - Task statistics for the user
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params.id - User ID from URL
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.getUserById = async (req, res, next) => {
    try {
        // Find user by ID
        const user = await User.findById(req.params.id)
            .select('-password')  // Never return password
            .populate('teamMembers', 'name email role')  // Include team details
            .lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate task statistics using aggregation pipeline
        const taskStats = await Task.aggregate([
            // Match tasks belonging to this user
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(req.params.id) 
                } 
            },
            // Group and calculate counts
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
                    },
                    in_progress: { 
                        $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } 
                    },
                    completed: { 
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
                    }
                }
            }
        ]);

        res.json({
            user,
            // Return stats or default zeros if no tasks
            taskStats: taskStats[0] || { 
                total: 0, 
                pending: 0, 
                in_progress: 0, 
                completed: 0 
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Update User Role (Admin Only)
 * PUT /api/v1/admin/users/:id/role
 * 
 * Request Body:
 * - role: New role ('user', 'manager', or 'admin')
 * 
 * Security:
 * - Prevents admin from demoting themselves
 * - Validates role is in allowed enum values
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params.id - User ID to update
 * @param {Object} req.body.role - New role value
 * @param {Object} req.user - Current admin user
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.updateUserRole = async (req, res, next) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { role } = req.body;
        const userId = req.params.id;

        // Security: Prevent admin from removing their own admin privileges
        // This prevents accidental lockout from admin functions
        if (userId === req.user.userId && role !== 'admin') {
            return res.status(400).json({ 
                error: 'You cannot change your own admin role' 
            });
        }

        // Update user role
        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }  // Return updated doc, run validators
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: `User role updated to ${role}`,
            user
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Update User Team Members (Admin Only)
 * PUT /api/v1/admin/users/:id/team
 * 
 * Request Body:
 * - teamMemberIds: Array of user IDs to assign as team members
 * 
 * Business Rules:
 * - User must be manager or admin to have team members
 * - All team member IDs must be valid users
 * - Manager cannot be their own team member
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params.id - Manager user ID
 * @param {Object} req.body.teamMemberIds - Array of team member user IDs
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.updateUserTeam = async (req, res, next) => {
    try {
        const { teamMemberIds } = req.body;  // Array of user IDs
        const managerId = req.params.id;

        // Fetch the manager user
        const manager = await User.findById(managerId);
        if (!manager) {
            return res.status(404).json({ error: 'Manager not found' });
        }

        // Validate that user can have team members
        // Only managers and admins can have teams
        if (manager.role !== 'manager' && manager.role !== 'admin') {
            return res.status(400).json({ 
                error: 'User must be a manager or admin to have team members' 
            });
        }

        // Validate input is an array
        if (!Array.isArray(teamMemberIds)) {
            return res.status(400).json({ 
                error: 'teamMemberIds must be an array' 
            });
        }

        // Validate all provided IDs exist in database
        const validMembers = await User.find({ _id: { $in: teamMemberIds } });
        if (validMembers.length !== teamMemberIds.length) {
            return res.status(400).json({ 
                error: 'Some team member IDs are invalid' 
            });
        }

        // Prevent manager from adding themselves to their own team
        if (teamMemberIds.includes(managerId)) {
            return res.status(400).json({ 
                error: 'Manager cannot be a member of their own team' 
            });
        }

        // Update team members
        manager.teamMembers = teamMemberIds;
        await manager.save();

        // Fetch updated manager with populated team details
        const updatedManager = await User.findById(managerId)
            .select('-password')
            .populate('teamMembers', 'name email role');

        res.json({
            message: 'Team members updated successfully',
            manager: updatedManager
        });
    } catch (err) {
        next(err);
    }
};

// ============================================================================
// TASK MANAGEMENT (Admin Only)
// ============================================================================

/**
 * Get All Tasks from All Users (Admin Only)
 * GET /api/v1/admin/tasks
 * 
 * Query Parameters:
 * - page, limit: Pagination
 * - status, priority: Filters
 * - userId: Filter by specific user
 * - search: Search in title/description
 * - sort_by, sort_order: Sorting
 * 
 * Features:
 * - Populates user details to show task ownership
 * - Full filtering and pagination support
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.getAllTasks = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            priority,
            userId,
            search,
            sort_by = 'createdAt',
            sort_order = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        // Convert string userId to ObjectId for matching
        if (userId) filter.userId = new mongoose.Types.ObjectId(userId);
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort = {};
        sort[sort_by] = sort_order.toLowerCase() === 'asc' ? 1 : -1;

        // Get total count
        const total = await Task.countDocuments(filter);

        // Fetch tasks with user details
        const tasks = await Task.find(filter)
            .populate('userId', 'name email role')  // Show task owner info
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

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

/**
 * Delete Any Task (Admin Only)
 * DELETE /api/v1/admin/tasks/:id
 * 
 * Admins can delete any task regardless of ownership.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params.id - Task ID to delete
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.deleteTask = async (req, res, next) => {
    try {
        // Admin can delete any task - no ownership check needed
        const task = await Task.findByIdAndDelete(req.params.id);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({
            message: 'Task deleted successfully',
            deletedTask: task
        });
    } catch (err) {
        next(err);
    }
};

// ============================================================================
// SYSTEM STATISTICS
// ============================================================================

/**
 * Get System-Wide Statistics (Admin Only)
 * GET /api/v1/admin/stats
 * 
 * Returns comprehensive statistics:
 * - User counts by role
 * - Task counts by status
 * - Top users by task count
 * 
 * Uses multiple aggregation pipelines for different metrics.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Error handler middleware
 */
exports.getStats = async (req, res, next) => {
    try {
        // ---------------------------------------------------------------------
        // USER STATISTICS BY ROLE
        // ---------------------------------------------------------------------
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',  // Group by role field
                    count: { $sum: 1 }  // Count users in each role
                }
            }
        ]);

        // ---------------------------------------------------------------------
        // TASK STATISTICS
        // ---------------------------------------------------------------------
        const taskStats = await Task.aggregate([
            {
                $group: {
                    _id: null,  // Group all tasks together
                    total: { $sum: 1 },
                    pending: { 
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
                    },
                    in_progress: { 
                        $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } 
                    },
                    completed: { 
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
                    }
                }
            }
        ]);

        // ---------------------------------------------------------------------
        // TOP USERS BY TASK COUNT
        // ---------------------------------------------------------------------
        const tasksPerUser = await Task.aggregate([
            {
                $group: {
                    _id: '$userId',  // Group by user
                    taskCount: { $sum: 1 }  // Count their tasks
                }
            },
            { $sort: { taskCount: -1 } },  // Sort by count descending
            { $limit: 10 }  // Top 10 users
        ]);

        // Populate user details for top users
        // This converts _id (ObjectId) to full user documents
        const topUsers = await User.populate(tasksPerUser, {
            path: '_id',
            select: 'name email role'
        });

        // ---------------------------------------------------------------------
        // COMPILE AND RETURN STATISTICS
        // ---------------------------------------------------------------------
        res.json({
            users: {
                total: await User.countDocuments(),
                // Convert array to object: { user: 5, manager: 2, admin: 1 }
                byRole: userStats.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            },
            tasks: taskStats[0] || { 
                total: 0, 
                pending: 0, 
                in_progress: 0, 
                completed: 0 
            },
            topUsers: topUsers.map(u => ({
                user: u._id,  // Populated user document
                taskCount: u.taskCount
            }))
        });
    } catch (err) {
        next(err);
    }
};