const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const CallLog = require('../models/CallLog');
const BlockedNumber = require('../models/BlockedNumber');
const User = require('../models/User');

async function setupCallProtection() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/decepticall');
    console.log('✅ Connected to MongoDB');

    // Create indexes for CallLog collection
    console.log('📊 Creating CallLog indexes...');
    await CallLog.createIndexes([
      { userId: 1, timestamp: -1 },
      { phoneNumber: 1, userId: 1 },
      { isSpam: 1, timestamp: -1 },
      { isBlocked: 1, timestamp: -1 },
      { riskScore: 1 },
      { contactSource: 1 }
    ]);
    console.log('✅ CallLog indexes created');

    // Create indexes for BlockedNumber collection
    console.log('📊 Creating BlockedNumber indexes...');
    await BlockedNumber.createIndexes([
      { userId: 1, phoneNumber: 1 },
      { userId: 1, isActive: 1 },
      { phoneNumber: 1 },
      { blockReason: 1 },
      { blockDate: -1 }
    ]);
    console.log('✅ BlockedNumber indexes created');

    // Insert sample data for testing
    console.log('📝 Inserting sample data...');
    
    // Get a sample user
    const sampleUser = await User.findOne();
    if (!sampleUser) {
      console.log('⚠️ No user found. Please create a user first.');
      return;
    }

    // Sample call logs
    const sampleCallLogs = [
      {
        userId: sampleUser._id,
        phoneNumber: '+1234567890',
        callerName: 'John Doe',
        callType: 'incoming',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        duration: 120,
        isSpam: false,
        isBlocked: false,
        riskScore: 0.1,
        riskLevel: 'Low',
        suspiciousPatterns: [],
        callerInfo: {
          name: 'John Doe',
          type: 'personal',
          location: 'New York, USA',
          carrier: 'Verizon',
          email: 'john.doe@email.com',
          gender: 'male',
          verified: true,
          source: 'truecaller-database',
          spamCount: 0,
          searchCount: 1250
        },
        contactSource: 'truecaller-database',
        deviceInfo: {
          deviceId: 'test_device_001',
          platform: 'android',
          appVersion: '1.0.0'
        }
      },
      {
        userId: sampleUser._id,
        phoneNumber: '+0987654321',
        callerName: 'Spam Caller',
        callType: 'missed',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        duration: 0,
        isSpam: true,
        isBlocked: true,
        riskScore: 0.9,
        riskLevel: 'Critical',
        suspiciousPatterns: ['Fake number pattern', 'Repeated digit pattern'],
        callerInfo: {
          name: 'Unknown',
          type: 'spam',
          location: 'Unknown',
          carrier: 'Various',
          source: 'indian-pattern-analysis',
          spamCount: 500,
          searchCount: 2500
        },
        contactSource: 'indian-pattern-analysis',
        isReported: true,
        reportReason: 'spam',
        reportNotes: 'User reported as spam caller',
        deviceInfo: {
          deviceId: 'test_device_001',
          platform: 'android',
          appVersion: '1.0.0'
        }
      },
      {
        userId: sampleUser._id,
        phoneNumber: '+15551234567',
        callerName: 'Bank of America',
        callType: 'incoming',
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        duration: 300,
        isSpam: false,
        isBlocked: false,
        riskScore: 0.2,
        riskLevel: 'Low',
        suspiciousPatterns: [],
        callerInfo: {
          name: 'Bank of America',
          type: 'business',
          location: 'Charlotte, NC',
          carrier: 'AT&T',
          email: 'support@bankofamerica.com',
          verified: true,
          source: 'truecaller-database',
          spamCount: 0,
          searchCount: 5000
        },
        contactSource: 'truecaller-database',
        deviceInfo: {
          deviceId: 'test_device_001',
          platform: 'android',
          appVersion: '1.0.0'
        }
      },
      {
        userId: sampleUser._id,
        phoneNumber: '+18005551234',
        callerName: 'IRS Scam',
        callType: 'missed',
        timestamp: new Date(Date.now() - 14400000), // 4 hours ago
        duration: 0,
        isSpam: true,
        isBlocked: true,
        riskScore: 1.0,
        riskLevel: 'Critical',
        suspiciousPatterns: ['Premium rate number', 'Government impersonation'],
        callerInfo: {
          name: 'IRS Scam',
          type: 'scam',
          location: 'Unknown',
          carrier: 'Spoofed',
          source: 'backend',
          spamCount: 5000,
          searchCount: 10000
        },
        contactSource: 'backend',
        isReported: true,
        reportReason: 'scam',
        reportNotes: 'Claimed to be from IRS demanding payment',
        deviceInfo: {
          deviceId: 'test_device_001',
          platform: 'android',
          appVersion: '1.0.0'
        }
      },
      {
        userId: sampleUser._id,
        phoneNumber: '+191987654321',
        callerName: 'Airtel User',
        callType: 'outgoing',
        timestamp: new Date(Date.now() - 18000000), // 5 hours ago
        duration: 180,
        isSpam: false,
        isBlocked: false,
        riskScore: 0.2,
        riskLevel: 'Low',
        suspiciousPatterns: ['Indian number'],
        callerInfo: {
          name: 'Airtel User',
          type: 'mobile',
          location: 'Mumbai, Maharashtra',
          carrier: 'Airtel',
          email: 'user@airtel.com',
          gender: 'unknown',
          verified: false,
          source: 'truecaller-india',
          spamCount: 0,
          searchCount: 1250
        },
        contactSource: 'truecaller-india',
        deviceInfo: {
          deviceId: 'test_device_001',
          platform: 'android',
          appVersion: '1.0.0'
        }
      }
    ];

    // Insert sample call logs
    const insertedCallLogs = await CallLog.insertMany(sampleCallLogs);
    console.log(`✅ Inserted ${insertedCallLogs.length} sample call logs`);

    // Sample blocked numbers
    const sampleBlockedNumbers = [
      {
        userId: sampleUser._id,
        phoneNumber: '+0987654321',
        callerName: 'Spam Caller',
        blockReason: 'spam',
        isTemporary: false,
        riskScore: 0.9,
        riskLevel: 'Critical',
        suspiciousPatterns: ['Fake number pattern', 'Repeated digit pattern'],
        reportCount: 5,
        lastReportDate: new Date(),
        deviceInfo: {
          deviceId: 'test_device_001',
          platform: 'android',
          appVersion: '1.0.0'
        }
      },
      {
        userId: sampleUser._id,
        phoneNumber: '+18005551234',
        callerName: 'IRS Scam',
        blockReason: 'scam',
        isTemporary: false,
        riskScore: 1.0,
        riskLevel: 'Critical',
        suspiciousPatterns: ['Premium rate number', 'Government impersonation'],
        reportCount: 10,
        lastReportDate: new Date(),
        deviceInfo: {
          deviceId: 'test_device_001',
          platform: 'android',
          appVersion: '1.0.0'
        }
      },
      {
        userId: sampleUser._id,
        phoneNumber: '+1900123456',
        callerName: 'Telemarketer',
        blockReason: 'telemarketing',
        isTemporary: true,
        unblockDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        riskScore: 0.6,
        riskLevel: 'Medium',
        suspiciousPatterns: ['Premium rate number'],
        reportCount: 2,
        lastReportDate: new Date(Date.now() - 86400000), // 1 day ago
        deviceInfo: {
          deviceId: 'test_device_001',
          platform: 'android',
          appVersion: '1.0.0'
        }
      }
    ];

    // Insert sample blocked numbers
    const insertedBlockedNumbers = await BlockedNumber.insertMany(sampleBlockedNumbers);
    console.log(`✅ Inserted ${insertedBlockedNumbers.length} sample blocked numbers`);

    // Display statistics
    const callStats = await CallLog.getStatistics(sampleUser._id);
    const blockStats = await BlockedNumber.getStatistics(sampleUser._id);

    console.log('\n📊 Call Protection Setup Complete!');
    console.log('=====================================');
    console.log(`📱 User: ${sampleUser.email}`);
    console.log(`📞 Call Logs: ${insertedCallLogs.length}`);
    console.log(`🚫 Blocked Numbers: ${insertedBlockedNumbers.length}`);
    console.log(`📈 Call Statistics:`, callStats[0] || 'No data');
    console.log(`📊 Block Statistics:`, blockStats[0] || 'No data');
    console.log('=====================================');

    // Test API endpoints
    console.log('\n🧪 Testing API Endpoints...');
    
    // Test analyze phone number
    const testAnalysis = await fetch('http://localhost:3000/api/call-protection/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: sampleUser._id,
        phoneNumber: '+1234567890',
        includeHistory: true
      })
    });
    
    if (testAnalysis.ok) {
      const analysisResult = await testAnalysis.json();
      console.log('✅ Phone number analysis test passed');
      console.log('📊 Analysis result:', analysisResult.data);
    } else {
      console.log('❌ Phone number analysis test failed');
    }

    // Test get statistics
    const testStats = await fetch(`http://localhost:3000/api/call-protection/statistics?userId=${sampleUser._id}`);
    
    if (testStats.ok) {
      const statsResult = await testStats.json();
      console.log('✅ Statistics test passed');
      console.log('📊 Statistics result:', statsResult.data);
    } else {
      console.log('❌ Statistics test failed');
    }

    console.log('\n🎉 Call Protection API is ready for use!');
    console.log('📚 API Documentation: backend/docs/call-protection-api.md');
    console.log('🔗 Health Check: http://localhost:3000/api/health');
    console.log('📊 Call Protection Endpoints: http://localhost:3000/api/call-protection/*');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the setup
if (require.main === module) {
  setupCallProtection();
}

module.exports = setupCallProtection;
