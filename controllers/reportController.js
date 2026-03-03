// Import shared user storage from authController
const { users } = require('./authController');

// Simple in-memory report storage
let reports = [];

// Helper function to create report
const createReport = (reportData) => {
  const newReport = {
    _id: 'report_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...reportData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  reports.push(newReport);
  return newReport;
};

// @desc    Check website for phishing patterns
// @route   POST /api/check-website
// @access  Private
const checkWebsite = async (req, res) => {
  try {
    const { url } = req.body;
    const userId = req.user?.id || null; // Make userId optional

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // Basic phishing pattern detection (simplified)
    const phishingPatterns = [
      // Common phishing domains
      /bit\.ly/i,
      /tinyurl\.com/i,
      /goo\.gl/i,
      /t\.co/i,
      /short\.link/i,
      /is\.gd/i,
      /v\.gd/i,
      /ow\.ly/i,
      /buff\.ly/i,
      /rebrand\.ly/i,
      
      // Suspicious patterns
      /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
      /[a-z0-9-]+\.tk/i, // .tk domains
      /[a-z0-9-]+\.ml/i, // .ml domains
      /[a-z0-9-]+\.ga/i, // .ga domains
      /[a-z0-9-]+\.cf/i, // .cf domains,
      
      // Typosquatting patterns
      /goggle/i,
      /gooogle/i,
      /facebok/i,
      /faceboook/i,
      /twiter/i,
      /twittter/i,
      /amazom/i,
      /amazoon/i,
      /microsft/i,
      /microsooft/i,
      
      // Suspicious subdomains
      /secure-/i,
      /login-/i,
      /account-/i,
      /verify-/i,
      /update-/i,
      /confirm-/i
    ];

    let isFake = false;
    let details = '';

    // Check for suspicious patterns
    for (const pattern of phishingPatterns) {
      if (pattern.test(url)) {
        isFake = true;
        details = 'Suspicious URL pattern detected';
        break;
      }
    }

    // Additional checks
    if (!isFake) {
      // Check for HTTPS
      if (!url.startsWith('https://')) {
        isFake = true;
        details = 'Non-HTTPS connection detected';
      }
      
      // Check for very long URLs (potential obfuscation)
      if (url.length > 200) {
        isFake = true;
        details = 'Suspiciously long URL detected';
      }
      
      // Check for excessive special characters
      const specialCharCount = (url.match(/[^a-zA-Z0-9.-]/g) || []).length;
      if (specialCharCount > 20) {
        isFake = true;
        details = 'Excessive special characters detected';
      }
    }

    // Create report only if userId exists
    let reportId = null;
    if (userId) {
      const report = createReport({
        userId,
        type: 'Website',
        status: isFake ? 'Fake' : 'Safe',
        data: url,
        details: isFake ? details : 'Website appears to be safe'
      });
      reportId = report._id;
    }

    res.status(200).json({
      success: true,
      data: {
        url,
        status: isFake ? 'Fake' : 'Safe',
        details: isFake ? details : 'Website appears to be safe',
        reportId: reportId
      }
    });
  } catch (error) {
    console.error('Check website error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking website',
      error: error.message
    });
  }
};

// @desc    Get user's reports
// @route   GET /api/reports/:userId
// @access  Private
const getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    console.log('getUserReports - Requested userId:', userId);
    console.log('getUserReports - Current user ID:', currentUserId);
    console.log('getUserReports - Total reports in storage:', reports.length);

    // Check if user is requesting their own reports or is admin
    if (userId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own reports.'
      });
    }

    const userReports = reports.filter(report => report.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 100); // Limit to last 100 reports

    console.log('getUserReports - Filtered reports for user:', userReports.length);

    // Get statistics
    const statistics = {
      total: userReports.length,
      fake: userReports.filter(r => r.status === 'Fake').length,
      safe: userReports.filter(r => r.status === 'Safe').length
    };

    console.log('getUserReports - Statistics:', statistics);

    res.status(200).json({
      success: true,
      data: {
        reports: userReports,
        statistics
      }
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports',
      error: error.message
    });
  }
};

// @desc    Get all reports (Admin only)
// @route   GET /api/reports
// @access  Private/Admin
const getAllReports = async (req, res) => {
  try {
    const allReports = reports
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 500); // Limit to last 500 reports

    res.status(200).json({
      success: true,
      count: allReports.length,
      data: allReports
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports',
      error: error.message
    });
  }
};

module.exports = {
  checkWebsite,
  getUserReports,
  getAllReports
};
