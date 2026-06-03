/**
 * ============================================================================
 * DATABASE CONFIGURATION MODULE
 * ============================================================================
 * This module establishes and manages the MongoDB database connection using
 * Mongoose ODM (Object Document Mapper).
 * 
 * Key Concepts:
 * - Mongoose: MongoDB object modeling for Node.js
 * - Connection pooling: Reuses connections for better performance
 * - Graceful shutdown: Properly closes connections on app termination
 * 
 * Environment Variables Required:
 * - MONGODB_URI: MongoDB connection string (fallback: localhost)
 * ============================================================================
 */

// Import Mongoose library for MongoDB interaction
const mongoose = require('mongoose');

// Load environment variables from .env file
require('dotenv').config();

/**
 * Connect to MongoDB Database
 * 
 * This async function establishes a connection to MongoDB using Mongoose.
 * It handles connection errors and logs successful connections.
 * 
 * Connection Options (Mongoose 6+):
 * - useNewUrlParser and useUnifiedTopology are now defaults, no longer needed
 * - Connection pooling is automatic (default: 100 connections max)
 * 
 * @async
 * @returns {Promise<void>}
 * @throws {Error} Exits process if connection fails
 */
const connectDB = async () => {
    try {
        // Attempt to connect to MongoDB
        // process.env.MONGODB_URI should be defined in .env file
        // Fallback to local MongoDB if env var not set
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster', {
            // These options are no longer needed in Mongoose 6+, but kept for clarity
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });

        // Log successful connection with host info
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Log error and exit process if connection fails
        // This prevents the app from running without a database
        console.error('❌ MongoDB connection error:', error);
        process.exit(1); // Exit with failure code
    }
};

// ============================================================================
// CONNECTION EVENT LISTENERS
// ============================================================================

/**
 * Error Event Handler
 * Fires when there's an error after initial connection
 * Useful for catching network issues or database downtime
 */
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

/**
 * Disconnected Event Handler
 * Fires when Mongoose loses connection to MongoDB
 * Could happen due to network issues or MongoDB restart
 */
mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

// ============================================================================
// GRACEFUL SHUTDOWN HANDLING
// ============================================================================

/**
 * SIGINT Handler (Ctrl+C)
 * Ensures database connection is properly closed before app exits
 * Prevents connection leaks and data corruption
 */
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0); // Exit cleanly
});

// Export the connection function for use in server.js
module.exports = connectDB;