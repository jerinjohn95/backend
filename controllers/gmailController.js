const mongoose = require('mongoose');
const { validateAccessToken, saveGmailAccount, fetchAndAnalyzeEmails } = require('../services/gmailService');
const GmailAccount = require('../models/GmailAccount');

// POST /api/gmail/connect
// Body: { accessToken, userId }
const connectGmail = async (req, res) => {
  try {
    const { accessToken, userId } = req.body;
    if (!accessToken || !userId) {
      return res.status(400).json({ success: false, message: 'accessToken and userId are required' });
    }

    // Validate token with Google
    const info = await validateAccessToken(accessToken);

    // Save account
    const account = await saveGmailAccount({
      userId: mongoose.Types.ObjectId(userId),
      emailAddress: info.email || info.email_address || 'unknown',
      accessToken,
      scope: info.scope,
      expiresIn: info.exp
    });

    res.status(200).json({ success: true, message: 'Gmail account connected', data: { accountId: account._id, email: account.emailAddress } });
  } catch (error) {
    console.error('connectGmail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/gmail/emails/:userId
const getEmails = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });

    const results = await fetchAndAnalyzeEmails({ userId, maxResults: 25 });
    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('getEmails error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { connectGmail, getEmails };
