/**
 * ============================================================================
 * AUTHENTICATION ROUTES
 * ============================================================================
 * Defines API endpoints for user authentication.
 * 
 * Architecture Pattern: Thin Router
 * - Routes only define endpoints and middleware chain
 * - All business logic delegated to controllers
 * - Validation happens in route middleware (express-validator)
 * 
 * Endpoints:
 * - POST /api/v1/auth/register - Create new account
 * - POST /api/v1/auth/login    - Authenticate and get token
 * - GET  /api/v1/auth/profile  - Get current user (protected)
 * 
 * Security:
 * - Input validation prevents injection attacks
 * - Password requirements enforced at API level
 * - Protected routes require valid JWT
 * ============================================================================
 */

// Express router for creating modular route handlers
const express = require('express');

// express-validator: Input validation and sanitization middleware
const { body } = require('express-validator');

// Controller functions containing business logic
const authController = require('../controllers/auth.controller');

// Authentication middleware to protect routes
const { authenticateToken } = require('../middleware/auth.middleware');

// Create a new router instance
// Routers are mini Express apps that can be mounted at specific paths
const router = express.Router();

// ============================================================================
// VALIDATION MIDDLEWARE CONFIGURATION
// ============================================================================

/**
 * Registration Validation Rules
 * 
 * Validates user input before registration:
 * - email: Must be valid email format, normalized to lowercase
 * - password: Minimum 6 characters for security
 * - name: Minimum 2 characters, trimmed of whitespace
 * 
 * These validators run before the controller and return 400 if invalid
 */
const registerValidation = [
    // Validate email format
    // isEmail() checks for valid email structure
    // normalizeEmail() converts to lowercase and standardizes format
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    // Validate password length
    // isLength({ min: 6 }) enforces minimum security requirement
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    
    // Validate name
    // trim() removes leading/trailing whitespace
    // isLength ensures meaningful names
    body('name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long')
];

/**
 * Login Validation Rules
 * 
 * Validates login credentials:
 * - email: Must be valid email format
 * - password: Must be provided (presence check only, verification in controller)
 * 
 * Note: We don't validate password length here because:
 * 1. User might have old account with different requirements
 * 2. Actual verification happens in controller with bcrypt
 */
const loginValidation = [
    // Validate email format
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    // Ensure password is provided
    // exists() checks for any value (including empty string)
    body('password')
        .exists()
        .withMessage('Password is required')
];

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

/**
 * POST /api/v1/auth/register
 * Register a new user account
 * 
 * Request Body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "securepassword"
 * }
 * 
 * Response:
 * {
 *   "message": "User registered successfully",
 *   "user": { "id", "email", "name", "role" },
 *   "token": "eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Middleware Chain:
 * 1. registerValidation - Validate input
 * 2. authController.register - Create user and return token
 */
router.post('/register', registerValidation, authController.register);

/**
 * POST /api/v1/auth/login
 * Authenticate user and receive JWT token
 * 
 * Request Body:
 * {
 *   "email": "john@example.com",
 *   "password": "securepassword"
 * }
 * 
 * Response:
 * {
 *   "message": "Login successful",
 *   "user": { "id", "email", "name", "role" },
 *   "token": "eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Error Responses:
 * - 400: Validation errors
 * - 401: Invalid credentials (generic message for security)
 */
router.post('/login', loginValidation, authController.login);

/**
 * GET /api/v1/auth/profile
 * Get current authenticated user's profile
 * 
 * Headers Required:
 * Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   "user": { "id", "email", "name", "role", "createdAt", "updatedAt" }
 * }
 * 
 * Middleware Chain:
 * 1. authenticateToken - Verify JWT and attach req.user
 * 2. authController.getProfile - Fetch user from database
 */
router.get('/profile', authenticateToken, authController.getProfile);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

// Export router to be mounted in server.js
// Mounted at: app.use('/api/v1/auth', authRoutes);
module.exports = router;