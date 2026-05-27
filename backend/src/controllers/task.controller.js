/**
 * Task Controller
 * Handles all task business logic
 */

const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');

/**
 * GET /api/v1/tasks
 * Get all tasks with pagination, filtering, and role-based access
 */
exports.getAllTasks = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            priority,
            search,
            sort_by = 'createdAt',
            sort_order = 'desc'
        } = req.query;

        const userId = req.user.userId;
        const userRole = req.user.role;

        // Build query filter based on role
        let filter = {};

        if (userRole === 'admin') {
            // Admin sees all tasks
            filter = {};
        } else if (userRole === 'manager') {
            // Manager sees own tasks + team members' tasks
            const manager = await User.findById(userId).select('teamMembers');
            const allowedUserIds = [userId, ...(manager?.teamMembers || [])];
            filter = { userId: { $in: allowedUserIds } };
        } else {
            // Regular user sees only their own tasks
            filter = { userId };
        }

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort = {};
        const validSortColumns = ['createdAt', 'dueDate', 'priority', 'title'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'createdAt';
        sort[sortColumn] = sort_order.toLowerCase() === 'asc' ? 1 : -1;

        // Get total count
        const total = await Task.countDocuments(filter);

        // Get tasks with pagination
        const tasks = await Task.find(filter)
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
 * GET /api/v1/tasks/stats
 * Get task statistics for current user
 */
exports.getStats = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const stats = await Task.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
                    },
                    high_priority: {
                        $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
                    }
                }
            }
        ]);

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

/**
 * GET /api/v1/tasks/:id
 * Get single task by ID
 */
exports.getTaskById = async (req, res, next) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.user.userId
        }).lean();

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ task });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/tasks
 * Create a new task
 */
exports.createTask = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, status, priority, due_date } = req.body;
        const userId = req.user.userId;
        const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const task = await Task.create({
            userId,
            title,
            description: description || '',
            status: status || 'pending',
            priority: priority || 'medium',
            dueDate: due_date || null,
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

/**
 * PUT /api/v1/tasks/:id
 * Update an existing task
 */
exports.updateTask = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, status, priority, due_date } = req.body;
        const taskId = req.params.id;
        const userId = req.user.userId;

        // Check if task exists and belongs to user
        const existingTask = await Task.findOne({ _id: taskId, userId });
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Build update object
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (due_date !== undefined) updateData.dueDate = due_date;
        if (req.file) updateData.attachmentUrl = `/uploads/${req.file.filename}`;

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

/**
 * DELETE /api/v1/tasks/:id
 * Delete a task
 */
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        next(err);
    }
};