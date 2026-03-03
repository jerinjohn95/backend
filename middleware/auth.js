const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import shared user storage from authController
const { users } = require('../controllers/authController');

// Helper function to find user by ID
const findUserById = (id) => {
  console.log('findUserById - Looking for ID:', id);
  console.log('findUserById - Available users:', users.map(u => ({ id: u._id, email: u.email })));
  const user = users.find(user => user._id === id);
  console.log('findUserById - Found user:', user ? user.email : 'Not found');
  return user;
};

// @desc    Verify JWT token and protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', decoded);
      
      // Get user from in-memory storage
      const user = findUserById(decoded.id);
      console.log('Found user:', user ? user.email : 'Not found');
      
      if (user) {
        req.user = {
          id: user._id,
          role: user.role,
          email: user.email
        };
        console.log('User set in req.user:', req.user);
      } else {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid. User not found.'
        });
      }

      next();
    } catch (error) {
      console.log('JWT verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// @desc    Check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// @desc    Optional authentication - doesn't require token but sets user if present
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from in-memory storage
        const user = findUserById(decoded.id);
        if (user) {
          req.user = {
            id: user._id,
            role: user.role,
            email: user.email
          };
        }
      } catch (error) {
        // Token is invalid but we continue without user
        console.log('Invalid token provided, continuing without authentication');
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without authentication on error
  }
};

module.exports = {
  protect,
  adminOnly,
  optionalAuth
};
