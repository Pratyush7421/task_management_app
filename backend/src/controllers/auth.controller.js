//Here controller acts as a bridge between routes and services. It handles incoming requests, calls the appropriate service methods, and sends responses back to the client. It also manages error handling by passing errors to the next middleware.
const AuthService = require('../services/auth.service');

exports.register = async (req, res, next) => { // registers new user, sends OTP email for verification
    try {
        const result = await AuthService.registerUser(req.body);
        res.status(201).json({
            message: 'Registration successful. Please check your email for OTP.',
            ...result
        });
    } catch (err) {
        next(err);
    }
};

exports.verifyOTP = async (req, res, next) => { // verifies OTP and activates user account
    try {
        const result = await AuthService.verifyUserOTP(req.body);
        res.json({
            message: 'Email verified successfully',
            ...result
        });
    } catch (err) {
        next(err);
    }
};

exports.resendOTP = async (req, res, next) => { // generates new OTP and resends verification email
    try {
        const result = await AuthService.resendUserOTP(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => { // validates credentials, blocks unverified users, returns JWT
    try {
        const result = await AuthService.loginUser(req.body);
        res.json({
            message: 'Login successful',
            ...result
        });
    } catch (err) {
        next(err);
    }
};

exports.getProfile = async (req, res, next) => { // returns current user profile (excludes password)
    try {
        const result = await AuthService.getUserProfile(req.user.userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};