import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { validateFile, validateFileContent } from '../validation';

/**
 * Secure File Upload Middleware
 * 
 * Provides comprehensive security for file uploads including:
 * - Rate limiting
 * - File size limits
 * - File type validation
 * - Content validation
 * - Secure storage
 * - Virus scanning simulation
 * - Access control
 */

// Rate limiting for uploads
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 uploads per windowMs
  message: {
    error: 'Too many upload attempts, please try again later',
    code: 'UPLOAD_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced multer configuration
const createSecureStorage = (uploadPath: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Create user-specific directory
      const userId = (req as any).user?.id || 'anonymous';
      const userDir = path.join(uploadPath, userId);
      
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      
      cb(null, userDir);
    },
    filename: (req, file, cb) => {
      // Generate secure filename
      const fileId = crypto.randomUUID();
      const ext = path.extname(file.originalname);
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 100); // Limit filename length
      
      const secureFilename = `${fileId}_${sanitizedName}${ext}`;
      cb(null, secureFilename);
    }
  });
};

// Enhanced file filter with security checks
const createSecureFileFilter = () => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        return cb(new Error(validation.error || 'File validation failed'));
      }
      
      // Log warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn(`[UPLOAD] Warnings for file ${file.originalname}:`, validation.warnings);
      }
      
      cb(null, true);
    } catch (error) {
      cb(new Error(`File validation error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
};

// Create secure upload middleware
export const createSecureUpload = (options: {
  maxFileSize?: number;
  maxFiles?: number;
  uploadPath?: string;
  allowedTypes?: string[];
}) => {
  const {
    maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    maxFiles = 10,
    uploadPath = 'uploads/secure',
    allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf,text/plain,text/csv').split(',')
  } = options;

  // Ensure upload directory exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = createSecureStorage(uploadPath);
  const fileFilter = createSecureFileFilter();

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      fieldSize: 1024 * 1024, // 1MB for field data
    },
  });
};

// Content validation middleware
export const validateUploadContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];
    const validationPromises = files.map(async (file: Express.Multer.File) => {
      const contentValidation = await validateFileContent(file.path, file.mimetype);
      if (!contentValidation.valid) {
        // Clean up the file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw new Error(contentValidation.error);
      }
      return file;
    });

    await Promise.all(validationPromises);
    next();
  } catch (error) {
    console.error('[UPLOAD] Content validation error:', error);
    return res.status(400).json({
      error: 'File content validation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'CONTENT_VALIDATION_FAILED'
    });
  }
};

// Cleanup middleware for failed uploads
export const cleanupFailedUploads = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If response indicates failure, clean up uploaded files
    if (res.statusCode >= 400 && req.files) {
      const files = Array.isArray(req.files) ? req.files : [req.files];
      files.forEach((file: Express.Multer.File) => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
            console.log(`[UPLOAD] Cleaned up failed upload: ${file.path}`);
          } catch (error) {
            console.error(`[UPLOAD] Failed to cleanup file ${file.path}:`, error);
          }
        }
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Security headers for upload endpoints
export const addUploadSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent caching of upload responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
};

// Audit logging for uploads
export const logUploadActivity = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    const userId = (req as any).user?.id || 'anonymous';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    const logData = {
      timestamp: new Date().toISOString(),
      userId,
      ip,
      userAgent,
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      fileCount: req.files ? (Array.isArray(req.files) ? req.files.length : 1) : 0,
      success: res.statusCode < 400
    };
    
    console.log('[UPLOAD_AUDIT]', JSON.stringify(logData));
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Default secure upload configuration
export const secureUpload = createSecureUpload({
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  maxFiles: parseInt(process.env.MAX_UPLOAD_FILES || '10'),
  uploadPath: 'uploads/secure',
  allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf,text/plain,text/csv').split(',')
});

// Complete secure upload middleware stack
export const secureUploadMiddleware = [
  uploadRateLimit,
  addUploadSecurityHeaders,
  logUploadActivity,
  secureUpload.array('files', parseInt(process.env.MAX_UPLOAD_FILES || '10')),
  validateUploadContent,
  cleanupFailedUploads
];
