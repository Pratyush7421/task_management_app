const mongoose = require('mongoose');

// EmailLog model to track all email attempts for audit and debugging
const emailLogSchema = new mongoose.Schema({
    recipientEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    recipientName: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    templateName: {
        type: String,
        required: true,
        enum: ['taskNotification', 'otpVerification', 'taskCompleted', 'taskUpdated', 'welcomeEmail'],
        default: 'taskNotification'
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        required: true
    },
    errorMessage: {
        type: String,
        default: null
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // adds createdAt and updatedAt automatically
});

// Index for querying logs by recipient and status
emailLogSchema.index({ recipientEmail: 1, status: 1 });
emailLogSchema.index({ taskId: 1 });
emailLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);