const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');

//hepler function to build query filter based on user role and filters
const buildTaskFilter = async (userId, userRole, { status, priority, search }) => { // builds query filter based on user role and filters
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

    return filter;
};

const getAllTasks = async (userId, userRole, { status, priority, search }) => { // fetches tasks with filters and sorting by createdAt desc
    const filter = await buildTaskFilter(userId, userRole, { status, priority, search });

    const tasks = await Task.find(filter)
        .sort({ createdAt: -1 }) //sorts tasks by createdAt in descending order
        .lean();//convert mongooese query result method to plain JavaScript object for better performance and easier manipulation

    return { tasks };
};

const getTaskStats = async (userId) => { // returns task statistics for user
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

    return stats.length > 0 ? stats[0] : {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        high_priority: 0
    };
};

const getTaskById = async (taskId, userId, userRole) => { // fetches single task by ID with ownership check
    const filter = userRole === 'admin'
        ? { _id: taskId }
        : { _id: taskId, userId };

    const task = await Task.findOne(filter).lean();

    if (!task) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
    }

    return { task };
};

const createTask = async (userId, taskData) => { // creates new task
    const { title, description, status, priority, due_date } = taskData;

    const task = await Task.create({
        userId,
        title,
        description: description || '',
        status: status || 'pending',
        priority: priority || 'medium',
        dueDate: due_date || null
    });

    return { task };
};

const updateTask = async (taskId, userId, userRole, updateData) => { // updates task by ID with ownership check
    const { title, description, status, priority, due_date } = updateData;

    const ownerFilter = userRole === 'admin'
        ? { _id: taskId }//if user is admin, filter by taskId only
        : { _id: taskId, userId };//if user is not admin, filter by taskId and userId to ensure ownership

    const existingTask = await Task.findOne(ownerFilter);
    if (!existingTask) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) updateFields.status = status;
    if (priority !== undefined) updateFields.priority = priority;
    if (due_date !== undefined) updateFields.dueDate = due_date;

    const task = await Task.findByIdAndUpdate(
        taskId,
        updateFields,
        { new: true, runValidators: true }
    );

    return { task };
};

const deleteTask = async (taskId, userId, userRole) => { // deletes task by ID with ownership check
    const filter = userRole === 'admin'
        ? { _id: taskId }
        : { _id: taskId, userId };

    const task = await Task.findOneAndDelete(filter);

    if (!task) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
    }

    return { message: 'Task deleted successfully' };
};

module.exports = {
    getAllTasks,
    getTaskStats,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};