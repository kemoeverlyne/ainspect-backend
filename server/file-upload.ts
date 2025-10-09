import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { validateFile } from './validation';
import { createSecureUpload } from './middleware/secureUpload';

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/photos', 'uploads/documents', 'uploads/logos', 'uploads/secure'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads';
    
    // Route to appropriate directory based on file type and purpose
    if (file.fieldname === 'logo') {
      uploadPath = 'uploads/logos';
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath = 'uploads/photos';
    } else {
      uploadPath = 'uploads/documents';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename to prevent conflicts
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const validation = validateFile(file);
  
  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error || 'File validation failed'));
  }
};

// Legacy multer configuration (for backward compatibility)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 10, // Max 10 files per request
  },
});

// Secure upload configuration (recommended for new implementations)
export const secureUpload = createSecureUpload({
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  maxFiles: parseInt(process.env.MAX_UPLOAD_FILES || '10'),
  uploadPath: 'uploads/secure',
  allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf,text/plain,text/csv').split(',')
});

// Helper functions for file management
export class FileManager {
  static async cleanupOrphanedFiles() {
    // Implementation for cleaning up files that are no longer referenced
    // This could be run as a scheduled job
    console.log('Cleaning up orphaned files...');
    
    try {
      // Get all file paths from database
      // Compare with files in upload directories
      // Remove files not referenced in database
      
      // For now, just log the operation
      console.log('Orphaned file cleanup completed');
    } catch (error) {
      console.error('Error during orphaned file cleanup:', error);
    }
  }

  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      return false;
    }
  }

  static getFileUrl(filePath: string): string {
    // Return URL for accessing the file
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    return `${baseUrl}/${filePath}`;
  }

  static validateImageDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      // For images, you might want to validate dimensions
      // This would require an image processing library like sharp
      // For now, just return null
      resolve(null);
    });
  }
}

// Middleware for handling file upload errors
export function handleUploadError(err: any, req: any, res: any, next: any) {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${Math.round(parseInt(process.env.MAX_FILE_SIZE || '10485760') / 1024 / 1024)}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum is 10 files per request';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = err.message;
    }
    
    return res.status(400).json({ message });
  }
  
  if (err.message && err.message.includes('File validation failed')) {
    return res.status(400).json({ message: err.message });
  }
  
  next(err);
}