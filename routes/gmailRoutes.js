const express = require('express');
const { connectGmail, getEmails } = require('../controllers/gmailController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Connect Gmail - the client sends an access token obtained from Google Sign-In
router.post('/gmail/connect', protect, connectGmail);

// Fetch analyzed emails
router.get('/gmail/emails/:userId', protect, getEmails);

module.exports = router;
