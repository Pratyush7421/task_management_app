const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');

const getAllUsers = async ({ role, search }) => { // fetches all users with filters, sorted by createdAt desc
    const filter = {};
    if (role) filter.role = role;

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const users = await User.find(filter)
        .select('-password')
        .populate('teamMembers', 'name email role')
        .sort({ createdAt: -1 })
        .lean();

    return { users };
};

const getUserById = async (userId) => { // fetches single user with task statistics
    const user = await User.findById(userId)
        .select('-password')
        .populate('teamMembers', 'name email role')
        .lean();

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const taskStats = await Task.aggregate([ //now it is using mongodb aggregation just like sql groupby
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

    return {
        user,
        taskStats: taskStats[0] || {
            total: 0,
            pending: 0,
            in_progress: 0,
            completed: 0
        }
    };
};

const updateUserRole = async (userId, role, currentUserId) => { // updates user role (prevents self-demotion)
    if (userId === currentUserId && role !== 'admin') {
        const error = new Error('You cannot change your own admin role');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return { user, message: `User role updated to ${role}` };
};

const updateUserTeam = async (managerId, teamMemberIds) => { // assigns team members to manager
    const manager = await User.findById(managerId);
    if (!manager) {
        const error = new Error('Manager not found');
        error.statusCode = 404;
        throw error;
    }

    if (manager.role !== 'manager' && manager.role !== 'admin') {
        const error = new Error('User must be a manager or admin to have team members');
        error.statusCode = 400;
        throw error;
    }

    if (!Array.isArray(teamMemberIds)) {
        const error = new Error('teamMemberIds must be an array');
        error.statusCode = 400;
        throw error;
    }

    const validMembers = await User.find({ _id: { $in: teamMemberIds } });
    if (validMembers.length !== teamMemberIds.length) {
        const error = new Error('Some team member IDs are invalid');
        error.statusCode = 400;
        throw error;
    }

    if (teamMemberIds.includes(managerId)) {
        const error = new Error('Manager cannot be a member of their own team');
        error.statusCode = 400;
        throw error;
    }

    manager.teamMembers = teamMemberIds;
    await manager.save();

    const updatedManager = await User.findById(managerId)
        .select('-password')
        .populate('teamMembers', 'name email role');

    return { manager: updatedManager, message: 'Team members updated successfully' };
};

const getAllTasksAdmin = async ({ status, priority, userId, search }) => { // fetches all tasks across all users, sorted by createdAt desc
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

    const tasks = await Task.find(filter)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .lean();

    return { tasks };
};

const deleteTaskAdmin = async (taskId) => { // deletes any task by ID (admin only)
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
    }

    return { deletedTask: task, message: 'Task deleted successfully' };
};

const getAdminStats = async () => { // returns system-wide statistics
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

    return {
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
    };
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserTeam,
    getAllTasksAdmin,
    deleteTaskAdmin,
    getAdminStats
};