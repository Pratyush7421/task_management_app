const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/database');
const authRoutes = require('./src/routes/auth.routes');
const taskRoutes = require('./src/routes/task.routes');
const adminRoutes = require('./src/routes/admin.routes');
const errorHandler = require('./src/middleware/error.middleware');

const app = express(); // creates Express app, configures middleware and routes
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());//communicate with the frontend 
app.use(express.json());//middleware to parse incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); //middleware to parse incoming requests with JSON payloads and URL-encoded data

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/admin', adminRoutes);

//checks the server is running or not
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

//error handler
app.use(errorHandler);

//server starts
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});