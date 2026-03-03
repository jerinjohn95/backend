const mongoose = require('mongoose');

const emailReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: { type: String, required: true },
  subject: { type: String, required: true },
  snippet: { type: String },
  status: {
    type: String,
    enum: ['Safe', 'Spam', 'Suspicious', 'Phishing'],
    required: true
  },
  receivedAt: { type: Date },
  scannedAt: { type: Date, default: Date.now }
}, { timestamps: true });

emailReportSchema.index({ userId: 1, scannedAt: -1 });

module.exports = mongoose.model('EmailReport', emailReportSchema);
