require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const userRoute = require('./routes/user');
const notesRoute = require('./routes/notes'); // Add this line

const app = express();

// ✅ CORS setup: Allow localhost (dev) and your deployed Vercel frontend
const allowedOrigins = [
    'http://localhost:5173', // Vite dev server
    'https://frontend-gray-delta-23.vercel.app', // Your actual Vercel domain
    'https://frontend-8n8m.vercel.app' // Previous domain (if still using)
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
app.use(express.static('uploads')); // Serve uploaded files

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ✅ Routes
app.use('/api/users', userRoute);
app.use('/api/notes', notesRoute); // Add this line

// ✅ Root Test Route
app.get('/', (req, res) => {
    res.send('API working: Hello from backend');
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
