const TaskService = require('../services/task.service');

exports.getAllTasks = async (req, res, next) => { // fetches tasks with filters, sorting
    try {
        const result = await TaskService.getAllTasks(
            req.user.userId,
            req.user.role,
            req.query
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getStats = async (req, res, next) => { // returns task statistics for current user
    try {
        const stats = await TaskService.getTaskStats(req.user.userId);
        res.json({ stats });
    } catch (err) {
        next(err);
    }
};

exports.getTaskById = async (req, res, next) => { // fetches single task by ID (with ownership check)
    try {
        const result = await TaskService.getTaskById(
            req.params.id,
            req.user.userId,
            req.user.role
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.createTask = async (req, res, next) => { // creates new task
    try {
        const result = await TaskService.createTask(
            req.user.userId,
            req.body
        );
        res.status(201).json({
            message: 'Task created successfully',
            ...result
        });
    } catch (err) {
        next(err);
    }
};

exports.updateTask = async (req, res, next) => { // updates task by ID (with ownership check)
    try {
        const result = await TaskService.updateTask(
            req.params.id,
            req.user.userId,
            req.user.role,
            req.body
        );
        res.json({
            message: 'Task updated successfully',
            ...result
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteTask = async (req, res, next) => { // deletes task by ID (with ownership check)
    try {
        const result = await TaskService.deleteTask(
            req.params.id,
            req.user.userId,
            req.user.role
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
};