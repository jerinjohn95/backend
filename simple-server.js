const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: true, // Reflect the request origin (for dev/testing including Flutter web on random port)
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DECEPTICALL API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Simple login endpoint for demo
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  // Simple demo authentication
  if (email === 'admin@decepticall.com' && password === 'admin123') {
    res.status(200).json({
      success: true,
      data: {
        token: 'demo_admin_token',
        user: {
          id: 'admin_001',
          fullName: 'Admin User',
          email: 'admin@decepticall.com',
          phone: '+1234567890',
          role: 'admin'
        }
      },
      message: 'Login successful'
    });
  } else if (email === 'user@decepticall.com' && password === 'user123') {
    res.status(200).json({
      success: true,
      data: {
        token: 'demo_user_token',
        user: {
          id: 'user_001',
          fullName: 'Demo User',
          email: 'user@decepticall.com',
          phone: '+1234567890',
          role: 'user'
        }
      },
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
});

// Simple signup endpoint
app.post('/api/signup', (req, res) => {
  const { fullName, email, phone, password } = req.body;
  
  console.log('Signup attempt:', { fullName, email, phone });
  
  res.status(201).json({
    success: true,
    data: {
      token: 'demo_new_user_token',
      user: {
        id: 'user_' + Date.now(),
        fullName,
        email,
        phone,
        role: 'user'
      }
    },
    message: 'User registered successfully'
  });
});

// Simple website check endpoint
app.post('/api/check-website', (req, res) => {
  const { url } = req.body;
  
  console.log('Website check:', { url });
  
  // Simple demo logic
  let isFake = false;
  let details = '';
  
  if (url.includes('bit.ly') || url.includes('tinyurl') || url.includes('goo.gl')) {
    isFake = true;
    details = 'Short URL service detected - potential phishing risk';
  } else if (url.includes('http://') && !url.includes('https://')) {
    isFake = true;
    details = 'Non-HTTPS connection detected - security risk';
  } else if (url.includes('phishing') || url.includes('fake')) {
    isFake = true;
    details = 'Suspicious keywords detected in URL';
  } else {
    isFake = false;
    details = 'Website appears to be safe';
  }
  
  res.status(200).json({
    success: true,
    data: {
      status: isFake ? 'Fake' : 'Safe',
      details,
      url,
      timestamp: new Date().toISOString()
    },
    message: 'Website check completed'
  });
});

// Simple reports endpoint
app.get('/api/reports/:userId', (req, res) => {
  const { userId } = req.params;
  
  console.log('Reports request for user:', userId);
  
  // Demo reports
  const reports = [
    {
      id: '1',
      type: 'Website',
      status: 'Fake',
      data: 'https://fake-bank.com',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '2',
      type: 'Website',
      status: 'Safe',
      data: 'https://google.com',
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ];
  
  res.status(200).json({
    success: true,
    data: {
      reports,
      statistics: {
        total: reports.length,
        fake: reports.filter((r) => r.status === 'Fake').length,
        safe: reports.filter((r) => r.status === 'Safe').length
      }
    },
    message: 'Reports retrieved successfully'
  });
});

// Simple users endpoint for admin
app.get('/api/users', (req, res) => {
  console.log('Users list request');
  
  const users = [
    {
      id: 'user_001',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      role: 'user',
      createdAt: new Date(Date.now() - 2592000000).toISOString()
    },
    {
      id: 'user_002',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      role: 'user',
      createdAt: new Date(Date.now() - 1728000000).toISOString()
    }
  ];
  
  res.status(200).json({
    success: true,
    data: users,
    message: 'Users retrieved successfully'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 8082;

app.listen(PORT, () => {
  console.log(`🚀 DECEPTICALL Simple Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Environment: development`);
  console.log(`\n📝 Demo Credentials:`);
  console.log(`   Admin: admin@decepticall.com / admin123`);
  console.log(`   User:  user@decepticall.com / user123`);
});
