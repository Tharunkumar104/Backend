const express = require('express');
const userRoute = express.Router();
const User = require('../models/user');

// Get all users
userRoute.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Get user by ID
userRoute.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send("User not found");
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Create new user
userRoute.post('/', async (req, res) => {
    const userData = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });
    try {
        await userData.save();
        res.json(userData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Unable to insert user");
    }
});

// Update user
userRoute.put('/:id', async (req, res) => {
    try {
        const userData = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(userData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Update failed");
    }
});

// Delete user
userRoute.delete('/:id', async (req, res) => {
    try {
        const userData = await User.findByIdAndDelete(req.params.id);
        if (!userData) return res.status(404).send("User not found");
        res.json({ message: "User deleted", user: userData });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Delete failed");
    }
});

module.exports = userRoute;
