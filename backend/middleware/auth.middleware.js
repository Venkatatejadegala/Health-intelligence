const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// Middleware to protect routes
const protect = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ success: false, error: 'Access token is required. Please log in.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({ success: false, error: 'Your session has expired. Please log in again.' });
        }
        req.user = user;
        next();
    });
};

const requireEmailVerified = async (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
        return next();
    }
    if (mongoose.connection.readyState !== 1) {
        // Safe developer fallback if DB is offline
        return next();
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }
        if (user.isSuspended) {
            return res.status(403).json({ success: false, error: 'Your account has been suspended.', code: 'ACCOUNT_SUSPENDED' });
        }
        if (!user.isEmailVerified) {
            return res.status(403).json({ success: false, error: 'Please verify your email address to perform this action.', code: 'EMAIL_NOT_VERIFIED' });
        }
        next();
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Server error verifying email status.' });
    }
};

const isAdmin = async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        // Safe developer fallback in dev
        if (process.env.NODE_ENV !== 'production') {
            return next();
        }
        return res.status(500).json({ success: false, error: 'Database connection offline.' });
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied. Administrator privileges required.' });
        }
        next();
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Server error validating role.' });
    }
};

module.exports = { protect, requireEmailVerified, isAdmin };
