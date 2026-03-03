const express = require('express');
const passport = require('../config/googleStrategy');
const router = express.Router();

// Google OAuth login route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly'] }));

// Google OAuth callback route
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' }),
  (req, res) => {
    // Successful authentication
    const userData = {
      googleId: req.user.googleId,
      email: req.user.email,
      name: req.user.name,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      profilePicture: req.user.profilePicture,
      accessToken: req.user.accessToken
    };

    // Redirect to frontend with user data
    res.redirect(`http://localhost:3000/auth/success?data=${encodeURIComponent(JSON.stringify(userData))}`);
  }
);

// Success endpoint (receives the data from callback)
router.post('/google/success', async (req, res) => {
  try {
    const { token, profile } = req.body;
    
    // Forward to the existing googleAuth controller
    const { googleAuth } = require('../controllers/authController');
    await googleAuth(req, res);
  } catch (error) {
    console.error('Google success error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
      error: error.message
    });
  }
});

module.exports = router;
