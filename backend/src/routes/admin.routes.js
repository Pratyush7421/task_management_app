/**
 * ============================================================================
 * ADMIN ROUTES
 * ============================================================================
 * Defines API endpoints for admin-only operations.
 * 
 * Architecture Pattern: Thin Router
 * - Routes define endpoints and middleware chains
 * - Business logic delegated to admin.controller.js
 * 
 * Security:
 * - ALL routes require JWT authentication (authenticateToken)
 * - ALL routes require admin role (isAdmin)
 * - Double protection: authentication + authorization
 * 
 * Endpoints:
 * User Management:
 * - GET  /api/v1/admin/users           - List all users
 * - GET  /api/v1/admin/users/:id       - Get user details + task stats
 * - PUT  /api/v1/admin/users/:id/role  - Change user role
 * - PUT  /api/v1/admin/users/:id/team  - Assign team members
 * 
 * Task Management:
 * - GET    /api/v1/admin/tasks      - Get all tasks from all users
 * - DELETE /api/v1/admin/tasks/:id  - Delete any task
 * 
 * Statistics:
 * - GET /api/v1/admin/stats - System-wide statistics
 * ============================================================================
 */

// Express router
const express = require('express');

// express-validator for input validation
const { body } = require('express-validator');

// Admin controller with business logic
const adminController = require('../controllers/admin.controller');

// Authentication middleware (verifies JWT token)
const { authenticateToken } = require('../middleware/auth.middleware');

// Role authorization middleware (checks user role)
const { isAdmin } = require('../middleware/role.middleware');

// Create router instance
const router = express.Router();

// ============================================================================
// VALIDATION MIDDLEWARE CONFIGURATION
// ============================================================================

/**
 * Role Update Validation
 * 
 * Validates the role value when changing a user's role.
 * Ensures only valid roles can be assigned.
 */
const roleUpdateValidation = [
    body('role')
        .isIn(['user', 'manager', 'admin'])
        .withMessage('Role must be user, manager, or admin')
];

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/v1/admin/users
 * List all users with pagination and filtering
 * 
 * Query Params: page, limit, role, search
 * Auth: JWT required
 * Role: Admin only
 * 
 * Middleware Chain:
 * 1. authenticateToken - Verify JWT token
 * 2. isAdmin - Verify user has admin role
 * 3. adminController.getAllUsers - Fetch users from database
 */
router.get('/users', authenticateToken, isAdmin, adminController.getAllUsers);

/**
 * GET /api/v1/admin/users/:id
 * Get detailed user info including task statistics
 * 
 * URL Params: id (MongoDB ObjectId)
 * Auth: JWT required
 * Role: Admin only
 */
router.get('/users/:id', authenticateToken, isAdmin, adminController.getUserById);

/**
 * PUT /api/v1/admin/users/:id/role
 * Change a user's role
 * 
 * URL Params: id (MongoDB ObjectId)
 * Body: { "role": "user" | "manager" | "admin" }
 * Auth: JWT required
 * Role: Admin only
 * 
 * Security: Admin cannot change their own role (prevents lockout)
 * 
 * Middleware Chain:
 * 1. authenticateToken - Verify JWT
 * 2. isAdmin - Verify admin role
 * 3. roleUpdateValidation - Validate role value
 * 4. adminController.updateUserRole - Update in database
 */
router.put('/users/:id/role', authenticateToken, isAdmin, roleUpdateValidation, adminController.updateUserRole);

/**
 * PUT /api/v1/admin/users/:id/team
 * Assign team members to a manager
 * 
 * URL Params: id (MongoDB ObjectId of manager)
 * Body: { "teamMemberIds": ["userId1", "userId2", ...] }
 * Auth: JWT required
 * Role: Admin only
 * 
 * Business Rules:
 * - Target user must be manager or admin
 * - All team member IDs must be valid
 * - Manager cannot be in their own team
 */
router.put('/users/:id/team', authenticateToken, isAdmin, adminController.updateUserTeam);

// ============================================================================
// TASK MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/v1/admin/tasks
 * Get all tasks from all users
 * 
 * Query Params: page, limit, status, priority, userId, search, sort_by, sort_order
 * Auth: JWT required
 * Role: Admin only
 * 
 * Note: Unlike /api/v1/tasks which filters by role,
 * this endpoint always returns ALL tasks
 */
router.get('/tasks', authenticateToken, isAdmin, adminController.getAllTasks);

/**
 * DELETE /api/v1/admin/tasks/:id
 * Delete any task regardless of ownership
 * 
 * URL Params: id (MongoDB ObjectId)
 * Auth: JWT required
 * Role: Admin only
 * 
 * Note: Regular users can only delete their own tasks
 * Admins can delete any task via this endpoint
 */
router.delete('/tasks/:id', authenticateToken, isAdmin, adminController.deleteTask);

// ============================================================================
// STATISTICS ROUTES
// ============================================================================

/**
 * GET /api/v1/admin/stats
 * Get system-wide statistics
 * 
 * Returns:
 * - Total users and breakdown by role
 * - Total tasks and breakdown by status
 * - Top 10 users by task count
 * 
 * Auth: JWT required
 * Role: Admin only
 */
router.get('/stats', authenticateToken, isAdmin, adminController.getStats);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

// Mounted at: app.use('/api/v1/admin', adminRoutes);
module.exports = router;