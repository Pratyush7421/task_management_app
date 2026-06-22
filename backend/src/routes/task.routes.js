const express = require('express');
const taskController = require('../controllers/task.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { taskValidation, handleValidationErrors } = require('../middleware/validate.middleware');

const router = express.Router();

router.get('/', authenticateToken, taskController.getAllTasks);
router.get('/stats', authenticateToken, taskController.getStats);
router.get('/:id', authenticateToken, taskController.getTaskById);
router.post('/', authenticateToken, taskValidation, handleValidationErrors, taskController.createTask);
router.put('/:id', authenticateToken, taskValidation, handleValidationErrors, taskController.updateTask);
router.delete('/:id', authenticateToken, taskController.deleteTask);

module.exports = router;
