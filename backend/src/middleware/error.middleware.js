const errorHandler = (err, req, res, next) => { // handles errors, maps to appropriate HTTP status codes
    console.error('Error:', err);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
    }

    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
    }

    if (err.code === '23505') {
        statusCode = 409;
        message = 'Resource already exists';
    }

    if (err.code === '23503') {
        statusCode = 400;
        message = 'Referenced resource does not exist';
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired. Please log in again.';
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File too large. Maximum size is 5MB.';
    }

    if (err.message && err.message.includes('Only images, PDFs, and documents')) {
        statusCode = 400;
        message = err.message;
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        message = 'Invalid JSON in request body';
    }

    const errorResponse = {
        error: message,
        statusCode: statusCode
    };

    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = err;
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;