const express = require('express');
const { checkWebsite, getUserReports, getAllReports } = require('../controllers/reportController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes with optional authentication
router.post('/check-website', optionalAuth, checkWebsite);

// Protected routes
router.get('/reports/:userId', protect, getUserReports);

// Admin only routes
router.get('/reports', protect, adminOnly, getAllReports);

module.exports = router;
