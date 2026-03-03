const express = require('express');
const router = express.Router();

const {
  analyzePhoneNumber,
  getUserCallHistory,
  reportFakeCall,
  getScamStatistics
} = require('../controllers/fakeCallController');

const { protect } = require('../middleware/auth');

// @route   POST /api/calls/analyze
// @desc    Analyze phone number for scam patterns
// @access  Private
router.post('/analyze', protect, analyzePhoneNumber);

// @route   GET /api/calls/user/:userId
// @desc    Get user's call history
// @access  Private
router.get('/user/:userId', protect, getUserCallHistory);

// @route   POST /api/calls/report
// @desc    Report a fake call
// @access  Private
router.post('/report', protect, reportFakeCall);

// @route   GET /api/calls/statistics
// @desc    Get scam statistics
// @access  Private
router.get('/statistics', protect, getScamStatistics);

module.exports = router;
