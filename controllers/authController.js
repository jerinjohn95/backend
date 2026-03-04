const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Shared user storage (exported to be used by other controllers)
let users = [
  {
    _id: 'admin-temp',
    fullName: 'Admin User',
    email: 'admin001@decepticall.com',
    phone: '+1234567890',
    password: '$2a$10$scqa3.zaVJlvxx5IPpioKOGPPtp3F7zRgY/xdqJhvWFygc58FuaZa', // '123456' hashed
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper function to find user by email
const findUserByEmail = (email) => {
  return users.find(user => user.email === email);
};

// Helper function to create new user
const createUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser = {
    _id: 'user_' + Date.now(),
    ...userData,
    password: hashedPassword,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  users.push(newUser);
  console.log('User created. Total users:', users.length);
  return newUser;
};

// Export users and helper functions for other controllers
module.exports.users = users;
module.exports.findUserByEmail = findUserByEmail;
module.exports.createUser = createUser;

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = await createUser({
      fullName,
      email,
      phone,
      password
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = users.find(u => u._id === req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

// @desc    Google OAuth login native
// @route   POST /api/google/verify
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google idToken is required'
      });
    }

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    // Check if user already exists
    let existingUser = users.find(u => u.email === payload.email);

    if (existingUser) {
      // User exists, update their Google info and login
      existingUser.googleId = payload.sub;
      existingUser.profilePicture = payload.picture || existingUser.profilePicture;
      existingUser.lastLogin = new Date();

      const jwtToken = jwt.sign(
        { id: existingUser._id, role: existingUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: existingUser._id,
            fullName: existingUser.fullName,
            email: existingUser.email,
            phone: existingUser.phone,
            role: existingUser.role,
            profilePicture: existingUser.profilePicture
          },
          token: jwtToken
        }
      });
    } else {
      // Create new user from Google profile
      const newUser = {
        _id: 'google_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        fullName: payload.name || 'Google User',
        email: payload.email,
        phone: '+0000000000', // Default phone for Google users
        role: 'user',
        googleId: payload.sub,
        profilePicture: payload.picture,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };

      users.push(newUser);

      const jwtToken = jwt.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            profilePicture: newUser.profilePicture
          },
          token: jwtToken
        }
      });
    }
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication',
      error: error.message
    });
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  googleAuth,
  users,
  findUserByEmail,
  createUser
};
