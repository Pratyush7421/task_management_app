/**
 * Task Notification Email Template
 * Generates professional HTML email for task assignments
 */

const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'taskNotification.template.html');
const emailTemplate = fs.readFileSync(templatePath, 'utf8');

const getPriorityColor = (priority) => {
    const colors = {
        high: '#e74c3c',    // Red
        medium: '#f39c12',  // Orange
        low: '#27ae60'      // Green
    };
    return colors[priority] || '#95a5a6';
};

const getPriorityLabel = (priority) => {
    const labels = {
        high: 'High Priority',
        medium: 'Medium Priority',
        low: 'Low Priority'
    };
    return labels[priority] || priority;
};

const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Generates task notification email HTML
 * @param {Object} data - Email data
 * @param {string} data.recipientName - User's name
 * @param {string} data.taskTitle - Task title
 * @param {string} data.description - Task description
 * @param {string} data.priority - Task priority (high/medium/low)
 * @param {string} data.status - Task status
 * @param {Date} data.dueDate - Task due date
 * @param {string} data.assignedBy - Name of person who assigned the task
 * @param {Date} data.assignmentTime - When task was assigned
 * @param {string} data.taskType - 'assigned' or 'self-created'
 * @param {string} data.dashboardUrl - URL to view task
 * @returns {string} HTML email content
 */
const generateTaskNotificationEmail = (data) => {
    const {
        recipientName,
        taskTitle,
        description,
        priority,
        status,
        dueDate,
        assignedBy,
        assignmentTime,
        taskType,
        dashboardUrl = 'http://localhost:5173/dashboard'
    } = data;

    const priorityColor = getPriorityColor(priority);
    const priorityLabel = getPriorityLabel(priority);
    const isSelfCreated = taskType === 'self-created';
    
    const greeting = isSelfCreated 
        ? `Dear ${recipientName},`
        : `Dear ${recipientName},`;
    
    const introText = isSelfCreated
        ? 'You have created a new task for yourself. Here are the details:'
        : `A new task has been created and assigned to you by <strong>${assignedBy}</strong>.`;

    const descriptionBlock = description
        ? `<p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">${description}</p>`
        : '';

    const assignedByRow = !isSelfCreated
        ? `<tr>
            <td style="padding: 8px 0;">
                <span style="color: #7f8c8d; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Assigned By</span>
            </td>
            <td style="padding: 8px 0;">
                <span style="color: #2c3e50; font-size: 14px; font-weight: 500;">${assignedBy}</span>
            </td>
        </tr>`
        : '';

    const assignmentLabel = isSelfCreated ? 'Created At' : 'Assigned At';
    const assignmentValue = formatDateTime(assignmentTime);

    return emailTemplate
        .replace('{{greeting}}', greeting)
        .replace('{{introText}}', introText)
        .replace('{{priorityColor}}', priorityColor)
        .replace('{{priorityLabel}}', priorityLabel)
        .replace('{{taskTitle}}', taskTitle)
        .replace('{{descriptionBlock}}', descriptionBlock)
        .replace('{{status}}', status.replace('_', ' '))
        .replace('{{dueDate}}', formatDate(dueDate))
        .replace('{{assignedByRow}}', assignedByRow)
        .replace('{{assignmentLabel}}', assignmentLabel)
        .replace('{{assignmentValue}}', assignmentValue)
        .replace('{{dashboardUrl}}', dashboardUrl)
        .trim();
};

module.exports = {
    generateTaskNotificationEmail,
    getPriorityColor,
    getPriorityLabel
};