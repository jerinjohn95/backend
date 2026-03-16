// Import shared user storage from authController
const { users } = require('./authController');
const AdvancedWebsiteChecker = require('../services/advancedWebsiteChecker');

// Simple in-memory report storage
let reports = [];

// Initialize advanced website checker
const websiteChecker = new AdvancedWebsiteChecker();

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

// @desc    Check website for phishing patterns (Advanced)
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

    // Use advanced website checker
    const analysis = await websiteChecker.analyzeWebsite(url);

    if (!analysis.success) {
      return res.status(500).json({
        success: false,
        message: 'Website analysis failed',
        error: analysis.error
      });
    }

    // Create report only if userId exists
    let reportId = null;
    if (userId) {
      const report = createReport({
        userId,
        type: 'Website',
        status: analysis.isSuspicious ? 'Fake' : 'Safe',
        data: analysis.normalizedUrl,
        details: {
          riskLevel: analysis.riskLevel,
          riskScore: analysis.riskScore,
          riskFactors: analysis.riskFactors,
          domain: analysis.domain,
          isHttps: analysis.analysis.isHttps,
          analysis: analysis.analysis
        }
      });
      reportId = report._id;
    }

    res.status(200).json({
      success: true,
      data: {
        url: analysis.normalizedUrl,
        domain: analysis.domain,
        status: analysis.isSuspicious ? 'Fake' : 'Safe',
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        details: analysis.riskFactors.length > 0 
          ? analysis.riskFactors.join(', ') 
          : 'Website appears to be safe',
        riskFactors: analysis.riskFactors,
        analysis: analysis.analysis,
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
