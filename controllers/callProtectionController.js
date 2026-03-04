const CallLog = require('../models/CallLog');
const BlockedNumber = require('../models/BlockedNumber');
const User = require('../models/User');

// @desc    Sync call logs from device
// @route   POST /api/call-protection/sync
// @access  Private
const syncCallLogs = async (req, res) => {
  try {
    const { userId, callLogs, deviceInfo } = req.body;

    if (!userId || !callLogs || !Array.isArray(callLogs)) {
      return res.status(400).json({
        success: false,
        message: 'User ID and call logs array are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const syncedCalls = [];
    const blockedNumbers = await BlockedNumber.getBlockedNumbers(userId);
    const blockedPhoneNumbers = new Set(blockedNumbers.map(bn => bn.phoneNumber));

    for (const callData of callLogs) {
      // Check if number is blocked
      const isBlocked = blockedPhoneNumbers.has(callData.phoneNumber);
      
      // Create or update call log
      const callLog = await CallLog.findOneAndUpdate(
        { 
          userId, 
          phoneNumber: callData.phoneNumber,
          timestamp: new Date(callData.timestamp)
        },
        {
          userId,
          phoneNumber: callData.phoneNumber,
          callerName: callData.callerName || 'Unknown',
          callType: callData.callType,
          timestamp: new Date(callData.timestamp),
          duration: callData.duration || 0,
          isBlocked,
          riskScore: callData.riskScore || 0,
          riskLevel: callData.riskLevel || 'Low',
          suspiciousPatterns: callData.suspiciousPatterns || [],
          callerInfo: callData.callerInfo || {},
          contactSource: callData.contactSource || 'unknown',
          deviceInfo: deviceInfo || {},
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      syncedCalls.push(callLog);
    }

    res.status(200).json({
      success: true,
      message: 'Call logs synced successfully',
      data: {
        syncedCount: syncedCalls.length,
        blockedCount: blockedPhoneNumbers.size,
        callLogs: syncedCalls
      }
    });
  } catch (error) {
    console.error('Sync call logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get user's call history with filters
// @route   GET /api/call-protection/call-history
// @access  Private
const getCallHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    const { 
      callType, 
      isSpam, 
      isBlocked, 
      startDate, 
      endDate, 
      limit = 50,
      page = 1 
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const options = {
      callType,
      isSpam: isSpam === 'true' ? true : isSpam === 'false' ? false : undefined,
      isBlocked: isBlocked === 'true' ? true : isBlocked === 'false' ? false : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    const callLogs = await CallLog.findByUser(userId, options);
    const total = await CallLog.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        callLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Block a phone number
// @route   POST /api/call-protection/block
// @access  Private
const blockPhoneNumber = async (req, res) => {
  try {
    const { userId, phoneNumber, callerName, blockReason, isTemporary, duration } = req.body;

    if (!userId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'User ID and phone number are required'
      });
    }

    // Check if already blocked
    const existingBlock = await BlockedNumber.isBlocked(phoneNumber, userId);
    if (existingBlock) {
      return res.status(400).json({
        success: false,
        message: 'Number is already blocked'
      });
    }

    // Create blocked number record
    const blockedNumber = new BlockedNumber({
      userId,
      phoneNumber,
      callerName: callerName || 'Unknown',
      blockReason: blockReason || 'user_preference',
      isTemporary: isTemporary || false,
      unblockDate: isTemporary && duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null
    });

    await blockedNumber.save();

    // Update existing call logs
    await CallLog.updateMany(
      { userId, phoneNumber },
      { isBlocked: true, updatedAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'Number blocked successfully',
      data: {
        blockedNumber,
        updatedCallLogs: await CallLog.countDocuments({ userId, phoneNumber })
      }
    });
  } catch (error) {
    console.error('Block phone number error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Unblock a phone number
// @route   POST /api/call-protection/unblock
// @access  Private
const unblockPhoneNumber = async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;

    if (!userId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'User ID and phone number are required'
      });
    }

    // Find and unblock
    const blockedNumber = await BlockedNumber.findOne({
      userId,
      phoneNumber,
      isActive: true
    });

    if (!blockedNumber) {
      return res.status(404).json({
        success: false,
        message: 'Blocked number not found'
      });
    }

    await blockedNumber.unblock();

    // Update existing call logs
    await CallLog.updateMany(
      { userId, phoneNumber },
      { isBlocked: false, updatedAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'Number unblocked successfully',
      data: {
        updatedCallLogs: await CallLog.countDocuments({ userId, phoneNumber })
      }
    });
  } catch (error) {
    console.error('Unblock phone number error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get blocked numbers
// @route   GET /api/call-protection/blocked-numbers
// @access  Private
const getBlockedNumbers = async (req, res) => {
  try {
    const { userId } = req.query;
    const { blockReason, riskLevel, limit = 100 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const options = {
      blockReason,
      riskLevel,
      limit: parseInt(limit)
    };

    const blockedNumbers = await BlockedNumber.findByUser(userId, options);

    res.status(200).json({
      success: true,
      data: {
        blockedNumbers,
        count: blockedNumbers.length
      }
    });
  } catch (error) {
    console.error('Get blocked numbers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Report a spam call
// @route   POST /api/call-protection/report-spam
// @access  Private
const reportSpamCall = async (req, res) => {
  try {
    const { userId, phoneNumber, callerName, reportReason, reportNotes, riskScore, riskLevel } = req.body;

    if (!userId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'User ID and phone number are required'
      });
    }

    // Find or create call log
    const callLog = await CallLog.findOneAndUpdate(
      { userId, phoneNumber },
      {
        userId,
        phoneNumber,
        callerName: callerName || 'Unknown',
        isSpam: true,
        isReported: true,
        reportReason,
        reportNotes,
        riskScore: riskScore || 0.7,
        riskLevel: riskLevel || 'High',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Update blocked number if exists
    const blockedNumber = await BlockedNumber.isBlocked(phoneNumber, userId);
    if (blockedNumber) {
      await blockedNumber.updateReport();
    } else {
      // Auto-block high-risk spam
      if (riskScore >= 0.8) {
        await new BlockedNumber({
          userId,
          phoneNumber,
          callerName: callerName || 'Unknown',
          blockReason: 'spam',
          riskScore: riskScore || 0.8,
          riskLevel: riskLevel || 'Critical'
        }).save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Spam call reported successfully',
      data: {
        callLog,
        autoBlocked: riskScore >= 0.8
      }
    });
  } catch (error) {
    console.error('Report spam call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get call protection statistics
// @route   GET /api/call-protection/statistics
// @access  Private
const getCallProtectionStatistics = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get call statistics
    const callStats = await CallLog.getStatistics(userId);
    
    // Get blocked numbers statistics
    const blockStats = await BlockedNumber.getStatistics(userId);

    // Get recent activity
    const recentCalls = await CallLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('phoneNumber callerName callType timestamp isSpam isBlocked riskScore');

    // Get risk distribution
    const riskDistribution = await CallLog.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
          avgRiskScore: { $avg: '$riskScore' }
        }
      }
    ]);

    // Get call type distribution
    const callTypeDistribution = await CallLog.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$callType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        callStatistics: callStats[0] || {},
        blockStatistics: blockStats[0] || {},
        recentCalls,
        riskDistribution,
        callTypeDistribution
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

// @desc    Analyze phone number for spam detection
// @route   POST /api/call-protection/analyze
// @access  Private
const analyzePhoneNumber = async (req, res) => {
  try {
    const { userId, phoneNumber, includeHistory = true } = req.body;

    if (!userId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'User ID and phone number are required'
      });
    }

    // Check if number is blocked
    const isBlocked = await BlockedNumber.isBlocked(phoneNumber, userId);
    
    // Get call history for this number
    let callHistory = [];
    if (includeHistory) {
      callHistory = await CallLog.find({ userId, phoneNumber })
        .sort({ timestamp: -1 })
        .limit(10);
    }

    // Analyze phone number patterns
    const analysis = analyzePhonePatterns(phoneNumber);

    // Calculate overall risk score
    let riskScore = analysis.riskScore;
    let riskLevel = analysis.riskLevel;

    if (isBlocked) {
      riskScore = Math.max(riskScore, 0.9);
      riskLevel = 'Critical';
    }

    if (callHistory.some(call => call.isSpam)) {
      riskScore = Math.max(riskScore, 0.8);
      riskLevel = 'High';
    }

    res.status(200).json({
      success: true,
      data: {
        phoneNumber,
        isBlocked,
        riskScore,
        riskLevel,
        analysis,
        callHistory: callHistory.slice(0, 5), // Return last 5 calls
        recommendation: getRecommendation(riskScore, isBlocked)
      }
    });
  } catch (error) {
    console.error('Analyze phone number error:', error);
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
  if (cleanNumber.startsWith('+91')) {
    patterns.push('Indian number');
    riskScore += 0.1;
  }

  if (cleanNumber.startsWith('+1')) {
    patterns.push('US number');
    riskScore += 0.1;
  }

  if (cleanNumber.includes('000') || cleanNumber.includes('999')) {
    patterns.push('Fake number pattern');
    riskScore += 0.5;
  }

  if (cleanNumber.length < 10) {
    patterns.push('Unusually short number');
    riskScore += 0.3;
  }

  if (cleanNumber.length > 15) {
    patterns.push('Unusually long number');
    riskScore += 0.2;
  }

  // Check for known scam prefixes
  const scamPrefixes = ['190', '197', '900', '866', '877', '888'];
  for (const prefix of scamPrefixes) {
    if (cleanNumber.includes(prefix)) {
      patterns.push('Premium rate number');
      riskScore += 0.4;
      break;
    }
  }

  // Check for repeated digits
  if (/(.)\1{3,}/.test(cleanNumber)) {
    patterns.push('Repeated digit pattern');
    riskScore += 0.3;
  }

  // Check for sequential numbers
  if (/123456|234567|345678/.test(cleanNumber)) {
    patterns.push('Sequential number pattern');
    riskScore += 0.2;
  }

  // Determine risk level
  if (riskScore >= 0.7) {
    riskLevel = 'Critical';
  } else if (riskScore >= 0.5) {
    riskLevel = 'High';
  } else if (riskScore >= 0.3) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  return {
    phoneNumber,
    riskScore: Math.min(riskScore, 1),
    riskLevel,
    suspiciousPatterns: patterns,
    isKnownScam: riskScore >= 0.5
  };
};

// Helper function to get recommendation
const getRecommendation = (riskScore, isBlocked) => {
  if (isBlocked) {
    return 'This number is blocked. Calls from this number will be rejected automatically.';
  }
  
  if (riskScore >= 0.7) {
    return 'High risk number. Consider blocking immediately.';
  } else if (riskScore >= 0.5) {
    return 'Medium risk number. Be cautious and consider blocking if suspicious.';
  } else if (riskScore >= 0.3) {
    return 'Low to medium risk. Answer with caution.';
  } else {
    return 'Number appears to be legitimate.';
  }
};

module.exports = {
  syncCallLogs,
  getCallHistory,
  blockPhoneNumber,
  unblockPhoneNumber,
  getBlockedNumbers,
  reportSpamCall,
  getCallProtectionStatistics,
  analyzePhoneNumber
};
