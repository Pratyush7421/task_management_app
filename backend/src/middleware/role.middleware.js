const authorizeRoles = (...allowedRoles) => { // returns middleware for role-based access control
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'You must be logged in to access this resource'
            });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Access denied',
                message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
                yourRole: userRole,
                help: 'Contact an administrator if you need access'
            });
        }

        next();
    };
};

const isAdmin = authorizeRoles('admin');
const isManager = authorizeRoles('manager');
const isManagerOrAdmin = authorizeRoles('manager', 'admin');

module.exports = {
    authorizeRoles,
    isAdmin,
    isManager,
    isManagerOrAdmin
};