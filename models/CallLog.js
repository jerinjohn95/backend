const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  callerName: {
    type: String,
    default: 'Unknown',
    trim: true
  },
  callType: {
    type: String,
    enum: ['incoming', 'outgoing', 'missed', 'rejected', 'blocked'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    default: 0 // in seconds
  },
  isSpam: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },
  suspiciousPatterns: [{
    type: String
  }],
  callerInfo: {
    name: String,
    type: String,
    location: String,
    carrier: String,
    email: String,
    gender: String,
    verified: Boolean,
    source: String,
    spamCount: Number,
    searchCount: Number
  },
  contactSource: {
    type: String,
    enum: ['contacts', 'truecaller-database', 'truecaller-india', 'backend', 'indian-pattern-analysis', 'unknown'],
    default: 'unknown'
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: {
    type: String,
    trim: true
  },
  reportNotes: {
    type: String,
    trim: true
  },
  deviceInfo: {
    deviceId: String,
    platform: String,
    appVersion: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
CallLogSchema.index({ userId: 1, timestamp: -1 });
CallLogSchema.index({ phoneNumber: 1, userId: 1 });
CallLogSchema.index({ isSpam: 1, timestamp: -1 });
CallLogSchema.index({ isBlocked: 1, timestamp: -1 });

// Pre-save middleware to update timestamps
CallLogSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
CallLogSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.callType) {
    query.callType = options.callType;
  }
  
  if (options.isSpam !== undefined) {
    query.isSpam = options.isSpam;
  }
  
  if (options.isBlocked !== undefined) {
    query.isBlocked = options.isBlocked;
  }
  
  if (options.startDate && options.endDate) {
    query.timestamp = {
      $gte: options.startDate,
      $lte: options.endDate
    };
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 50);
};

CallLogSchema.statics.findByPhoneNumber = function(phoneNumber, userId) {
  return this.findOne({ 
    phoneNumber: phoneNumber, 
    userId: userId 
  }).sort({ timestamp: -1 });
};

CallLogSchema.statics.getStatistics = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        spamCalls: { $sum: { $cond: ['$isSpam', 1, 0] } },
        blockedCalls: { $sum: { $cond: ['$isBlocked', 1, 0] } },
        reportedCalls: { $sum: { $cond: ['$isReported', 1, 0] } },
        avgRiskScore: { $avg: '$riskScore' },
        avgDuration: { $avg: '$duration' }
      }
    },
    {
      $lookup: {
        from: 'calllogs',
        let: { userId: '$userId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$userId', '$$userId'] } } },
          {
            $group: {
              _id: '$callType',
              count: { $sum: 1 }
            }
          }
        ],
        as: 'callTypes'
      }
    }
  ]);
};

// Instance methods
CallLogSchema.methods.markAsSpam = function(reason) {
  this.isSpam = true;
  this.riskLevel = 'High';
  this.reportReason = reason;
  this.isReported = true;
  return this.save();
};

CallLogSchema.methods.blockNumber = function() {
  this.isBlocked = true;
  return this.save();
};

CallLogSchema.methods.unblockNumber = function() {
  this.isBlocked = false;
  return this.save();
};

CallLogSchema.methods.updateRiskScore = function(score, level) {
  this.riskScore = score;
  this.riskLevel = level;
  return this.save();
};

module.exports = mongoose.model('CallLog', CallLogSchema);
