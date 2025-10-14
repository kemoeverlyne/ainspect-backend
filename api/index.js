// Vercel serverless function entry point
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import passport from 'passport';
import { globalErrorHandler } from '../server/middleware/errorHandler.js';
import logger from '../server/utils/logger.js';
import { registerRoutes } from "../server/routes";
import { serveStatic, log } from "../server/vite";
import { initSentry, setupSentryErrorHandler } from "../server/sentry";
import { setupSwagger } from "../server/swagger";
import { validateEnvironment } from "../server/env-validation.js";
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
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
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
  }
  next();
});

// Initialize Sentry
initSentry(app);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Security middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 50
});
app.use(speedLimiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// CSRF protection
const csrfProtection = csrf();
app.use(csrfProtection);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse;

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

// Export the app for Vercel
export default async (req, res) => {
  try {
    const server = await registerRoutes(app);
    
    // Setup API documentation
    setupSwagger(app);

    // Setup Sentry error handler first
    setupSentryErrorHandler(app);

    // Use the production-grade error handler
    app.use(globalErrorHandler);

    // Handle the request
    app(req, res);
  } catch (error) {
    logger.error('Server startup failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
