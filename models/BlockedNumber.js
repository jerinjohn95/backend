const mongoose = require('mongoose');

const BlockedNumberSchema = new mongoose.Schema({
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
  blockReason: {
    type: String,
    enum: ['spam', 'harassment', 'scam', 'telemarketing', 'unknown', 'user_preference'],
    default: 'user_preference'
  },
  blockDate: {
    type: Date,
    default: Date.now
  },
  isTemporary: {
    type: Boolean,
    default: false
  },
  unblockDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
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
  reportCount: {
    type: Number,
    default: 0
  },
  lastReportDate: {
    type: Date,
    default: null
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
BlockedNumberSchema.index({ userId: 1, phoneNumber: 1 });
BlockedNumberSchema.index({ userId: 1, isActive: 1 });
BlockedNumberSchema.index({ phoneNumber: 1 });
BlockedNumberSchema.index({ blockReason: 1 });

// Pre-save middleware to update timestamps
BlockedNumberSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
BlockedNumberSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  if (options.blockReason) {
    query.blockReason = options.blockReason;
  }
  
  if (options.riskLevel) {
    query.riskLevel = options.riskLevel;
  }
  
  return this.find(query)
    .sort({ blockDate: -1 })
    .limit(options.limit || 100);
};

BlockedNumberSchema.statics.isBlocked = function(phoneNumber, userId) {
  return this.findOne({
    phoneNumber: phoneNumber,
    userId: userId,
    isActive: true,
    $or: [
      { isTemporary: false },
      { isTemporary: true, unblockDate: { $gt: new Date() } }
    ]
  });
};

BlockedNumberSchema.statics.getBlockedNumbers = function(userId) {
  return this.find({ userId, isActive: true })
    .select('phoneNumber callerName blockReason blockDate riskScore riskLevel')
    .sort({ blockDate: -1 });
};

BlockedNumberSchema.statics.getStatistics = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        totalBlocked: { $sum: 1 },
        temporaryBlocks: { $sum: { $cond: ['$isTemporary', 1, 0] } },
        permanentBlocks: { $sum: { $cond: ['$isTemporary', 0, 1] } },
        avgRiskScore: { $avg: '$riskScore' },
        blockReasons: {
          $push: '$blockReason'
        }
      }
    },
    {
      $project: {
        totalBlocked: 1,
        temporaryBlocks: 1,
        permanentBlocks: 1,
        avgRiskScore: 1,
        blockReasonDistribution: {
          $reduce: {
            input: '$blockReasons',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [
                    [{ k: '$$this', v: { $add: [{ $ifNull: [{ $arrayElemAt: ['$$value.$$this', 0] }, 0] }, 1] } }]
                  ]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

// Instance methods
BlockedNumberSchema.methods.unblock = function() {
  this.isActive = false;
  return this.save();
};

BlockedNumberSchema.methods.updateReport = function() {
  this.reportCount += 1;
  this.lastReportDate = new Date();
  return this.save();
};

BlockedNumberSchema.methods.extendBlock = function(days) {
  this.isTemporary = true;
  this.unblockDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

module.exports = mongoose.model('BlockedNumber', BlockedNumberSchema);
