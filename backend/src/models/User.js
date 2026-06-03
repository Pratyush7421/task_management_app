/**
 * ============================================================================
 * USER MODEL - Mongoose Schema Definition
 * ============================================================================
 * This file defines the User schema for MongoDB using Mongoose.
 * It represents the structure of user documents in the 'users' collection.
 * 
 * Key Concepts:
 * - Schema: Blueprint defining document structure and validation
 * - Model: Compiled schema used for database operations
 * - Validation: Built-in and custom validation rules
 * - Indexing: Optimizes query performance
 * 
 * Security Note:
 * - Passwords are stored hashed (bcrypt in controller, not here)
 * - Never store plain-text passwords in the database
 * ============================================================================
 */

// Import Mongoose to define schema and create model
const mongoose = require('mongoose');

/**
 * User Schema Definition
 * 
 * Defines the structure and validation rules for user documents.
 * Each field has specific constraints to ensure data integrity.
 */
const userSchema = new mongoose.Schema({
    /**
     * Email Field
     * - type: String - stores text data
     * - required: [true, 'message'] - mandatory field with custom error message
     * - unique: true - creates unique index, prevents duplicate emails
     * - lowercase: true - converts to lowercase before saving
     * - trim: true - removes whitespace from start/end
     * - match: RegExp - validates email format using regex pattern
     */
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },

    /**
     * Password Field
     * - Stores hashed password (never plain text!)
     * - minlength: Minimum character requirement for security
     * - Hashing happens in auth.controller.js before saving
     */
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },

    /**
     * Name Field
     * - User's display name
     * - trim: Removes accidental whitespace
     * - minlength: Ensures meaningful names
     */
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters']
    },

    /**
     * Role Field
     * - enum: Restricts to specific values only
     * - default: 'user' - new accounts are regular users
     * - Roles: user < manager < admin (hierarchy of permissions)
     */
    role: {
        type: String,
        enum: ['user', 'manager', 'admin'],
        default: 'user'
    },

    /**
     * Team Members Field
     * - Array of ObjectIds referencing other User documents
     * - ref: 'User' - enables Mongoose populate() to fetch full user data
     * - Used for managers to track their team members
     * - default: [] - starts as empty array
     */
    teamMembers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    }
}, {
    /**
     * Schema Options
     * timestamps: true - automatically adds:
     *   - createdAt: Date when document was first saved
     *   - updatedAt: Date when document was last modified
     */
    timestamps: true
});

/**
 * Export the User Model
 * 
 * mongoose.model('User', userSchema) creates a model named 'User'
 * - First argument: Model name (singular, capitalized)
 * - Second argument: Schema definition
 * 
 * Mongoose automatically pluralizes and lowercases for collection name:
 * 'User' → 'users' collection in MongoDB
 */
module.exports = mongoose.model('User', userSchema);