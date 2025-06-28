require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoute = require('./routes/user');

const app = express();

// ✅ Smart CORS setup: Allow localhost + Vercel frontend after deployment
const allowedOrigins = [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // If you ever use CRA or testing
    'https://your-frontend.vercel.app' // <-- Replace with actual Vercel frontend URL after deployment
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like Postman) or from allowedOrigins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('❌ CORS policy: Not allowed by server'));
        }
    },
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

// ✅ Root Test Route
app.get('/', (req, res) => {
    res.send('API working: Hello from backend');
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
