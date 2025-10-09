import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function globalErrorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    statusCode,
    timestamp: new Date().toISOString(),
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      message: statusCode === 500 ? 'Internal Server Error' : message,
      ...(statusCode !== 500 && { details: err.message }),
    });
  } else {
    res.status(statusCode).json({
      message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });
  }
}

export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function createError(message: string, statusCode: number = 500): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', { reason, stack: reason instanceof Error ? reason.stack : 'No stack' });
  // Only log in development, don't crash
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});