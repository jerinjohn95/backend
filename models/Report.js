const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['Website', 'Call', 'Message', 'Email'],
    default: 'Website'
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Fake', 'Safe'],
    default: 'Safe'
  },
  data: {
    type: String,
    required: [true, 'Data is required'],
    trim: true
  },
  details: {
    type: String,
    trim: true,
    maxlength: [500, 'Details cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);
