const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/database');
const authRoutes = require('./src/routes/auth.routes');
const taskRoutes = require('./src/routes/task.routes');
const adminRoutes = require('./src/routes/admin.routes');
const errorHandler = require('./src/middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Database Connection ──────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// ─── Routes ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'TaskMaster Pro API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/admin', adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;