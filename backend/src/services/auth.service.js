const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOTPEmail } = require('./email.service');

const registerUser = async ({ name, email, password }) => { // creates unverified user and sends OTP email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new Error('User already exists');
        error.statusCode = 409;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
        email,
        password: hashedPassword,
        name,
        role: 'user',
        isVerified: false,
        otp,
        otpExpiry
    });

    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
        await User.findByIdAndDelete(user._id);
        const error = new Error('Failed to send verification email. Please check your email configuration.');
        error.statusCode = 500;
        throw error;
    }

    return { email: user.email, requiresVerification: true };
};

const verifyUserOTP = async ({ email, otp }) => { // verifies OTP, activates account, returns JWT
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    if (user.isVerified) {
        const error = new Error('Email already verified');
        error.statusCode = 400;
        throw error;
    }

    if (user.otp !== otp) {
        const error = new Error('Invalid OTP');
        error.statusCode = 400;
        throw error;
    }

    if (new Date() > user.otpExpiry) {
        const error = new Error('OTP has expired. Please request a new one.');
        error.statusCode = 400;
        throw error;
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign(
        { userId: user._id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
        user: { id: user._id, email: user.email, name: user.name, role: user.role },
        token
    };
};

const resendUserOTP = async ({ email }) => { // generates new OTP and resends verification email
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    if (user.isVerified) {
        const error = new Error('Email already verified');
        error.statusCode = 400;
        throw error;
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
        const error = new Error('Failed to send verification email');
        error.statusCode = 500;
        throw error;
    }

    return { message: 'OTP sent successfully. Please check your email.' };
};

const loginUser = async ({ email, password }) => { // validates credentials, checks verification, returns JWT
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    if (!user.isVerified) {
        const error = new Error('Email not verified. Please verify your email first.');
        error.statusCode = 403;
        error.requiresVerification = true;
        error.email = user.email;
        throw error;
    }

    const token = jwt.sign(
        { userId: user._id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
        user: { id: user._id, email: user.email, name: user.name, role: user.role },
        token
    };
};

const getUserProfile = async (userId) => { // fetches user by ID excluding password
    const user = await User.findById(userId).select('-password');
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return { user };
};

module.exports = {
    registerUser,
    verifyUserOTP,
    resendUserOTP,
    loginUser,
    getUserProfile
};