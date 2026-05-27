/**
 * Task Routes
 * Thin router - delegates all logic to controllers
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const taskController = require('../controllers/task.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, PDFs, and documents are allowed'));
        }
    }
});

// Validation
const taskValidation = [
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('status').optional().isIn(['pending', 'in_progress', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('due_date').optional().isISO8601()
];

// Routes
router.get('/', authenticateToken, taskController.getAllTasks);
router.get('/stats', authenticateToken, taskController.getStats);
router.get('/:id', authenticateToken, taskController.getTaskById);
router.post('/', authenticateToken, upload.single('attachment'), taskValidation, taskController.createTask);
router.put('/:id', authenticateToken, upload.single('attachment'), taskValidation, taskController.updateTask);
router.delete('/:id', authenticateToken, taskController.deleteTask);

module.exports = router;