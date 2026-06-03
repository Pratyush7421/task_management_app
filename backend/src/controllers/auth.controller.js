/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER
 * ============================================================================
 * Handles all authentication-related business logic including user registration,
 * login, and profile retrieval.
 * 
 * Key Concepts:
 * - bcrypt: Password hashing library (one-way encryption)
 * - JWT (JSON Web Token): Stateless authentication token
 * - express-validator: Input validation and sanitization
 * - Async/await: Modern asynchronous JavaScript pattern
 * 
 * Security Practices:
 * - Passwords are hashed with bcrypt (salt rounds = 10)
 * - JWT tokens expire after 7 days
 * - Validation errors are returned before any DB operations
 * - Same error message for wrong email/password (prevents user enumeration)
 * ============================================================================
 */

// bcrypt: Used to hash passwords and compare hashed passwords
const bcrypt = require('bcrypt');

// jsonwebtoken: Used to create and verify JWT tokens
const jwt = require('jsonwebtoken');

// express-validator: Extracts validation errors from request
const { validationResult } = require('express-validator');

// User model for database operations
const User = require('../models/User');

// ============================================================================
// REGISTER CONTROLLER
// ============================================================================

/**
 * Register a New User
 * POST /api/v1/auth/register
 * 
 * Flow:
 * 1. Validate request body (email, password, name)
 * 2. Check if email already exists in database
 * 3. Hash the password using bcrypt
 * 4. Create new user document in MongoDB
 * 5. Generate JWT token for immediate login
 * 6. Return user data + token
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - { email, password, name }
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware (error handler)
 */
exports.register = async (req, res, next) => {
    try {
        // Step 1: Check for validation errors from express-validator middleware
        // validationResult() collects all errors from body() validators in routes
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return 400 Bad Request with array of validation errors
            return res.status(400).json({ errors: errors.array() });
        }

        // Step 2: Destructure required fields from request body
        const { email, password, name } = req.body;

        // Step 3: Check if user with this email already exists
        // findOne() returns null if not found, or the user document if found
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // 409 Conflict: Resource already exists
            return res.status(409).json({ error: 'User already exists' });
        }

        // Step 4: Hash the password before storing
        // bcrypt.hash(password, saltRounds)
        // saltRounds = 10: Higher = more secure but slower (10 is industry standard)
        // bcrypt adds a random salt automatically, making each hash unique
        const hashedPassword = await bcrypt.hash(password, 10);

        // Step 5: Create new user in MongoDB
        // User.create() is shorthand for new User({...}).save()
        const user = await User.create({
            email,
            password: hashedPassword, // Store hashed password, never plain text
            name,
            role: 'user' // Default role for new registrations
        });

        // Step 6: Generate JWT token for immediate authentication
        // jwt.sign(payload, secret, options)
        // - payload: Data to encode in the token (userId, email, role)
        // - secret: Secret key from environment variables
        // - expiresIn: Token expiry time (7 days)
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Step 7: Return success response with user data and token
        // 201 Created: Resource was successfully created
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
                // Note: password is intentionally excluded from response
            },
            token // Client stores this token for future authenticated requests
        });
    } catch (err) {
        // Pass error to global error handler middleware
        next(err);
    }
};

// ============================================================================
// LOGIN CONTROLLER
// ============================================================================

/**
 * Login User
 * POST /api/v1/auth/login
 * 
 * Flow:
 * 1. Validate request body (email, password)
 * 2. Find user by email in database
 * 3. Compare provided password with stored hash
 * 4. Generate JWT token on success
 * 5. Return user data + token
 * 
 * Security Note:
 * - Returns same error for wrong email AND wrong password
 * - This prevents "user enumeration" attacks where attackers
 *   could discover which emails are registered
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - { email, password }
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware (error handler)
 */
exports.login = async (req, res, next) => {
    try {
        // Step 1: Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Step 2: Find user by email
        // Returns null if no user found with this email
        const user = await User.findOne({ email });
        if (!user) {
            // 401 Unauthorized: Generic message to prevent user enumeration
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Step 3: Compare provided password with stored hash
        // bcrypt.compare() hashes the provided password and compares with stored hash
        // Returns true if they match, false otherwise
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            // Same error message as "user not found" for security
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Step 4: Generate JWT token
        // Token contains userId, email, and role for authorization checks
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Step 5: Return success response
        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });
    } catch (err) {
        next(err);
    }
};

// ============================================================================
// GET PROFILE CONTROLLER
// ============================================================================

/**
 * Get Current User Profile
 * GET /api/v1/auth/profile
 * 
 * Protected route - requires valid JWT token
 * req.user is populated by authenticateToken middleware
 * 
 * Flow:
 * 1. Extract userId from req.user (set by auth middleware)
 * 2. Fetch user from database excluding password
 * 3. Return user data
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - Decoded JWT payload { userId, email, role }
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware (error handler)
 */
exports.getProfile = async (req, res, next) => {
    try {
        // Find user by ID from JWT payload
        // .select('-password') excludes the password field from the result
        // The '-' prefix means "exclude this field"
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (err) {
        next(err);
    }
};