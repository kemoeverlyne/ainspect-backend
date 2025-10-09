import winston from 'winston';
import { db } from './db';
import { systemLogs, systemMetrics } from '@shared/schema';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ainspect' },
  transports: [
    // Write errors to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write logs to file
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Enhanced logger with database persistence
class DatabaseLogger {
  private winston: winston.Logger;

  constructor() {
    this.winston = logger;
  }

  async log(level: 'error' | 'warn' | 'info' | 'debug', message: string, meta: any = {}) {
    try {
      // Log to Winston first
      this.winston.log(level, message, meta);

      // Persist to database
      await db.insert(systemLogs).values({
        level,
        message,
        source: meta.source || 'unknown',
        userId: meta.userId,
        requestId: meta.requestId,
        method: meta.method,
        url: meta.url,
        statusCode: meta.statusCode,
        duration: meta.duration,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: meta.metadata ? JSON.stringify(meta.metadata) : null,
        stackTrace: meta.stack,
      });
    } catch (error) {
      // Fallback to console if database fails
      console.error('Failed to log to database:', error);
      this.winston.error('Database logging failed', { originalMessage: message, meta, error: error.message });
    }
  }

  async error(message: string, meta: any = {}) {
    await this.log('error', message, { ...meta, source: meta.source || 'error' });
  }

  async warn(message: string, meta: any = {}) {
    await this.log('warn', message, { ...meta, source: meta.source || 'warning' });
  }

  async info(message: string, meta: any = {}) {
    await this.log('info', message, { ...meta, source: meta.source || 'info' });
  }

  async debug(message: string, meta: any = {}) {
    await this.log('debug', message, { ...meta, source: meta.source || 'debug' });
  }

  // API request logging middleware
  logRequest(req: any, res: any, duration: number) {
    const meta = {
      source: 'api',
      userId: req.user?.id,
      requestId: req.headers['x-request-id'],
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query,
        params: req.params
      }
    };

    if (res.statusCode >= 400) {
      this.error(`API Error: ${req.method} ${req.originalUrl}`, meta);
    } else {
      this.info(`API Request: ${req.method} ${req.originalUrl}`, meta);
    }
  }

  // Job logging
  async logJob(jobName: string, status: 'started' | 'completed' | 'failed', meta: any = {}) {
    const message = `Job ${jobName} ${status}`;
    const logMeta = {
      source: 'job-queue',
      metadata: meta
    };

    if (status === 'failed') {
      await this.error(message, logMeta);
    } else {
      await this.info(message, logMeta);
    }
  }

  // Record system metrics
  async recordMetric(metricName: string, value: number, unit: string, tags: any = {}) {
    try {
      await db.insert(systemMetrics).values({
        metricName,
        value,
        unit,
        tags: JSON.stringify(tags)
      });
    } catch (error) {
      this.winston.error('Failed to record metric', { metricName, value, unit, tags, error: error.message });
    }
  }
}

export const appLogger = new DatabaseLogger();
export default logger;

// Request logging middleware
export function requestLoggingMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  // Generate request ID if not present
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    appLogger.logRequest(req, res, duration);
  });

  next();
}

// Error handling middleware
export function errorLoggingMiddleware(error: any, req: any, res: any, next: any) {
  appLogger.error('Unhandled API Error', {
    source: 'api',
    userId: req.user?.id,
    requestId: req.headers['x-request-id'],
    method: req.method,
    url: req.originalUrl,
    stack: error.stack,
    metadata: {
      body: req.body,
      query: req.query,
      params: req.params
    }
  });

  next(error);
}