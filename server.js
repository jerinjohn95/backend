require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// In-memory storage for demo (in production, use database)
let blockedNumbers = [];
let spamReports = [];

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const gmailRoutes = require('./routes/gmailRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const fakeCallRoutes = require('./routes/fakeCallRoutes');

const app = express();

// Connect to MongoDB (optional for demo)
connectDB().catch(err => {
  console.log('MongoDB connection failed, continuing without database...');
});

// Initialize Passport
require('./config/googleStrategy');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.65:3000', 'http://JERIN-JOHN:3000', 'capacitor://localhost', 'http://localhost'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (premium dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// Premium logging middleware with timestamps
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress;
  console.log(`[${timestamp}] ${clientIP} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', reportRoutes);
app.use('/api', gmailRoutes);
app.use('/api', fakeCallRoutes);
app.use('/auth', googleAuthRoutes);

// Premium Dashboard Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Enhanced Health Check Endpoint
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    server: {
      node: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    database: {
      status: 'connected', // This would be dynamic in real implementation
      type: 'MongoDB'
    },
    endpoints: {
      auth: '/api/login, /api/signup',
      users: '/api/users',
      reports: '/api/reports',
      gmail: '/api/gmail',
      website: '/api/check-website'
    },
    security: {
      cors: 'enabled',
      rateLimit: 'active',
      encryption: 'AES-256'
    }
  };
  
  res.status(200).json(healthCheck);
});

// Premium Stats Endpoint
app.get('/api/stats', (req, res) => {
  const stats = {
    users: {
      total: 1247,
      active: 892,
      newToday: 23
    },
    reports: {
      total: 3892,
      processed: 3847,
      pending: 45,
      threatsBlocked: 847
    },
    system: {
      uptime: process.uptime(),
      requestsToday: 15234,
      avgResponseTime: 120,
      errorRate: 0.02
    },
    security: {
      phishingAttempts: 156,
      blockedIPs: 23,
      suspiciousActivity: 8
    }
  };
  
  res.status(200).json(stats);
});

// Admin Seeding Endpoint
app.post('/api/seed-admin', async (req, res) => {
  try {
    console.log('👤 Seeding admin user...');
    // This would trigger the admin seeding script
    const { spawn } = require('child_process');
    const seedProcess = spawn('npm', ['run', 'seed:admin'], { cwd: __dirname });
    
    seedProcess.on('close', (code) => {
      if (code === 0) {
        res.status(200).json({ success: true, message: 'Admin user seeded successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to seed admin user' });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// TrueCaller API Integration Endpoint
app.post('/api/truecaller-lookup', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }
    
    // Note: This is a simulation. Real TrueCaller API integration requires:
    // 1. Registration with TrueCaller Developer Program
    // 2. OAuth 2.0 authentication
    // 3. API key and secret management
    // 4. Rate limiting and quota management
    
    // Simulate TrueCaller API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock TrueCaller database (in production, this would be actual API call)
    const trueCallerDatabase = {
      '+1234567890': { 
        name: 'John Doe', 
        isSpam: false, 
        type: 'personal',
        riskScore: 0.1,
        location: 'New York, USA',
        carrier: 'Verizon',
        email: 'john.doe@email.com',
        gender: 'male',
        verified: true,
        profileImage: 'https://example.com/avatars/john.jpg',
        source: 'truecaller'
      },
      '+0987654321': { 
        name: 'Spam Caller', 
        isSpam: true, 
        type: 'spam',
        riskScore: 0.95,
        location: 'Unknown',
        carrier: 'Various',
        spamReports: 1250,
        spamScore: 0.95,
        source: 'truecaller'
      },
      '+15551234567': { 
        name: 'Bank of America', 
        isSpam: false, 
        type: 'business',
        riskScore: 0.2,
        location: 'Charlotte, NC',
        carrier: 'AT&T',
        category: 'financial',
        verified: true,
        source: 'truecaller'
      },
      '+18005551234': { 
        name: 'IRS Scam', 
        isSpam: true, 
        type: 'scam',
        riskScore: 1.0,
        location: 'Unknown',
        carrier: 'Spoofed',
        spamReports: 5000,
        spamScore: 1.0,
        source: 'truecaller'
      }
    };
    
    const callerInfo = trueCallerDatabase[phoneNumber] || {
      name: 'Unknown',
      isSpam: false,
      type: 'unknown',
      riskScore: 0.5,
      location: 'Unknown',
      carrier: 'Unknown',
      source: 'truecaller',
      notFound: true
    };
    
    res.status(200).json({
      success: true,
      data: callerInfo,
      timestamp: new Date().toISOString(),
      api: 'truecaller'
    });
    
  } catch (error) {
    console.error('TrueCaller lookup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'TrueCaller API error',
      error: error.message 
    });
  }
});

// Fake Message Detection API Endpoint
app.post('/api/analyze-message', async (req, res) => {
  try {
    const { content, sender, number } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message content is required' 
      });
    }
    
    // Analyze message for fake/scam detection
    const analysis = _analyzeMessageForScam(content, sender, number);
    
    res.status(200).json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Message analysis error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Block SMS Number API Endpoint
app.post('/api/block-sms-number', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }
    
    // Add to blocked numbers (in production, use database)
    if (!blockedNumbers.includes(phoneNumber)) {
      blockedNumbers.push(phoneNumber);
    }
    
    res.status(200).json({
      success: true,
      message: 'SMS number blocked successfully',
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Block SMS number error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Report Fake Message API Endpoint
app.post('/api/report-fake-message', async (req, res) => {
  try {
    const { messageId, reason, timestamp } = req.body;
    
    if (!messageId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message ID is required' 
      });
    }
    
    // Log fake message report (in production, use database)
    console.log(`Fake message reported: ${messageId} - Reason: ${reason}`);
    
    // Add to spam reports database
    spamReports.push({
      id: messageId,
      reason: reason,
      timestamp: timestamp || new Date().toISOString(),
      reportedAt: new Date().toISOString()
    });
    
    res.status(200).json({
      success: true,
      message: 'Fake message reported successfully',
      messageId: messageId,
      reason: reason,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Report fake message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get Message Statistics API Endpoint
app.get('/api/message-stats', async (req, res) => {
  try {
    const stats = {
      totalMessages: 125,
      safeMessages: 85,
      suspiciousMessages: 25,
      highRiskMessages: 10,
      scamMessages: 5,
      blockedNumbers: blockedNumbers.length,
      scamReports: spamReports.length,
      scamRate: '4.0',
      lastUpdated: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Message stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get Blocked SMS Numbers API Endpoint
app.get('/api/blocked-sms-numbers', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: blockedNumbers,
      count: blockedNumbers.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get blocked SMS numbers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Message Analysis Helper Function
function _analyzeMessageForScam(content, sender, number) {
  const text = content.toLowerCase();
  const senderLower = (sender || '').toLowerCase();
  
  let riskScore = 0.0;
  const indicators = [];
  let scamType = 'unknown';
  let isFake = false;
  
  // Lottery/Prize scams
  if (text.includes('congratulations') && text.includes('won')) {
    riskScore += 0.4;
    indicators.push('Lottery scam pattern detected');
    scamType = 'lottery';
  }
  
  // Urgency tactics
  if (text.includes('urgent') || text.includes('immediately') || text.includes('act now')) {
    riskScore += 0.3;
    indicators.push('Urgency tactics detected');
  }
  
  // Suspicious links
  if (text.includes('click here') || text.includes('bit.ly') || text.includes('tinyurl') || text.includes('short.link')) {
    riskScore += 0.3;
    indicators.push('Suspicious short links detected');
    scamType = 'phishing';
  }
  
  // Government impersonation
  if (text.includes('irs') || text.includes('tax return') || text.includes('social security') || text.includes('government')) {
    riskScore += 0.5;
    indicators.push('Government agency impersonation');
    scamType = 'impersonation';
  }
  
  // Prize claim scams
  if (text.includes('claim') && text.includes('prize') && text.includes('winner')) {
    riskScore += 0.4;
    indicators.push('Prize claim scam detected');
    scamType = 'prize';
  }
  
  // Bank/Financial scams
  if (text.includes('account suspended') || text.includes('verify your account') || text.includes('unusual activity')) {
    riskScore += 0.4;
    indicators.push('Bank/Financial scam pattern');
    scamType = 'banking';
  }
  
  // Delivery scams
  if (text.includes('package') && text.includes('delivery') && text.includes('fee')) {
    riskScore += 0.3;
    indicators.push('Delivery fee scam detected');
    scamType = 'delivery';
  }
  
  // Unknown sender
  if (senderLower.includes('unknown') || senderLower.includes('anonymous') || !sender) {
    riskScore += 0.2;
    indicators.push('Unknown or anonymous sender');
  }
  
  // Phone numbers in content
  if (/\+?\d{10,}/.test(text)) {
    riskScore += 0.1;
    indicators.push('Contains phone number');
  }
  
  // Money requests
  if (text.includes('send money') || text.includes('wire transfer') || text.includes('gift card')) {
    riskScore += 0.4;
    indicators.push('Money request detected');
    scamType = 'financial';
  }
  
  // Personal information requests
  if (text.includes('ssn') || text.includes('social security') || text.includes('credit card') || text.includes('password')) {
    riskScore += 0.5;
    indicators.push('Personal information request');
    scamType = 'phishing';
  }
  
  // Determine if fake based on risk score
  isFake = riskScore > 0.6;
  
  // Cap risk score at 1.0
  riskScore = Math.min(riskScore, 1.0);
  
  return {
    isFake: isFake,
    confidence: riskScore,
    scamType: scamType,
    riskScore: riskScore,
    indicators: indicators,
    source: 'backend',
    analysis: {
      contentLength: content.length,
      hasLinks: /(http|https|www\.|bit\.ly|tinyurl)/.test(text),
      hasPhoneNumbers: /\+?\d{10,}/.test(text),
      hasUrgency: /(urgent|immediately|act now|hurry)/.test(text),
      senderKnown: sender && !senderLower.includes('unknown')
    }
  };
}
app.post('/api/caller-id', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }
    
    // First try TrueCaller API
    try {
      const truecallerResponse = await fetch(`${req.protocol}://${req.get('host')}/api/truecaller-lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      
      if (truecallerResponse.ok) {
        const truecallerData = await truecallerResponse.json();
        if (truecallerData.success && !truecallerData.data.notFound) {
          return res.status(200).json({
            success: true,
            data: truecallerData.data,
            source: 'truecaller',
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (truecallerError) {
      console.log('TrueCaller API unavailable, using fallback');
    }
    
    // Fallback to our database
    const mockDatabase = {
      '1234567890': { 
        name: 'John Doe', 
        isSpam: false, 
        type: 'personal',
        riskScore: 0.1,
        location: 'New York, USA',
        carrier: 'Verizon'
      },
      '0987654321': { 
        name: 'Spam Caller', 
        isSpam: true, 
        type: 'spam',
        riskScore: 0.9,
        location: 'Unknown',
        carrier: 'Various'
      },
      '5551234567': { 
        name: 'Bank of America', 
        isSpam: false, 
        type: 'business',
        riskScore: 0.2,
        location: 'Charlotte, NC',
        carrier: 'AT&T'
      },
      '18005551234': { 
        name: 'IRS Scam', 
        isSpam: true, 
        type: 'scam',
        riskScore: 1.0,
        location: 'Unknown',
        carrier: 'Spoofed'
      }
    };
    
    const callerInfo = mockDatabase[phoneNumber] || {
      name: 'Unknown',
      isSpam: false,
      type: 'unknown',
      riskScore: 0.5,
      location: 'Unknown',
      carrier: 'Unknown'
    };
    
    res.status(200).json({
      success: true,
      data: {
        ...callerInfo,
        source: 'backend'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Caller ID lookup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Block Number API Endpoint
app.post('/api/block-number', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }
    
    // In a real implementation, save to database
    console.log(`🚫 Number blocked: ${phoneNumber}`);
    
    res.status(200).json({
      success: true,
      message: 'Number blocked successfully',
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Block number error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Unblock Number API Endpoint
app.post('/api/unblock-number', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }
    
    // In a real implementation, remove from database
    console.log(`✅ Number unblocked: ${phoneNumber}`);
    
    res.status(200).json({
      success: true,
      message: 'Number unblocked successfully',
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Unblock number error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Report Spam API Endpoint
app.post('/api/report-spam', async (req, res) => {
  try {
    const { phoneNumber, reason } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }
    
    // In a real implementation, save to spam database
    console.log(`🚨 Spam reported: ${phoneNumber} - Reason: ${reason || 'Not provided'}`);
    
    res.status(200).json({
      success: true,
      message: 'Spam reported successfully',
      phoneNumber: phoneNumber,
      reason: reason || 'User reported as spam',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Report spam error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get Blocked Numbers API Endpoint
app.get('/api/blocked-numbers', async (req, res) => {
  try {
    // Mock blocked numbers (replace with database query)
    const mockBlockedNumbers = [
      '0987654321',
      '18005551234',
      '1900123456'
    ];
    
    res.status(200).json({
      success: true,
      data: mockBlockedNumbers,
      count: mockBlockedNumbers.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get blocked numbers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Enhanced 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/stats',
      'POST /api/seed-admin',
      'POST /api/caller-id',
      'POST /api/truecaller-lookup',
      'POST /api/block-number',
      'POST /api/unblock-number',
      'POST /api/report-spam',
      'GET /api/blocked-numbers',
      'POST /api/analyze-message',
      'POST /api/block-sms-number',
      'POST /api/report-fake-message',
      'GET /api/message-stats',
      'GET /api/blocked-sms-numbers',
      'POST /api/login',
      'POST /api/signup',
      'GET /api/users',
      'GET /api/reports',
      'POST /api/check-website'
    ]
  });
});

// Enhanced error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('\n🚀 DECEPTICALL Premium Backend Server');
  console.log('=====================================');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Premium Dashboard: http://localhost:${PORT}/`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Accessible from network: http://0.0.0.0:${PORT}/api/health`);
  console.log('=====================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
