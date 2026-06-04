const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');

exports.getAllTasks = async (req, res, next) => { // fetches tasks with filters, pagination, sorting
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

        let filter = {};

        if (userRole === 'admin') {
            filter = {};
        } else if (userRole === 'manager') {
            const manager = await User.findById(userId).select('teamMembers');
            const allowedUserIds = [userId, ...(manager?.teamMembers || [])];
            filter = { userId: { $in: allowedUserIds } };
        } else {
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

        const sort = {};
        const validSortColumns = ['createdAt', 'dueDate', 'priority', 'title'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'createdAt';
        sort[sortColumn] = sort_order.toLowerCase() === 'asc' ? 1 : -1;

        const total = await Task.countDocuments(filter);

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

exports.getStats = async (req, res, next) => { // returns task statistics for current user
    try {
        const userId = req.user.userId;

        const stats = await Task.aggregate([
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(userId) 
                } 
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
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

exports.getTaskById = async (req, res, next) => { // fetches single task by ID (with ownership check)
    try {
        const isAdmin = req.user.role === 'admin';
        
        const filter = isAdmin
            ? { _id: req.params.id }
            : { _id: req.params.id, userId: req.user.userId };

        const task = await Task.findOne(filter).lean();

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ task });
    } catch (err) {
        next(err);
    }
};

exports.createTask = async (req, res, next) => { // creates new task with optional file attachment
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

exports.updateTask = async (req, res, next) => { // updates task by ID (with ownership check)
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, status, priority, due_date } = req.body;
        const taskId = req.params.id;
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';

        const ownerFilter = isAdmin
            ? { _id: taskId }
            : { _id: taskId, userId };

        const existingTask = await Task.findOne(ownerFilter);
        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

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

exports.deleteTask = async (req, res, next) => { // deletes task by ID (with ownership check)
    try {
        const isAdmin = req.user.role === 'admin';
        
        const filter = isAdmin
            ? { _id: req.params.id }
            : { _id: req.params.id, userId: req.user.userId };

        const task = await Task.findOneAndDelete(filter);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        next(err);
    }
};