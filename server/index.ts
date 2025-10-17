import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import passport from 'passport';
import { globalErrorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import { initSentry, setupSentryErrorHandler } from "./sentry";
import { setupSwagger } from "./swagger";
import { validateEnvironment } from "./env-validation.js";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import csrf from "csrf";
import cors from "cors";
import cookieParser from 'cookie-parser';
import session from 'express-session';

// Validate environment variables before starting
validateEnvironment();

// Handle unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});


const app = express();

// Trust proxy for proper rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Add request debugging middleware
app.use((req, res, next) => {
  if (req.path.includes('/inspectors/') && req.path.includes('/bookings')) {
    console.log('[REQUEST DEBUG]', {
      method: req.method,
      path: req.path,
      headers: {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'user-agent': req.headers['user-agent']
      },
      url: req.url
    });
    
    // Log raw body data
    let bodyData = '';
    req.on('data', (chunk) => {
      bodyData += chunk.toString();
    });
    
    req.on('end', () => {
      console.log('[REQUEST BODY DEBUG]', {
        bodyLength: bodyData.length,
        bodyPreview: bodyData.substring(0, 200),
        bodyValid: bodyData.length > 0
      });
    });
  }
  next();
});

// Initialize Sentry for error tracking
initSentry(app);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Security middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log('[CORS DEBUG] Request origin:', origin);
    console.log('[CORS DEBUG] NODE_ENV:', process.env.NODE_ENV);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('[CORS DEBUG] Allowing request with no origin');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'https://test-version-frontend.vercel.app',
      'https://test-version-frontend-git-main-ainspect.vercel.app',
      'https://ainspect-frontend-164593694555.us-central1.run.app',
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];
    
    console.log('[CORS DEBUG] Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log('[CORS DEBUG] Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('[CORS DEBUG] Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-csrf-token']
}));

// Manual OPTIONS handler for preflight requests
app.options('*', (req, res) => {
  console.log('[CORS OPTIONS] Handling preflight request for:', req.path);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,x-csrf-token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Rate limiting - DISABLED FOR DEVELOPMENT
// const generalLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: parseInt(process.env.GENERAL_RATE_LIMIT || '1000'),
//   message: 'Too many requests, please try again later.'
// });

// const aiLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour  
//   max: parseInt(process.env.API_RATE_LIMIT || '100'),
//   message: 'Too many AI requests, please try again later.'
// });

// // Enhanced rate limiting for authentication endpoints to prevent brute force attacks
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 login requests per windowMs
//   message: 'Too many login attempts, please try again later.',
//   skipSuccessfulRequests: true // don't count successful requests
// });

// const authSlowDown = slowDown({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   delayAfter: 2, // allow 2 requests per 15 minutes without delay
//   delayMs: (used, req) => Math.min((used - req.slowDown.limit) * 500, 20000), // progressive delay: 500ms per attempt, max 20s
//   maxDelayMs: 20000, // max delay of 20 seconds
//   validate: { delayMs: false } // disable deprecation warning
// });

// app.use('/api', generalLimiter);
// app.use('/api/ai', aiLimiter);
// app.use('/api/analysis', aiLimiter);

// Apply enhanced security to authentication endpoints - DISABLED FOR DEVELOPMENT
// app.use('/api/auth/login', authLimiter, authSlowDown);
// app.use('/api/auth/super-admin-login', authLimiter, authSlowDown);
// app.use('/api/auth/signup', authLimiter, authSlowDown);
// app.use('/api/leadgen/login', authLimiter, authSlowDown);

app.use(express.json({ limit: '100mb' })); // Increased for large report saves
app.use(express.urlencoded({ extended: false, limit: '100mb' })); // Added limit for URL encoded data

// Initialize cookie parser with signing secret (needed for CSRF)
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}
app.use(cookieParser(SESSION_SECRET));

// CSRF Protection
const tokens = new csrf();

// CSRF token endpoint for frontend to get tokens
app.get('/api/csrf-token', (req, res) => {
  const secret = tokens.secretSync();
  const token = tokens.create(secret);
  
  // Set the secret in a secure, httpOnly cookie
  res.cookie('_csrf_secret', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    signed: true
  });
  
  res.json({ csrfToken: token });
});

// CSRF protection middleware for state-changing operations
const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for specific endpoints that handle their own security
  // Note: Since middleware is mounted at '/api', req.path doesn't include '/api'
  const skipPaths = [
    '/csrf-token',
    '/auth/login',
    '/auth/super-admin-login',
    '/auth/signup',
    '/auth/logout',
    '/leadgen/login',
    '/generate-pdf', // PDF generation endpoint
    '/generate-pdf-playwright', // Alternative PDF generation endpoint
    // Onboarding routes are protected by authentication middleware
    '/onboarding/company',
    '/onboarding/logo',
    '/onboarding/operations',
    '/onboarding/invite',
    '/onboarding/complete',
    '/onboarding/branches',
    // Scheduling endpoints for testing
    '/inspectors/super_admin_001/bookings',
    '/inspectors/super_admin_001/availability',
    // Reports endpoint for testing
    '/reports/save',
    // Simple booking endpoint (bypasses problematic middleware)
    '/simple-booking',
    // AI Photo Analysis endpoint (bypasses CSRF for development)
    '/inspection/ai/bulk-analyze-photos',
    // AI Assistant Chat endpoint (bypasses CSRF for development)
    '/ai-assistant/chat',
    // A/B Testing endpoints (bypasses CSRF for development)
    '/inspection/ai/ab-test-photo',
    '/inspection/ai/ab-test-results',
    // TREC Development endpoint (bypasses CSRF for testing)
    '/trec/inspections/dev-create'
  ];
  
  // Debug logging
  console.log('[CSRF] Checking path:', req.path, 'Method:', req.method);
  console.log('[CSRF] Skip paths:', skipPaths);
  
  // Check exact matches first
  if (skipPaths.some(path => req.path === path)) {
    console.log('[CSRF] Skipping CSRF for path:', req.path);
    return next();
  }
  
  // Check wildcard patterns for inspector endpoints
  if (req.path.match(/^\/inspectors\/[^\/]+\/(bookings|availability)$/)) {
    console.log('[CSRF] Skipping CSRF for inspector endpoint:', req.path);
    return next();
  }
  
  // Additional check for any inspector booking/availability endpoint
  if (req.path.includes('/inspectors/') && (req.path.includes('/bookings') || req.path.includes('/availability'))) {
    console.log('[CSRF] Skipping CSRF for inspector endpoint (fallback):', req.path);
    return next();
  }
  
  const token = req.headers['x-csrf-token'] as string || req.body.csrfToken;
  const secret = req.signedCookies?._csrf_secret;
  
  if (!token || !secret) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }
  
  if (!tokens.verify(secret, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
};

// Apply CSRF protection to API routes (except GET requests)
app.use('/api', csrfProtection);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Setup API documentation
    setupSwagger(app);

    // Setup Sentry error handler first
    setupSentryErrorHandler(app);

    // Use the production-grade error handler
    app.use(globalErrorHandler);

    // Since frontend and backend are separated, we don't need Vite setup
    // The frontend runs independently on its own server
    log("Backend server running independently - frontend should be running separately");

    // For Vercel serverless functions, don't start the server
    if (process.env.VERCEL) {
      log("Running in Vercel serverless mode - app ready");
      return;
    }

    // Cloud Run: listen on the provided PORT and 0.0.0.0
    const port = Number(process.env.PORT || 8080);
    const host = "0.0.0.0";
    server.listen(port, host, () => {
      log(`serving on ${host}:${port}`);
    });
  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
})().catch((error) => {
  logger.error('Unhandled promise rejection during server startup:', error);
  process.exit(1);
});

// Export the app for Vercel serverless functions
export default app;
