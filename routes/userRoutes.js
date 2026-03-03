const express = require('express');
const { getAllUsers, getUserById, updateProfile } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Admin only routes
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/user/:id', protect, adminOnly, getUserById);

// User routes
router.put('/user/profile', protect, updateProfile);

module.exports = router;
