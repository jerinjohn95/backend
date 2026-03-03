// Import shared user storage from authController
const { users } = require('./authController');

// Simple in-memory call storage
let fakeCalls = [];

// Helper function to create fake call record
const createFakeCall = (callData) => {
  const newCall = {
    _id: 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...callData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  fakeCalls.push(newCall);
  return newCall;
};

// @desc    Analyze phone number for scam patterns
// @route   POST /api/calls/analyze
// @access  Private
const analyzePhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Perform analysis
    const analysis = analyzePhonePatterns(phoneNumber);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Phone analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get user's call history
// @route   GET /api/calls/user/:userId
// @access  Private
const getUserCallHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user's calls
    const userCalls = fakeCalls.filter(call => call.userId === userId);
    
    // Sort by timestamp (newest first)
    userCalls.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: userCalls,
      count: userCalls.length
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Report a fake call
// @route   POST /api/calls/report
// @access  Private
const reportFakeCall = async (req, res) => {
  try {
    const {
      callId,
      phoneNumber,
      callerName,
      riskLevel,
      suspiciousPatterns,
      userId,
      notes
    } = req.body;

    if (!phoneNumber || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and user ID are required'
      });
    }

    // Create report
    const reportData = {
      callId: callId || null,
      phoneNumber,
      callerName: callerName || 'Unknown',
      riskLevel: riskLevel || 'Medium',
      suspiciousPatterns: suspiciousPatterns || [],
      userId,
      notes: notes || '',
      isReported: true,
      timestamp: new Date().toISOString()
    };

    const report = createFakeCall(reportData);

    res.status(200).json({
      success: true,
      message: 'Fake call reported successfully',
      data: {
        reportId: report._id,
        phoneNumber: report.phoneNumber,
        riskLevel: report.riskLevel
      }
    });
  } catch (error) {
    console.error('Report fake call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get scam statistics
// @route   GET /api/calls/statistics
// @access  Private
const getScamStatistics = async (req, res) => {
  try {
    // Calculate statistics from in-memory data
    const totalCalls = fakeCalls.length;
    const scamCalls = fakeCalls.filter(call => 
      call.riskLevel === 'High' || call.riskLevel === 'Critical'
    ).length;
    const blockedCalls = fakeCalls.filter(call => call.isBlocked).length;
    const reportedCalls = fakeCalls.filter(call => call.isReported).length;

    // Risk distribution
    const riskDistribution = {
      low: fakeCalls.filter(call => call.riskLevel === 'Low').length,
      medium: fakeCalls.filter(call => call.riskLevel === 'Medium').length,
      high: fakeCalls.filter(call => call.riskLevel === 'High').length,
      critical: fakeCalls.filter(call => call.riskLevel === 'Critical').length,
    };

    // Common scam types (based on patterns)
    const scamTypes = {};
    fakeCalls.forEach(call => {
      if (call.suspiciousPatterns && call.suspiciousPatterns.length > 0) {
        call.suspiciousPatterns.forEach(pattern => {
          scamTypes[pattern] = (scamTypes[pattern] || 0) + 1;
        });
      }
    });

    const commonScamTypes = Object.entries(scamTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Monthly trend (mock data for demo)
    const monthlyTrend = [
      { month: 'Jan', scams: 15 },
      { month: 'Feb', scams: 23 },
      { month: 'Mar', scams: 18 },
    ];

    res.status(200).json({
      success: true,
      data: {
        totalCalls,
        scamCalls,
        blockedCalls,
        reportedCalls,
        riskDistribution,
        commonScamTypes,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to analyze phone number patterns
const analyzePhonePatterns = (phoneNumber) => {
  const patterns = [];
  let riskScore = 0;
  let riskLevel = 'Low';

  // Clean phone number
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');

  // Check for suspicious patterns
  if (cleanNumber.startsWith('+1')) {
    patterns.push('International number');
    riskScore += 2;
  }

  if (cleanNumber.includes('000') || cleanNumber.includes('999')) {
    patterns.push('Fake number pattern');
    riskScore += 5;
  }

  if (cleanNumber.length < 10) {
    patterns.push('Unusually short number');
    riskScore += 3;
  }

  // Check for known scam prefixes
  const scamPrefixes = ['190', '197', '900', '866', '877', '888'];
  for (const prefix of scamPrefixes) {
    if (cleanNumber.includes(prefix)) {
      patterns.push('Premium rate number');
      riskScore += 4;
      break;
    }
  }

  // Check for repeated digits
  if (/(.)\1{3,}/.test(cleanNumber)) {
    patterns.push('Repeated digit pattern');
    riskScore += 3;
  }

  // Check for sequential numbers
  if (/123456|234567|345678/.test(cleanNumber)) {
    patterns.push('Sequential number pattern');
    riskScore += 2;
  }

  // Determine risk level
  if (riskScore >= 7) {
    riskLevel = 'High';
  } else if (riskScore >= 4) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  const isKnownScam = riskScore >= 5;
  const recommendation = riskScore >= 4 
    ? 'Be cautious with this number. Consider blocking.'
    : 'Number appears to be legitimate.';

  return {
    phoneNumber,
    riskScore,
    riskLevel,
    suspiciousPatterns: patterns,
    isKnownScam,
    recommendation
  };
};

module.exports = {
  analyzePhoneNumber,
  getUserCallHistory,
  reportFakeCall,
  getScamStatistics,
  fakeCalls // Export for testing
};
