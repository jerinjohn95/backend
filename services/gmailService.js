const { google } = require('googleapis');
const axios = require('axios');
const EmailReport = require('../models/EmailReport');
const GmailAccount = require('../models/GmailAccount');
const { encrypt, decrypt } = require('../utils/crypto');
const nlp = require('compromise');
const natural = require('natural');

// Validate access token with Google tokeninfo endpoint
async function validateAccessToken(accessToken) {
  try {
    const res = await axios.get('https://www.googleapis.com/oauth2/v3/tokeninfo', {
      params: { access_token: accessToken }
    });
    return res.data; // contains scope, exp, email, aud, etc.
  } catch (err) {
    throw new Error('Invalid access token');
  }
}

// Save or update gmail account record
async function saveGmailAccount({ userId, emailAddress, accessToken, scope, expiresIn }) {
  const encryptedAccessToken = encrypt(accessToken);
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  const record = await GmailAccount.findOneAndUpdate(
    { userId },
    { emailAddress, encryptedAccessToken, scope, expiresAt, connectedAt: new Date() },
    { upsert: true, new: true }
  );

  return record;
}

function getGmailClient(accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

async function fetchAndAnalyzeEmails({ userId, maxResults = 20 }) {
  // Find stored account
  const account = await GmailAccount.findOne({ userId });
  if (!account) throw new Error('Gmail account not connected for user');

  const accessToken = decrypt(account.encryptedAccessToken);
  const gmail = getGmailClient(accessToken);

  // List messages
  const listRes = await gmail.users.messages.list({ userId: 'me', maxResults });
  const messages = listRes.data.messages || [];

  const results = [];

  for (const m of messages) {
    try {
      const msgRes = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
      const msg = msgRes.data;

      // Extract headers
      const headers = msg.payload && msg.payload.headers ? msg.payload.headers : [];
      const headerMap = {};
      headers.forEach(h => (headerMap[h.name.toLowerCase()] = h.value));

      const sender = headerMap['from'] || 'unknown';
      const subject = headerMap['subject'] || '(no subject)';
      const date = headerMap['date'] ? new Date(headerMap['date']) : new Date();

      const snippet = msg.snippet || extractSnippetFromPayload(msg.payload);

      // Run detection
      const status = runAdvancedNLP({ subject, snippet, sender });

      // Save to DB
      const saved = await EmailReport.findOneAndUpdate(
        { userId, sender, subject, receivedAt: date },
        { userId, sender, subject, snippet, status, receivedAt: date, scannedAt: new Date() },
        { upsert: true, new: true }
      );

      results.push(saved);
    } catch (err) {
      console.warn('Failed to fetch message', m.id, err.message);
      continue;
    }
  }

  return results;
}

function extractSnippetFromPayload(payload) {
  try {
    if (!payload) return '';
    if (payload.parts && payload.parts.length) {
      const part = payload.parts.find(p => p.mimeType === 'text/plain') || payload.parts[0];
      const data = part.body && part.body.data;
      if (data) return Buffer.from(data, 'base64').toString('utf8').slice(0, 500);
    }
    return '';
  } catch (err) {
    return '';
  }
}

// Basic rule-based detection logic
function runRuleBasedDetection({ subject = '', snippet = '', sender = '' }) {
  const text = `${subject} ${snippet}`.toLowerCase();

  const phishingKeywords = ['verify', 'verify your', 'urgent', 'account locked', 'reset your password', 'confirm', 'suspend', 'limited time', 'click here', 'update your', 'security alert'];
  const spamKeywords = ['unsubscribe', 'newsletter', 'sale', 'buy now', 'free', 'promotion'];

  const hasPhishing = phishingKeywords.some(k => text.includes(k));
  const hasSpam = spamKeywords.some(k => text.includes(k));

  // Count links
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = (text.match(urlRegex) || []);

  // Spoofed sender domain check (very basic): if display name contains a well-known brand but domain doesn't match
  let spoofing = false;
  try {
    const fromLower = sender.toLowerCase();
    // e.g., "Google <no-reply@random.com>"
    const m = fromLower.match(/<([^>]+)>/);
    if (m && m[1]) {
      const domain = m[1].split('@')[1] || '';
      if (domain && domain.includes('google') === false && fromLower.includes('google')) spoofing = true;
    }
  } catch (e) {
    spoofing = false;
  }

  if ((hasPhishing || spoofing) && urls.length >= 1) return 'Phishing';
  if (hasPhishing && urls.length === 0) return 'Spam';
  if (hasSpam) return 'Spam';
  if (urls.length > 3) return 'Phishing';
  return 'Safe';
}

// Advanced NLP-based detection
function runAdvancedNLP({ subject = '', snippet = '', sender = '' }) {
  const fullText = `${subject} ${snippet}`;
  
  // Use compromise for NLP analysis
  const doc = nlp(fullText);
  
  // Check for urgency and fear-inducing language
  const urgencyWords = ['urgent', 'immediately', 'now', 'quickly', 'asap', 'deadline', 'expires', 'limited time'];
  const fearWords = ['suspended', 'locked', 'blocked', 'security alert', 'unauthorized', 'breach', 'compromised'];
  const actionWords = ['click', 'verify', 'confirm', 'update', 'reset', 'login', 'sign in'];
  const personalInfoWords = ['password', 'credit card', 'ssn', 'social security', 'bank account', 'personal information'];
  
  const hasUrgency = urgencyWords.some(word => doc.has(word));
  const hasFear = fearWords.some(word => doc.has(word));
  const hasAction = actionWords.some(word => doc.has(word));
  const hasPersonalInfo = personalInfoWords.some(word => doc.has(word));
  
  // Check for questions or requests
  const questions = doc.questions().length > 0;
  const imperatives = doc.verbs().toImperative().length > 0;
  
  // Sentiment analysis (basic)
  const sentiment = natural.SentimentAnalyzer;
  const analyzer = new sentiment('English', natural.PorterStemmer, 'afinn');
  const tokens = natural.WordTokenizer.tokenize(fullText);
  const stemmed = tokens.map(token => natural.PorterStemmer.stem(token));
  const sentimentScore = analyzer.getSentiment(stemmed);
  const isNegative = sentimentScore < -0.1; // Negative sentiment might indicate phishing
  
  // URL analysis
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = fullText.match(urlRegex) || [];
  const hasManyUrls = urls.length > 2;
  const hasShortenedUrls = urls.some(url => /bit\.ly|t\.co|tinyurl|goo\.gl/i.test(url));
  
  // Sender analysis
  const senderDoc = nlp(sender);
  const hasDisplayName = sender.includes('<') && sender.includes('>');
  let domainMismatch = false;
  if (hasDisplayName) {
    const displayName = sender.split('<')[0].trim().toLowerCase();
    const emailMatch = sender.match(/<([^>]+)>/);
    if (emailMatch) {
      const domain = emailMatch[1].split('@')[1];
      // Check if display name contains bank/financial terms but domain is suspicious
      const financialTerms = ['bank', 'paypal', 'amazon', 'apple', 'google', 'microsoft'];
      const hasFinancialDisplay = financialTerms.some(term => displayName.includes(term));
      const suspiciousDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      if (hasFinancialDisplay && suspiciousDomains.includes(domain)) {
        domainMismatch = true;
      }
    }
  }
  
  // Scoring system
  let score = 0;
  if (hasUrgency) score += 2;
  if (hasFear) score += 3;
  if (hasAction) score += 2;
  if (hasPersonalInfo) score += 3;
  if (questions) score += 1;
  if (imperatives) score += 1;
  if (isNegative) score += 1;
  if (hasManyUrls) score += 2;
  if (hasShortenedUrls) score += 3;
  if (domainMismatch) score += 4;
  
  // Classification
  if (score >= 8) return 'Phishing';
  if (score >= 4) return 'Suspicious';
  if (score >= 2) return 'Spam';
  return 'Safe';
}

module.exports = {
  validateAccessToken,
  saveGmailAccount,
  fetchAndAnalyzeEmails
};
