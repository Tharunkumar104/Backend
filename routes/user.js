const express = require('express');
const userRoute = express.Router();
const User = require('../models/user');

// ✅ Place this first to avoid conflict with /:id route
userRoute.get('/test', (req, res) => {
    res.json({ message: 'API working: Hello from backend' });
});

userRoute.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

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

userRoute.post('/', async (req, res) => {
    const { name, email, password } = req.body;
    const userData = new User({ name, email, password });

    try {
        await userData.save();
        res.status(201).json(userData);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Unable to insert user" });
    }
});

userRoute.put('/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Update failed" });
    }
});

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
// ✅ Login Route
userRoute.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.password !== password) return res.status(401).json({ error: 'Incorrect password' });

        res.status(200).json({ message: 'Login successful', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = userRoute;
