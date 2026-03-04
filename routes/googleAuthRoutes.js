const express = require('express');
const router = express.Router();
const { googleAuth } = require('../controllers/authController');

// New endpoint for Native Google Sign-In Verification
router.post('/google/verify', googleAuth);

module.exports = router;
