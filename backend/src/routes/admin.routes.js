/**
 * Admin Routes
 * Thin router - delegates all logic to controllers
 */

const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

const router = express.Router();

// Validation for role update
const roleUpdateValidation = [
    body('role')
        .isIn(['user', 'manager', 'admin'])
        .withMessage('Role must be user, manager, or admin')
];

// User management routes
router.get('/users', authenticateToken, isAdmin, adminController.getAllUsers);
router.get('/users/:id', authenticateToken, isAdmin, adminController.getUserById);
router.put('/users/:id/role', authenticateToken, isAdmin, roleUpdateValidation, adminController.updateUserRole);
router.put('/users/:id/team', authenticateToken, isAdmin, adminController.updateUserTeam);

// Task management routes
router.get('/tasks', authenticateToken, isAdmin, adminController.getAllTasks);
router.delete('/tasks/:id', authenticateToken, isAdmin, adminController.deleteTask);

// Statistics route
router.get('/stats', authenticateToken, isAdmin, adminController.getStats);

module.exports = router;