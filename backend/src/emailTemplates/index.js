/**
 * Email Templates Index
 * Central export for all email templates
 * 
 * To add a new template:
 * 1. Create template file: emailTemplates/{templateName}.template.js
 * 2. Export it here
 */

const { generateTaskNotificationEmail } = require('./taskNotification.template');

module.exports = {
    generateTaskNotificationEmail
};