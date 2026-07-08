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

exports.createTask = async (req, res, next) => { // creates new task and sends notification email
    try {
        // Pass current user info for email notification context
        const currentUser = {
            _id: req.user.userId,
            name: req.user.name || 'Admin',
            email: req.user.email
        };
        
        const result = await TaskService.createTask(
            req.user.userId,
            req.body,
            currentUser
        );
        
        // Build response message based on email status
        let message = 'Task created successfully';
        if (result.emailSent) {
            message += '. Notification email sent successfully.';
        } else if (result.emailError) {
            message += '. Email notification could not be delivered.';
        }
        
        res.status(201).json({
            message,
            task: result.task,
            emailSent: result.emailSent,
            emailStatus: result.emailStatus,
            ...(result.emailError && { emailError: result.emailError })
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