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

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password: password ? '***' : 'undefined' });
  
  // Accept ANY credentials for demo purposes
  if (email && password) {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: 'demo-user-' + Date.now(),
        email: email,
        name: email.split('@')[0] || 'Demo User',
        role: 'inspector'
      },
      accessToken: 'demo-access-token-' + Date.now()
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password are required',
      received: { email, hasPassword: !!password }
    });
  }
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

// Export for Vercel
export default app;