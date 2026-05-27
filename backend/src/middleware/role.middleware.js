/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if user has required role(s) to access a route
 */

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user exists (should be set by auth.middleware)
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role;

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Access denied',
                message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
                yourRole: userRole
            });
        }

        // User has required role, proceed
        next();
    };
};

// Convenience middleware for specific roles
const isAdmin = authorizeRoles('admin');
const isManager = authorizeRoles('manager', 'admin'); // Admin can also do manager things
const isManagerOrAdmin = authorizeRoles('manager', 'admin');

module.exports = {
    authorizeRoles,
    isAdmin,
    isManager,
    isManagerOrAdmin
};