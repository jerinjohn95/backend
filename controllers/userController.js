// Import shared user storage from authController
const { users } = require('./authController');

// Simple in-memory report storage
let reports = [];

// Helper function to find user by ID
const findUserById = (id) => {
  return users.find(user => user._id === id);
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    console.log('Fetching users from in-memory storage:', users.length, 'total users');
    
    // Get all users except admin, remove password field
    const userList = users
      .filter(user => user.role === 'user')
      .map(({ password, ...user }) => user);

    console.log('Filtered users (role=user):', userList.length);

    res.status(200).json({
      success: true,
      count: userList.length,
      data: userList
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message
    });
  }
};

// @desc    Get single user with their reports (Admin only)
// @route   GET /api/user/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user details
    const user = findUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's reports
    const userReports = reports.filter(report => report.userId === id);

    // Get report statistics
    const stats = {
      total: userReports.length,
      fake: userReports.filter(r => r.status === 'Fake').length,
      safe: userReports.filter(r => r.status === 'Safe').length
    };

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        reports: userReports,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const userId = req.user.id;

    // Find user index
    const userIndex = users.findIndex(user => user._id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    users[userIndex] = {
      ...users[userIndex],
      fullName: fullName || users[userIndex].fullName,
      phone: phone || users[userIndex].phone,
      updatedAt: new Date()
    };

    const { password, ...userWithoutPassword } = users[userIndex];

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile
};
