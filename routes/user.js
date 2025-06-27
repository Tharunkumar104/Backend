const express = require('express');
const userRoute = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

// ✅ Test route
userRoute.get('/test', (req, res) => {
    res.json({ message: 'API working: Hello from backend' });
});

// ✅ Get all users
userRoute.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Get user by ID
userRoute.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.status(200).json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Signup route
userRoute.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Signup failed" });
    }
});

// ✅ Login route
userRoute.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Incorrect password" });

        res.status(200).json({ message: "Login successful", user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Login failed" });
    }
});

// ✅ Update user by ID
userRoute.put('/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Update failed" });
    }
});

// ✅ Delete user by ID
userRoute.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: "User not found" });

        res.status(200).json({ message: "User deleted", user: deletedUser });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = userRoute;
