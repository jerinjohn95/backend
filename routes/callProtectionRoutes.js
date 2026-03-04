const express = require('express');
const router = express.Router();

const {
  syncCallLogs,
  getCallHistory,
  blockPhoneNumber,
  unblockPhoneNumber,
  getBlockedNumbers,
  reportSpamCall,
  getCallProtectionStatistics,
  analyzePhoneNumber
} = require('../controllers/callProtectionController');

const { protect } = require('../middleware/auth');

// @route   POST /api/call-protection/sync
// @desc    Sync call logs from device
// @access  Private
router.post('/sync', protect, syncCallLogs);

// @route   GET /api/call-protection/call-history
// @desc    Get user's call history with filters
// @access  Private
router.get('/call-history', protect, getCallHistory);

// @route   POST /api/call-protection/block
// @desc    Block a phone number
// @access  Private
router.post('/block', protect, blockPhoneNumber);

// @route   POST /api/call-protection/unblock
// @desc    Unblock a phone number
// @access  Private
router.post('/unblock', protect, unblockPhoneNumber);

// @route   GET /api/call-protection/blocked-numbers
// @desc    Get blocked numbers
// @access  Private
router.get('/blocked-numbers', protect, getBlockedNumbers);

// @route   POST /api/call-protection/report-spam
// @desc    Report a spam call
// @access  Private
router.post('/report-spam', protect, reportSpamCall);

// @route   GET /api/call-protection/statistics
// @desc    Get call protection statistics
// @access  Private
router.get('/statistics', protect, getCallProtectionStatistics);

// @route   POST /api/call-protection/analyze
// @desc    Analyze phone number for spam detection
// @access  Private
router.post('/analyze', protect, analyzePhoneNumber);

module.exports = router;
