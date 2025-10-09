import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Common validation schemas
export const schemas = {
  // User registration/login
  userAuth: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).optional(),
    lastName: Joi.string().min(2).optional(),
  }),

  // Inspection report creation
  inspectionReport: Joi.object({
    clientFirstName: Joi.string().min(2).required(),
    clientLastName: Joi.string().min(2).required(),
    propertyAddress: Joi.string().min(5).required(),
    propertyType: Joi.string().valid('single_family', 'condo', 'townhouse', 'multi_family').required(),
    inspectionDate: Joi.date().iso().required(),
    notes: Joi.string().max(5000).optional(),
    estimatedDuration: Joi.number().integer().min(30).max(480).optional(),
  }),

  // File upload validation
  fileUpload: Joi.object({
    fileName: Joi.string().required(),
    fileSize: Joi.number().max(parseInt(process.env.MAX_FILE_SIZE || '10485760')).required(),
    mimeType: Joi.string().valid(...(process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf').split(',')).required(),
    section: Joi.string().optional(),
    room: Joi.string().optional(),
    description: Joi.string().max(1000).optional(),
  }),

  // Booking creation
  booking: Joi.object({
    inspectorId: Joi.string().uuid().required(),
    clientName: Joi.string().min(2).required(),
    clientEmail: Joi.string().email().required(),
    clientPhone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).optional(),
    propertyAddress: Joi.string().min(5).required(),
    bookingDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    bookingTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
    duration: Joi.number().integer().min(30).max(480).default(120),
    notes: Joi.string().max(1000).optional(),
  }),

  // Company settings
  companySettings: Joi.object({
    companyName: Joi.string().min(2).max(100).required(),
    tagline: Joi.string().max(200).optional(),
    primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    secondaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    address: Joi.string().max(500).optional(),
    phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).optional(),
    email: Joi.string().email().optional(),
    websiteUrl: Joi.string().uri().optional(),
    emailFromName: Joi.string().max(100).optional(),
    emailFromAddress: Joi.string().email().optional(),
    footerText: Joi.string().max(500).optional(),
  }),

  // Lead information
  lead: Joi.object({
    reportId: Joi.string().uuid().required(),
    defectType: Joi.string().required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    description: Joi.string().max(2000).required(),
    location: Joi.string().max(200).required(),
    estimatedCost: Joi.number().positive().optional(),
    urgency: Joi.string().valid('low', 'medium', 'high').default('medium'),
    contractorSpecialties: Joi.array().items(Joi.string()).min(1).required(),
  }),
};

// Validation middleware factory
export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return res.status(400).json({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
}

// Enhanced file validation with security checks
export function validateFile(file: Express.Multer.File): { valid: boolean; error?: string; warnings?: string[] } {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf,text/plain,text/csv').split(',');
  const warnings: string[] = [];

  // Basic size check
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // Check for empty files
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Empty files are not allowed',
    };
  }

  // MIME type validation
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Filename security checks
  const filename = file.originalname;
  
  // Check for suspicious filename patterns
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|com|scr|pif|vbs|js|jar|php|asp|aspx|jsp)$/i,
    /\.(sh|bash|zsh|fish|ps1|psm1|psd1)$/i,
    /\.(sql|db|sqlite|sqlite3)$/i,
    /\.(htaccess|htpasswd|ini|conf|config)$/i,
    /\.(log|tmp|temp|cache)$/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(filename)) {
      return {
        valid: false,
        error: `File type ${filename.split('.').pop()} is not allowed for security reasons`,
      };
    }
  }

  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      valid: false,
      error: 'Filename contains invalid characters',
    };
  }

  // Check filename length
  if (filename.length > 255) {
    return {
      valid: false,
      error: 'Filename too long (maximum 255 characters)',
    };
  }

  // Check for double extensions (potential security risk)
  const parts = filename.split('.');
  if (parts.length > 2) {
    warnings.push('File has multiple extensions - please verify this is intentional');
  }

  // Check for very large image files (potential DoS)
  if (file.mimetype.startsWith('image/') && file.size > 5 * 1024 * 1024) { // 5MB
    warnings.push('Large image file detected - consider compressing before upload');
  }

  return { 
    valid: true, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

// Additional file content validation
export async function validateFileContent(filePath: string, expectedMimeType: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    
    // Check file header signatures (magic numbers)
    const signatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
      'application/pdf': [0x25, 0x50, 0x44, 0x46],
    };

    const signature = signatures[expectedMimeType as keyof typeof signatures];
    if (signature) {
      const fileHeader = Array.from(buffer.slice(0, signature.length));
      const matches = signature.every((byte, index) => fileHeader[index] === byte);
      
      if (!matches) {
        return {
          valid: false,
          error: `File content does not match expected type ${expectedMimeType}`,
        };
      }
    }

    // Check for embedded scripts in images (basic check)
    if (expectedMimeType.startsWith('image/')) {
      const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
      const scriptPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
      ];
      
      for (const pattern of scriptPatterns) {
        if (pattern.test(content)) {
          return {
            valid: false,
            error: 'Image file contains suspicious content',
          };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `File content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}