/**
 * User Model
 * Mongoose schema for users collection
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters']
    },
    role: {
        type: String,
        enum: ['user', 'manager', 'admin'],
        default: 'user'
    },
    teamMembers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('User', userSchema);
