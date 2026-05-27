/**
 * Admin Controller
 * Handles all admin business logic
 */

const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');

/**
 * GET /api/v1/admin/users
 * List all users (admin only)
 */
exports.getAllUsers = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            role,
            search
        } = req.query;

        // Build filter
        const filter = {};
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(filter);

        const users = await User.find(filter)
            .select('-password') // Exclude password
            .populate('teamMembers', 'name email role') // Show team member details
            .sort({ createdAt: -1 })
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
 * GET /api/v1/admin/users/:id
 * Get single user details with task stats (admin only)
 */
exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('teamMembers', 'name email role')
            .lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's task statistics
        const taskStats = await Task.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(req.params.id) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
                }
            }
        ]);

        res.json({
            user,
            taskStats: taskStats[0] || { total: 0, pending: 0, in_progress: 0, completed: 0 }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/v1/admin/users/:id/role
 * Change user role (admin only)
 */
exports.updateUserRole = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { role } = req.body;
        const userId = req.params.id;

        // Prevent admin from demoting themselves
        if (userId === req.user.userId && role !== 'admin') {
            return res.status(400).json({ error: 'You cannot change your own admin role' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
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
 * PUT /api/v1/admin/users/:id/team
 * Assign team members to manager (admin only)
 */
exports.updateUserTeam = async (req, res, next) => {
    try {
        const { teamMemberIds } = req.body; // Array of user IDs
        const managerId = req.params.id;

        // Validate that the user is a manager
        const manager = await User.findById(managerId);
        if (!manager) {
            return res.status(404).json({ error: 'Manager not found' });
        }

        if (manager.role !== 'manager' && manager.role !== 'admin') {
            return res.status(400).json({ error: 'User must be a manager or admin to have team members' });
        }

        // Validate all team member IDs exist
        if (!Array.isArray(teamMemberIds)) {
            return res.status(400).json({ error: 'teamMemberIds must be an array' });
        }

        const validMembers = await User.find({ _id: { $in: teamMemberIds } });
        if (validMembers.length !== teamMemberIds.length) {
            return res.status(400).json({ error: 'Some team member IDs are invalid' });
        }

        // Prevent manager from adding themselves to their own team
        if (teamMemberIds.includes(managerId)) {
            return res.status(400).json({ error: 'Manager cannot be a member of their own team' });
        }

        manager.teamMembers = teamMemberIds;
        await manager.save();

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

/**
 * GET /api/v1/admin/tasks
 * Get all tasks from all users (admin only)
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

        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (userId) filter.userId = new mongoose.Types.ObjectId(userId);
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort
        const sort = {};
        sort[sort_by] = sort_order.toLowerCase() === 'asc' ? 1 : -1;

        const total = await Task.countDocuments(filter);

        const tasks = await Task.find(filter)
            .populate('userId', 'name email role') // Show who owns the task
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
 * DELETE /api/v1/admin/tasks/:id
 * Delete any task (admin only)
 */
exports.deleteTask = async (req, res, next) => {
    try {
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

/**
 * GET /api/v1/admin/stats
 * System-wide statistics (admin only)
 */
exports.getStats = async (req, res, next) => {
    try {
        // User statistics
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Task statistics
        const taskStats = await Task.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
                }
            }
        ]);

        // Tasks per user
        const tasksPerUser = await Task.aggregate([
            {
                $group: {
                    _id: '$userId',
                    taskCount: { $sum: 1 }
                }
            },
            { $sort: { taskCount: -1 } },
            { $limit: 10 }
        ]);

        // Get user details for top users
        const topUsers = await User.populate(tasksPerUser, {
            path: '_id',
            select: 'name email role'
        });

        res.json({
            users: {
                total: await User.countDocuments(),
                byRole: userStats.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            },
            tasks: taskStats[0] || { total: 0, pending: 0, in_progress: 0, completed: 0 },
            topUsers: topUsers.map(u => ({
                user: u._id,
                taskCount: u.taskCount
            }))
        });
    } catch (err) {
        next(err);
    }
};