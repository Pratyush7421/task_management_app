const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');

exports.getAllUsers = async (req, res, next) => { // fetches all users with filters and pagination
    try {
        const {
            page = 1,
            limit = 10,
            role,
            search
        } = req.query;

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
            .select('-password')
            .populate('teamMembers', 'name email role')
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

exports.getUserById = async (req, res, next) => { // fetches single user with task statistics
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('teamMembers', 'name email role')
            .lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const taskStats = await Task.aggregate([
            { 
                $match: { 
                    userId: new mongoose.Types.ObjectId(req.params.id) 
                } 
            },
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

exports.updateUserRole = async (req, res, next) => { // updates user role (prevents self-demotion)
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { role } = req.body;
        const userId = req.params.id;

        // prevent admin from removing their own admin privileges
        if (userId === req.user.userId && role !== 'admin') {
            return res.status(400).json({ 
                error: 'You cannot change your own admin role' 
            });
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

exports.updateUserTeam = async (req, res, next) => { // assigns team members to manager
    try {
        const { teamMemberIds } = req.body;
        const managerId = req.params.id;

        const manager = await User.findById(managerId);
        if (!manager) {
            return res.status(404).json({ error: 'Manager not found' });
        }

        if (manager.role !== 'manager' && manager.role !== 'admin') {
            return res.status(400).json({ 
                error: 'User must be a manager or admin to have team members' 
            });
        }

        if (!Array.isArray(teamMemberIds)) {
            return res.status(400).json({ 
                error: 'teamMemberIds must be an array' 
            });
        }

        const validMembers = await User.find({ _id: { $in: teamMemberIds } });
        if (validMembers.length !== teamMemberIds.length) {
            return res.status(400).json({ 
                error: 'Some team member IDs are invalid' 
            });
        }

        if (teamMemberIds.includes(managerId)) {
            return res.status(400).json({ 
                error: 'Manager cannot be a member of their own team' 
            });
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

exports.getAllTasks = async (req, res, next) => { // fetches all tasks across all users
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

        const sort = {};
        sort[sort_by] = sort_order.toLowerCase() === 'asc' ? 1 : -1;

        const total = await Task.countDocuments(filter);

        const tasks = await Task.find(filter)
            .populate('userId', 'name email role')
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

exports.deleteTask = async (req, res, next) => { // deletes any task by ID (admin only)
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

exports.getStats = async (req, res, next) => { // returns system-wide statistics
    try {
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        const taskStats = await Task.aggregate([
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
            tasks: taskStats[0] || { 
                total: 0, 
                pending: 0, 
                in_progress: 0, 
                completed: 0 
            },
            topUsers: topUsers.map(u => ({
                user: u._id,
                taskCount: u.taskCount
            }))
        });
    } catch (err) {
        next(err);
    }
};