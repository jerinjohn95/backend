const express = require('express');
const { signup, login, getProfile, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);

// Protected routes
router.get('/profile', protect, getProfile);

module.exports = router;
