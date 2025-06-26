require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRoute = require('./routes/user');

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL, {})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error("MongoDB connection error:", err.message));

// API route
app.use('/', userRoute);

// Start server
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
