// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// Basic middleware
app.use(cors({
  origin: [
    'https://ainspect-frontend-164593694555.us-central1.run.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AInspect Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Demo users for authentication
const DEMO_USERS = [
  {
    id: 'user-1',
    email: 'inspector@ainspect.com',
    password: 'password123',
    name: 'John Inspector',
    role: 'inspector'
  },
  {
    id: 'user-2', 
    email: 'admin@ainspect.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: 'user-3',
    email: 'demo@ainspect.com', 
    password: 'demo123',
    name: 'Demo User',
    role: 'inspector'
  }
];

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password: password ? '***' : 'undefined' });
  
  // Validate credentials against demo users
  const user = DEMO_USERS.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken: 'access-token-' + user.id + '-' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      received: { email, hasPassword: !!password }
    });
  }
});

// Signup endpoint
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  
  console.log('Signup attempt:', { email, name, hasPassword: !!password });
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // For demo purposes, accept any signup
  res.json({
    success: true,
    message: 'Account created successfully',
    user: {
      id: 'demo-user-' + Date.now(),
      email: email,
      name: name || email.split('@')[0] || 'New User',
      role: 'inspector'
    },
    accessToken: 'demo-access-token-' + Date.now()
  });
});

// Auth endpoints
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 'demo-user-1',
      email: 'demo@ainspect.com',
      name: 'Demo User',
      role: 'inspector'
    }
  });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Additional endpoints that might be needed
app.get('/api/dashboard/inspections', (req, res) => {
  res.json({
    inspections: [],
    message: 'Demo dashboard data'
  });
});

app.get('/api/reports', (req, res) => {
  res.json({
    reports: [],
    message: 'Demo reports data'
  });
});

// TREC Inspection endpoints
app.get('/api/trec/inspections', (req, res) => {
  res.json({
    inspections: [],
    message: 'Demo TREC inspections'
  });
});

app.get('/api/trec/inspections/:id', (req, res) => {
  res.json({
    id: req.params.id,
    clientName: 'Demo Client',
    propertyAddress: '123 Demo Street',
    inspectionDate: new Date().toISOString(),
    inspectorName: 'Demo Inspector',
    trecLicenseNumber: 'TREC-12345',
    status: 'completed',
    message: 'Demo TREC inspection'
  });
});

// Reports endpoints
app.get('/api/reports/:id', (req, res) => {
  res.json({
    id: req.params.id,
    clientName: 'Demo Client',
    propertyAddress: '123 Demo Street',
    inspectionDate: new Date().toISOString(),
    inspectorName: 'Demo Inspector',
    status: 'completed',
    message: 'Demo inspection report'
  });
});

app.get('/api/reports/portal/:id', (req, res) => {
  res.json({
    id: req.params.id,
    portalData: {
      clientName: 'Demo Client',
      propertyAddress: '123 Demo Street',
      inspectionDate: new Date().toISOString(),
      inspectorName: 'Demo Inspector',
      status: 'completed'
    },
    message: 'Demo portal data'
  });
});

// Settings endpoints
app.get('/api/settings/company', (req, res) => {
  res.json({
    companyName: 'Demo Inspection Company',
    phone: '(555) 123-4567',
    email: 'info@demo.com',
    website: 'www.demo.com',
    address: '123 Company Street',
    logoUrl: null,
    message: 'Demo company settings'
  });
});

// AI endpoints
app.post('/api/inspection/ai/ab-test-photo', (req, res) => {
  res.json({
    success: true,
    message: 'Demo AI photo analysis',
    results: {
      anthropic: { confidence: 0.85, responseTime: 1200 },
      openai: { confidence: 0.82, responseTime: 1100 }
    }
  });
});

app.get('/api/inspection/ai/ab-test-results', (req, res) => {
  res.json({
    results: [],
    message: 'Demo AI test results'
  });
});

// Catch-all for missing endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    message: 'This endpoint is not implemented in the demo backend'
  });
});

// Export for Vercel
export default app;