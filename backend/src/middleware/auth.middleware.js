const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => { // verifies JWT, attaches user to req.user
    const authHeader = req.headers['authorization'];//it reads the token
    const token = authHeader && authHeader.split(' ')[1];//pull actual token and split Bearer from header
// If no token, return 401 Unauthorized
    if (!token) {
        return res.status(401).json({
            error: 'Access denied. No token provided.'
        });
    }
// Verify token and attach user info to request object
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            error: 'Invalid or expired token.'
        });
    }
};

const requireRole = (roles) => { // returns middleware that checks if user has allowed role
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required' 
            });
        }

        const userRole = req.user.role;

        if (!roles.includes(userRole)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: roles,
                yourRole: userRole
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole
};