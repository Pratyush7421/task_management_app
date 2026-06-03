/**
 * ============================================================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================================================
 * Verifies JWT tokens and protects routes from unauthorized access.
 * 
 * Key Concepts:
 * - JWT (JSON Web Token): Stateless authentication mechanism
 * - Bearer Token: Token format in HTTP Authorization header
 * - Middleware: Functions that execute before route handlers
 * 
 * How JWT Works:
 * 1. User logs in → Server creates JWT with user data
 * 2. Client stores JWT (localStorage/cookie)
 * 3. Client sends JWT in Authorization header for protected requests
 * 4. Server verifies JWT signature and extracts user data
 * 5. Server processes request with authenticated user context
 * 
 * Security:
 * - Tokens expire after set time (prevents indefinite access)
 * - Secret key must be kept secure (used for signing/verification)
 * - HTTPS required in production (prevents token interception)
 * ============================================================================
 */

// JWT library for token verification
const jwt = require('jsonwebtoken');

// ============================================================================
// TOKEN AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Authenticate JWT Token
 * 
 * Verifies the JWT token from the Authorization header.
 * If valid, attaches decoded user data to req.user.
 * If invalid, returns 401 or 403 error.
 * 
 * Expected Header Format:
 * Authorization: Bearer <token>
 * 
 * Token Payload Contains:
 * - userId: MongoDB ObjectId of the user
 * - email: User's email address
 * - role: User's role (user, manager, admin)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authenticateToken = (req, res, next) => {
    // Get Authorization header from request
    // Format: "Bearer eyJhbGciOiJIUzI1NiIs..."
    const authHeader = req.headers['authorization'];
    
    // Extract token from "Bearer <token>" format
    // Split by space and get the second part (index 1)
    // If authHeader is undefined, token will be undefined
    const token = authHeader && authHeader.split(' ')[1];

    // Check if token exists
    if (!token) {
        // 401 Unauthorized: No authentication credentials provided
        return res.status(401).json({
            error: 'Access denied. No token provided.'
        });
    }

    try {
        // Verify token signature and decode payload
        // jwt.verify(token, secret) returns decoded payload if valid
        // Throws error if token is invalid or expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach decoded user data to request object
        // Subsequent middleware and controllers can access req.user
        // Contains: { userId, email, role, iat, exp }
        req.user = decoded;
        
        // Continue to next middleware or route handler
        next();
    } catch (err) {
        // Token verification failed (invalid signature or expired)
        // 403 Forbidden: Valid credentials but insufficient permissions
        // (In this case, token is invalid so can't determine permissions)
        return res.status(403).json({
            error: 'Invalid or expired token.'
        });
    }
};

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// ============================================================================

/**
 * Require Specific Role(s)
 * 
 * Factory function that creates middleware to check user roles.
 * Use after authenticateToken middleware (requires req.user).
 * 
 * Usage:
 * router.get('/admin-only', authenticateToken, requireRole('admin'), handler);
 * router.get('/manager-plus', authenticateToken, requireRole('manager', 'admin'), handler);
 * 
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'manager')
 * @returns {Function} Express middleware function
 */
const requireRole = (roles) => {
    // Return middleware function
    return (req, res, next) => {
        // Check if authenticateToken was called first
        // req.user should be set by previous middleware
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required' 
            });
        }

        const userRole = req.user.role;

        // Check if user's role is in the allowed roles array
        // Array.includes() returns true if value exists in array
        if (!roles.includes(userRole)) {
            // 403 Forbidden: Authenticated but not authorized
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: roles,
                yourRole: userRole
            });
        }

        // User has required role, proceed to route handler
        next();
    };
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    authenticateToken,  // Main authentication middleware
    requireRole         // Role-based authorization factory
};