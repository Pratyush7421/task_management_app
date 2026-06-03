/**
 * ============================================================================
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * ============================================================================
 * Provides flexible role-based authorization for Express routes.
 * 
 * Key Concepts:
 * - RBAC: Role-Based Access Control - permissions based on user roles
 * - Middleware Factory: Function that creates customized middleware
 * - Role Hierarchy: user < manager < admin (increasing permissions)
 * 
 * Usage Patterns:
 * - Single role: authorizeRoles('admin')
 * - Multiple roles: authorizeRoles('manager', 'admin')
 * - Predefined shortcuts: isAdmin, isManager, isManagerOrAdmin
 * 
 * Security:
 * - Always use AFTER authenticateToken middleware
 * - Returns 401 if not authenticated
 * - Returns 403 if wrong role
 * - Clear error messages help debugging
 * ============================================================================
 */

/**
 * Authorize Roles Factory Function
 * 
 * Creates middleware that checks if the authenticated user has one of the
 * allowed roles. Must be used after authenticateToken middleware.
 * 
 * How it works:
 * 1. Receives allowed roles as arguments (...allowedRoles)
 * 2. Returns Express middleware function
 * 3. Middleware checks req.user.role against allowed roles
 * 4. Proceeds if authorized, returns error if not
 * 
 * @param {...string} allowedRoles - Roles permitted to access the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Allow only admins
 * router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), deleteUser);
 * 
 * // Allow managers and admins
 * router.get('/reports', authenticateToken, authorizeRoles('manager', 'admin'), getReports);
 */
const authorizeRoles = (...allowedRoles) => {
    // Return the actual middleware function
    // This closure remembers allowedRoles via closure scope
    return (req, res, next) => {
        // ---------------------------------------------------------------------
        // AUTHENTICATION CHECK
        // ---------------------------------------------------------------------
        // Verify that authenticateToken middleware ran first
        // req.user is set by JWT verification in auth.middleware
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'You must be logged in to access this resource'
            });
        }

        // Extract role from authenticated user
        const userRole = req.user.role;

        // ---------------------------------------------------------------------
        // AUTHORIZATION CHECK
        // ---------------------------------------------------------------------
        // Check if user's role is in the allowed roles list
        // Array.includes() checks for membership
        if (!allowedRoles.includes(userRole)) {
            // 403 Forbidden: Authenticated but not authorized
            return res.status(403).json({
                error: 'Access denied',
                message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
                yourRole: userRole,
                help: 'Contact an administrator if you need access'
            });
        }

        // ---------------------------------------------------------------------
        // AUTHORIZED - PROCEED
        // ---------------------------------------------------------------------
        // User has required role, continue to route handler
        next();
    };
};

// ============================================================================
// CONVENIENCE MIDDLEWARE EXPORTS
// ============================================================================
// These are pre-configured middleware for common role checks
// They make route definitions cleaner and more readable

/**
 * Admin Only Middleware
 * Usage: router.get('/admin-only', authenticateToken, isAdmin, handler);
 */
const isAdmin = authorizeRoles('admin');

/**
 * Manager Only Middleware
 * Note: Admin is NOT included - use isManagerOrAdmin for that
 * Usage: router.get('/manager-only', authenticateToken, isManager, handler);
 */
const isManager = authorizeRoles('manager');

/**
 * Manager or Admin Middleware
 * Most common for management-level routes
 * Usage: router.get('/management', authenticateToken, isManagerOrAdmin, handler);
 */
const isManagerOrAdmin = authorizeRoles('manager', 'admin');

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    authorizeRoles,    // Factory function for custom role checks
    isAdmin,           // Pre-configured: admin only
    isManager,         // Pre-configured: manager only
    isManagerOrAdmin   // Pre-configured: manager or admin
};