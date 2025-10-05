require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const userRoute = require('./routes/user');
const notesRoute = require('./routes/notes');

const app = express();

// ✅ CORS setup: Allow localhost (dev) and your deployed Vercel frontend
const allowedOrigins = [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // React dev server (fallback)
    'https://frontend-gray-delta-23.vercel.app', // Your actual Vercel domain
    'https://frontend-8n8m.vercel.app' // Previous domain (if still using)
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like Postman/mobile apps) or from allowedOrigins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('❌ CORS policy: Not allowed by server'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Request logging middleware (for debugging)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.method === 'POST' && req.path.includes('/upload')) {
        console.log('Upload request body keys:', Object.keys(req.body));
        console.log('Upload request file:', req.file ? 'Present' : 'Missing');
    }
    next();
});

// ✅ MongoDB Connection with better error handling
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        console.log('Database name:', mongoose.connection.db.databaseName);
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// ✅ Routes
app.use('/api/users', userRoute);
app.use('/api/notes', notesRoute);

// ✅ Root Test Route
app.get('/', (req, res) => {
    res.json({
        message: 'API working: Skill Tracker Backend Server',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// ✅ Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// ✅ Global error handling middleware
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        msg: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

// ✅ Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({
        msg: 'Route not found',
        requestedPath: req.originalUrl
    });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// ✅ Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});