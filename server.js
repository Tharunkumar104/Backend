require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoute = require('./routes/user');

const app = express();

// ✅ CORS setup: Allow localhost (dev) and your deployed Vercel frontend
const allowedOrigins = [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // (optional) CRA/dev
    'https://frontend-8n8m.vercel.app' // <-- Replace with your actual Vercel domain!
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
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
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
