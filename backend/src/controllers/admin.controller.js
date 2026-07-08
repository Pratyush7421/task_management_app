const AdminService = require('../services/admin.service');

exports.getAllUsers = async (req, res, next) => { // fetches all users with filters and pagination
    try {
        const result = await AdminService.getAllUsers(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getUserById = async (req, res, next) => { // fetches single user with task statistics
    try {
        const result = await AdminService.getUserById(req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.updateUserRole = async (req, res, next) => { // updates user role (prevents self-demotion)
    try {
        const result = await AdminService.updateUserRole(
            req.params.id,
            req.body.role,
            req.user.userId
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.updateUserTeam = async (req, res, next) => { // assigns team members to manager
    try {
        const result = await AdminService.updateUserTeam(
            req.params.id,
            req.body.teamMemberIds
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getAllTasks = async (req, res, next) => { // fetches all tasks across all users
    try {
        const result = await AdminService.getAllTasksAdmin(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.deleteTask = async (req, res, next) => { // deletes any task by ID (admin only)
    try {
        const result = await AdminService.deleteTaskAdmin(req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getStats = async (req, res, next) => { // returns system-wide statistics
    try {
        const result = await AdminService.getAdminStats();
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.createTaskForUser = async (req, res, next) => { // admin creates task for any user
    try {
        // Pass admin user info for email notification context
        const adminUser = {
            _id: req.user.userId,
            name: req.user.name || 'Admin',
            email: req.user.email
        };
        
        const result = await AdminService.createTaskForUser(
            req.body,
            adminUser
        );
        
        // Build response message based on email status
        let message = 'Task created successfully for user';
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
