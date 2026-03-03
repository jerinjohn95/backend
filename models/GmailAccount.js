const mongoose = require('mongoose');

const gmailAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailAddress: {
    type: String,
    required: true
  },
  encryptedAccessToken: {
    type: String,
    required: true
  },
  scope: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  connectedAt: {
    type: Date,
    default: Date.now
  }
});

gmailAccountSchema.index({ userId: 1 });

module.exports = mongoose.model('GmailAccount', gmailAccountSchema);
