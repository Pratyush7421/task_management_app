/**
 * ============================================================================
 * TASK ROUTES
 * ============================================================================
 * Defines API endpoints for task management (CRUD operations).
 * 
 * Architecture Pattern: Thin Router
 * - Routes define endpoints, middleware chains, and validation
 * - Business logic delegated to task.controller.js
 * 
 * Endpoints:
 * - GET    /api/v1/tasks        - Get all tasks (with filters/pagination)
 * - GET    /api/v1/tasks/stats  - Get task statistics
 * - GET    /api/v1/tasks/:id    - Get single task
 * - POST   /api/v1/tasks        - Create new task
 * - PUT    /api/v1/tasks/:id    - Update task
 * - DELETE /api/v1/tasks/:id    - Delete task
 * 
 * Features:
 * - File upload support via Multer middleware
 * - Input validation via express-validator
 * - JWT authentication required for all routes
 * ============================================================================
 */

// Express router
const express = require('express');

// Multer: Middleware for handling multipart/form-data (file uploads)
const multer = require('multer');

// Node.js path module for file extension handling
const path = require('path');

// express-validator for input validation
const { body } = require('express-validator');

// Task controller with business logic
const taskController = require('../controllers/task.controller');

// Authentication middleware
const { authenticateToken } = require('../middleware/auth.middleware');

// Create router instance
const router = express.Router();

// ============================================================================
// MULTER FILE UPLOAD CONFIGURATION
// ============================================================================

/**
 * Disk Storage Configuration
 * 
 * Multer storage engine that saves files to disk.
 * Alternative: multer.memoryStorage() saves to RAM (for cloud uploads)
 * 
 * destination: Where to save uploaded files
 * filename: How to name the saved file
 */
const storage = multer.diskStorage({
    /**
     * Destination Function
     * Determines which folder to save the file in
     * 
     * @param {Object} req - Express request
     * @param {Object} file - File info object
     * @param {Function} cb - Callback(error, destination)
     */
    destination: (req, file, cb) => {
        // Save to 'uploads/' directory in project root
        // This directory must exist (create it manually or in setup)
        cb(null, 'uploads/');
    },

    /**
     * Filename Function
     * Generates unique filename to prevent collisions
     * 
     * Format: fieldname-timestamp-randomnumber.extension
     * Example: attachment-1234567890-123456789.pdf
     * 
     * @param {Object} req - Express request
     * @param {Object} file - File info { fieldname, originalname, mimetype }
     * @param {Function} cb - Callback(error, filename)
     */
    filename: (req, file, cb) => {
        // Create unique suffix using timestamp + random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Preserve original file extension
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

/**
 * Multer Upload Instance
 * 
 * Configured with:
 * - storage: Disk storage (saves to uploads/ folder)
 * - limits: Maximum file size of 5MB
 * - fileFilter: Only allow specific file types
 */
const upload = multer({
    storage: storage,
    
    // File size limit: 5MB (5 * 1024 * 1024 bytes)
    limits: { fileSize: 5 * 1024 * 1024 },
    
    /**
     * File Filter Function
     * Validates file type before accepting upload
     * 
     * @param {Object} req - Express request
     * @param {Object} file - File info { originalname, mimetype }
     * @param {Function} cb - Callback(error, acceptFile)
     */
    fileFilter: (req, file, cb) => {
        // Allowed file extensions regex
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        
        // Check file extension (from filename)
        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        
        // Check MIME type (from file content)
        // Both must match to prevent extension spoofing
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            // Accept the file
            return cb(null, true);
        } else {
            // Reject with error (caught by error middleware)
            cb(new Error('Only images, PDFs, and documents are allowed'));
        }
    }
});

// ============================================================================
// VALIDATION MIDDLEWARE CONFIGURATION
// ============================================================================

/**
 * Task Validation Rules
 * 
 * Validates task data for create and update operations:
 * - title: Required, 1-200 characters
 * - description: Optional, trimmed
 * - status: Optional, must be valid enum value
 * - priority: Optional, must be valid enum value
 * - due_date: Optional, must be valid ISO 8601 date
 */
const taskValidation = [
    // Title: Required, length 1-200
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    
    // Description: Optional, just trim whitespace
    body('description')
        .optional()
        .trim(),
    
    // Status: Optional, must be one of the allowed values
    body('status')
        .optional()
        .isIn(['pending', 'in_progress', 'completed'])
        .withMessage('Status must be pending, in_progress, or completed'),
    
    // Priority: Optional, must be one of the allowed values
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    
    // Due date: Optional, must be valid ISO 8601 format (YYYY-MM-DD)
    body('due_date')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date (YYYY-MM-DD)')
];

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

/**
 * GET /api/v1/tasks
 * Get all tasks with optional filtering and pagination
 * 
 * Query Params: page, limit, status, priority, search, sort_by, sort_order
 * Auth: Required (JWT)
 * Access: Role-based (admin=all, manager=team, user=own)
 */
router.get('/', authenticateToken, taskController.getAllTasks);

/**
 * GET /api/v1/tasks/stats
 * Get task statistics for current user
 * 
 * IMPORTANT: This route must be defined BEFORE /:id
 * Otherwise Express would interpret 'stats' as an ID parameter
 * 
 * Auth: Required (JWT)
 */
router.get('/stats', authenticateToken, taskController.getStats);

/**
 * GET /api/v1/tasks/:id
 * Get single task by MongoDB ObjectId
 * 
 * URL Params: id (MongoDB ObjectId)
 * Auth: Required (JWT)
 * Access: Admin=any task, User=own tasks only
 */
router.get('/:id', authenticateToken, taskController.getTaskById);

/**
 * POST /api/v1/tasks
 * Create a new task
 * 
 * Body: { title, description?, status?, priority?, due_date? }
 * File: Optional attachment (multipart/form-data)
 * Auth: Required (JWT)
 * 
 * Middleware Chain:
 * 1. authenticateToken - Verify JWT
 * 2. upload.single('attachment') - Handle optional file upload
 * 3. taskValidation - Validate request body
 * 4. taskController.createTask - Create task in database
 */
router.post('/', authenticateToken, upload.single('attachment'), taskValidation, taskController.createTask);

/**
 * PUT /api/v1/tasks/:id
 * Update an existing task (full or partial update)
 * 
 * URL Params: id (MongoDB ObjectId)
 * Body: { title?, description?, status?, priority?, due_date? }
 * File: Optional new attachment
 * Auth: Required (JWT)
 * Access: Admin=any task, User=own tasks only
 */
router.put('/:id', authenticateToken, upload.single('attachment'), taskValidation, taskController.updateTask);

/**
 * DELETE /api/v1/tasks/:id
 * Delete a task permanently
 * 
 * URL Params: id (MongoDB ObjectId)
 * Auth: Required (JWT)
 * Access: Admin=any task, User=own tasks only
 */
router.delete('/:id', authenticateToken, taskController.deleteTask);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

// Mounted at: app.use('/api/v1/tasks', taskRoutes);
module.exports = router;