const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');
const { roleUpdateValidation, handleValidationErrors } = require('../middleware/validate.middleware');

const router = express.Router();

router.get('/users', authenticateToken, isAdmin, adminController.getAllUsers);
router.get('/users/:id', authenticateToken, isAdmin, adminController.getUserById);
router.put('/users/:id/role', authenticateToken, isAdmin, roleUpdateValidation, handleValidationErrors, adminController.updateUserRole);
router.put('/users/:id/team', authenticateToken, isAdmin, adminController.updateUserTeam);
router.get('/tasks', authenticateToken, isAdmin, adminController.getAllTasks);
router.delete('/tasks/:id', authenticateToken, isAdmin, adminController.deleteTask);
router.get('/stats', authenticateToken, isAdmin, adminController.getStats);

module.exports = router;
