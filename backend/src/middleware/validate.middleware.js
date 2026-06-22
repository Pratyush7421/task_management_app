const { body, validationResult } = require('express-validator');

// Validation rules
const registerValidation = [ // validates name, email, password for registration
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long')
];

const loginValidation = [ // validates email and password for login
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .exists()
        .withMessage('Password is required')
];

const taskValidation = [ // validates task fields (title, status, priority, due_date)
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('description')
        .optional()
        .trim(),
    body('status')
        .optional()
        .isIn(['pending', 'in_progress', 'completed'])
        .withMessage('Status must be pending, in_progress, or completed'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    body('due_date')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date (YYYY-MM-DD)')
];

const roleUpdateValidation = [ // validates role value (user, manager, admin)
    body('role')
        .isIn(['user', 'manager', 'admin'])
        .withMessage('Role must be user, manager, or admin')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => { // checks for validation errors and returns 400 if found
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    registerValidation,
    loginValidation,
    taskValidation,
    roleUpdateValidation,
    handleValidationErrors
};