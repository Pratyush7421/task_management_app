/**
 * ============================================================================
 * TASKMASTER PRO - BACKEND SERVER ENTRY POINT
 * ============================================================================
 * This is the main server file that initializes the Express application,
 * sets up middleware, connects to the database, and defines all API routes.
 * 
 * Key Responsibilities:
 * - Initialize Express app and configure middleware
 * - Connect to MongoDB database
 * - Set up security headers (Helmet), CORS, and logging (Morgan)
 * - Define API routes for authentication, tasks, and admin operations
 * - Handle 404 errors and global error handling
 * ============================================================================
 */

// ─── IMPORTS ──────────────────────────────────────────────────────────────
const express = require('express');           // Web framework for Node.js
const cors = require('cors');                 // Enable Cross-Origin Resource Sharing
const helmet = require('helmet');             // Set security HTTP headers
const morgan = require('morgan');             // HTTP request logger middleware
require('dotenv').config();                   // Load environment variables from .env file

// Import database connection function
const connectDB = require('./src/config/database');

// Import route handlers
const authRoutes = require('./src/routes/auth.routes');     // Auth routes (login, register)
const taskRoutes = require('./src/routes/task.routes');     // Task CRUD routes
const adminRoutes = require('./src/routes/admin.routes');   // Admin-only routes

// Import error handling middleware
const errorHandler = require('./src/middleware/error.middleware');

// ─── APP INITIALIZATION ───────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;  // Server port (default: 5000)

// ─── DATABASE CONNECTION ──────────────────────────────────────────────────
/**
 * Connect to MongoDB database
 * This establishes the connection to the MongoDB instance specified in .env
 */
connectDB();

// ─── MIDDLEWARE SETUP ─────────────────────────────────────────────────────
/**
 * Security & Logging Middleware
 * - helmet(): Adds security headers to prevent common vulnerabilities
 * - cors(): Allows requests from different origins (frontend domain)
 * - morgan('dev'): Logs HTTP requests in development format
 * - express.json(): Parses incoming JSON request bodies
 * - express.urlencoded(): Parses URL-encoded form data
 */
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Static File Serving
 * Serves uploaded files from the 'uploads' directory
 * Example: /uploads/image.jpg will serve the file from ./uploads/image.jpg
 */
app.use('/uploads', express.static('uploads'));

// ─── API ROUTES ───────────────────────────────────────────────────────────
/**
 * Health Check Endpoint
 * Returns server status to verify the API is running
 * GET /api/health → { status: 'OK', message: '...' }
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'TaskMaster Pro API is running' });
});

/**
 * Mount Route Handlers
 * All routes are prefixed with /api/v1 for API versioning
 * 
 * /api/v1/auth   → Authentication routes (register, login, logout)
 * /api/v1/tasks  → Task management routes (create, read, update, delete)
 * /api/v1/admin  → Admin-only routes (user management, statistics)
 */
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/admin', adminRoutes);

// ─── 404 ERROR HANDLER ─────────────────────────────────────────────────────
/**
 * Catch-all middleware for undefined routes
 * Returns 404 error if no route matches the request
 */
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────
/**
 * Global error handling middleware
 * Catches all errors thrown in route handlers and middleware
 * Formats error responses consistently
 */
app.use(errorHandler);

// ─── START SERVER ─────────────────────────────────────────────────────────
/**
 * Listen on specified PORT
 * Logs server startup information to console
 */
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
