require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoute = require('./routes/user');

const app = express();

// ✅ CORS setup: Allow frontend from both localhost and production
const allowedOrigins = [
    'http://localhost:3000',
    // 'https://your-frontend-domain.onrender.com' // <-- replace with your deployed frontend URL
];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// ✅ Middleware
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URL)

    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ✅ Routes
app.use('/api/users', userRoute);

// ✅ Optional root route
app.get('/', (req, res) => {
    res.send('API working: Hello from backend');
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
