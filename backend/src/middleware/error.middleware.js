/**
 * ============================================================================
 * GLOBAL ERROR HANDLER MIDDLEWARE
 * ============================================================================
 * Centralized error handling for the entire Express application.
 * 
 * Key Concepts:
 * - Error Middleware: Express middleware with 4 parameters (err, req, res, next)
 * - Centralized Handling: One place to handle all application errors
 * - Error Types: Different handling for different error categories
 * - HTTP Status Codes: Proper status codes for different error types
 * 
 * Error Types Handled:
 * - ValidationError: Mongoose schema validation failures
 * - JsonWebTokenError: Invalid JWT tokens
 * - TokenExpiredError: Expired JWT tokens
 * - MongoDB Errors: Unique constraint violations, foreign key errors
 * - Multer Errors: File upload size limits
 * 
 * Security:
 * - Stack traces only in development (prevents info leakage)
 * - Generic messages for unknown errors
 * - Consistent error response format
 * ============================================================================
 */

/**
 * Global Error Handler
 * 
 * Express error-handling middleware signature:
 * function(err, req, res, next) - 4 parameters!
 * 
 * Must be registered LAST in middleware chain (after all routes).
 * Catches errors from:
 * - Synchronous route handlers
 * - Async route handlers (via next(err))
 * - Middleware errors
 * 
 * @param {Error} err - Error object thrown or passed via next(err)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware (not used in error handler)
 */
const errorHandler = (err, req, res, next) => {
    // Log error for server-side debugging
    // In production, consider using a logging service (Winston, etc.)
    console.error('Error:', err);

    // -------------------------------------------------------------------------
    // DEFAULT ERROR VALUES
    // -------------------------------------------------------------------------
    // Start with generic 500 Internal Server Error
    // Override based on specific error types below
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // -------------------------------------------------------------------------
    // MONGOOSE VALIDATION ERRORS
    // -------------------------------------------------------------------------
    // Occurs when document fails schema validation
    // Example: Missing required field, string too short, invalid enum value
    if (err.name === 'ValidationError') {
        statusCode = 400;  // Bad Request - client sent invalid data
        message = err.message;
    }

    // -------------------------------------------------------------------------
    // MONGODB UNIQUE CONSTRAINT VIOLATION
    // -------------------------------------------------------------------------
    // Error code 11000 (not 23505 - that's PostgreSQL)
    // Occurs when inserting duplicate value in unique-indexed field
    // Example: Duplicate email address
    if (err.code === 11000) {
        statusCode = 409;  // Conflict - resource already exists
        // Extract field name from error message for better UX
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
    }

    // -------------------------------------------------------------------------
    // POSTGRESQL ERRORS (if using PostgreSQL instead of MongoDB)
    // -------------------------------------------------------------------------
    // These codes are for reference if you switch to PostgreSQL
    // 23505: unique_violation
    // 23503: foreign_key_violation
    if (err.code === '23505') {  // PostgreSQL unique violation
        statusCode = 409;
        message = 'Resource already exists';
    }

    if (err.code === '23503') {  // PostgreSQL foreign key violation
        statusCode = 400;
        message = 'Referenced resource does not exist';
    }

    // -------------------------------------------------------------------------
    // JWT ERRORS
    // -------------------------------------------------------------------------
    // Occurs when token is malformed or signature is invalid
    // Different from expired token (handled below)
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;  // Unauthorized - bad credentials
        message = 'Invalid token';
    }

    // Token has expired (exp claim is in the past)
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired. Please log in again.';
    }

    // -------------------------------------------------------------------------
    // MULTER FILE UPLOAD ERRORS
    // -------------------------------------------------------------------------
    // Multer is the file upload middleware
    // LIMIT_FILE_SIZE: File exceeds size limit configured in multer
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File too large. Maximum size is 5MB.';
    }

    // Multer file type rejection
    if (err.message && err.message.includes('Only images, PDFs, and documents')) {
        statusCode = 400;
        message = err.message;  // Use the custom message from multer config
    }

    // -------------------------------------------------------------------------
    // SYNTAX ERRORS (MALFORMED JSON)
    // -------------------------------------------------------------------------
    // Occurs when request body contains invalid JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        message = 'Invalid JSON in request body';
    }

    // -------------------------------------------------------------------------
    // SEND ERROR RESPONSE
    // -------------------------------------------------------------------------
    // Build response object
    const errorResponse = {
        error: message,
        statusCode: statusCode
    };

    // Include stack trace in development only
    // Stack traces reveal file paths and code structure - security risk in production
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        // Also include full error details for debugging
        errorResponse.details = err;
    }

    // Send JSON response with appropriate status code
    res.status(statusCode).json(errorResponse);
};

// Export the error handler middleware
module.exports = errorHandler;