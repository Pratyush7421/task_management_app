const nodemailer = require('nodemailer');
const { generateTaskNotificationEmail } = require('../emailTemplates');

const buildTaskNotificationEmailData = ({ recipientUser, task, assignedByUser = null, dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173/dashboard' }) => {
    const isSelfCreated = !assignedByUser || assignedByUser._id?.toString() === recipientUser._id?.toString();

    return {
        recipientEmail: recipientUser.email,
        recipientName: recipientUser.name,
        taskTitle: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        assignedBy: isSelfCreated ? recipientUser.name : assignedByUser.name,
        assignmentTime: task.createdAt,
        taskType: isSelfCreated ? 'self-created' : 'assigned',
        dashboardUrl
    };
};

// Create transporter with Gmail SMTP settings
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter verification failed:', error);
    } else {
        console.log('Email transporter is ready to send messages');
    }
});

const generateOTP = () => { // generates 6-digit random OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp) => { // sends OTP verification email to user
    const mailOptions = {
        from: `"TaskMaster" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'TaskMaster - Email Verification OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">TaskMaster Email Verification</h2>
                <p>Hello,</p>
                <p>Your OTP for email verification is:</p>
                <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                    ${otp}
                </div>
                <p>This OTP will expire in <strong>10 minutes</strong>.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 12px;">TaskMaster Team</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email send failed:', error.message);
        console.error('Error details:', error);
        return false;
    }
};

/**
 * Sends task notification email to user
 * @param {Object} emailData - Email data object
 * @param {string} emailData.recipientEmail - User's email address
 * @param {string} emailData.recipientName - User's name
 * @param {string} emailData.taskTitle - Task title
 * @param {string} emailData.description - Task description
 * @param {string} emailData.priority - Task priority (high/medium/low)
 * @param {string} emailData.status - Task status
 * @param {Date} emailData.dueDate - Task due date
 * @param {string} emailData.assignedBy - Name of person who assigned the task
 * @param {Date} emailData.assignmentTime - When task was assigned
 * @param {string} emailData.taskType - 'assigned' or 'self-created'
 * @param {string} emailData.dashboardUrl - URL to view task
 * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string }
 */
const sendTaskNotificationEmail = async (emailData) => {
    const {
        recipientEmail,
        taskTitle
    } = emailData;

    console.log('Preparing notification email...');

    try {
        // Generate HTML email content from template
        const htmlContent = generateTaskNotificationEmail(emailData);

        const mailOptions = {
            from: `"TaskMaster Pro" <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `New Task Notification - ${taskTitle}`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Notification email sent successfully:', info.messageId);
        
        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error('Email sending failed.');
        console.error('Reason:', error.message);
        
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendTaskNotificationEmail,
    buildTaskNotificationEmailData
};
