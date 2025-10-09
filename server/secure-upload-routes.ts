import { Express, Request, Response } from 'express';
import { secureUploadMiddleware } from './middleware/secureUpload';
import { authenticateToken } from './auth';
import path from 'path';
import fs from 'fs';

/**
 * Secure Upload Routes
 * 
 * Provides secure file upload endpoints with comprehensive validation,
 * rate limiting, and security measures.
 */

export function registerSecureUploadRoutes(app: Express) {
  // Secure file upload endpoint
  app.post('/api/secure/upload', 
    authenticateToken,
    ...secureUploadMiddleware,
    async (req: Request, res: Response) => {
      try {
        const files = req.files as Express.Multer.File[];
        const userId = (req as any).user.id;
        
        if (!files || files.length === 0) {
          return res.status(400).json({
            error: 'No files uploaded',
            code: 'NO_FILES'
          });
        }

        const uploadedFiles = [];
        
        for (const file of files) {
          try {
            // Generate file metadata
            const fileMetadata = {
              id: file.filename.split('_')[0],
              originalName: file.originalname,
              filename: file.filename,
              size: file.size,
              mimetype: file.mimetype,
              path: file.path,
              uploadedAt: new Date().toISOString(),
              uploadedBy: userId,
              url: `/api/secure/files/${file.filename.split('_')[0]}`
            };
            
            uploadedFiles.push(fileMetadata);
            
            console.log(`[SECURE_UPLOAD] File uploaded successfully: ${fileMetadata.id}`);
          } catch (error) {
            console.error(`[SECURE_UPLOAD] Error processing file ${file.originalname}:`, error);
            // Clean up the file
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          }
        }

        if (uploadedFiles.length === 0) {
          return res.status(400).json({
            error: 'No files could be processed',
            code: 'PROCESSING_FAILED'
          });
        }

        res.json({
          success: true,
          files: uploadedFiles,
          message: `${uploadedFiles.length} file(s) uploaded successfully`,
          uploadId: `upload_${Date.now()}_${userId}`
        });

      } catch (error) {
        console.error('[SECURE_UPLOAD] Upload error:', error);
        res.status(500).json({
          error: 'Upload failed',
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Secure file download endpoint
  app.get('/api/secure/files/:fileId', 
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { fileId } = req.params;
        const userId = (req as any).user.id;
        
        // Find the file in the secure upload directory
        const secureDir = path.join(process.cwd(), 'uploads', 'secure', userId);
        
        if (!fs.existsSync(secureDir)) {
          return res.status(404).json({
            error: 'File not found',
            code: 'FILE_NOT_FOUND'
          });
        }

        // Look for files with the matching ID
        const files = fs.readdirSync(secureDir);
        const targetFile = files.find(file => file.startsWith(fileId));
        
        if (!targetFile) {
          return res.status(404).json({
            error: 'File not found',
            code: 'FILE_NOT_FOUND'
          });
        }

        const filePath = path.join(secureDir, targetFile);
        
        // Verify file exists and is accessible
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({
            error: 'File not found',
            code: 'FILE_NOT_FOUND'
          });
        }

        // Get file stats
        const stats = fs.statSync(filePath);
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${targetFile}"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('error', (error) => {
          console.error('[SECURE_UPLOAD] File stream error:', error);
          if (!res.headersSent) {
            res.status(500).json({
              error: 'File download failed',
              code: 'DOWNLOAD_ERROR'
            });
          }
        });

      } catch (error) {
        console.error('[SECURE_UPLOAD] Download error:', error);
        res.status(500).json({
          error: 'Download failed',
          code: 'DOWNLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // File deletion endpoint
  app.delete('/api/secure/files/:fileId', 
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { fileId } = req.params;
        const userId = (req as any).user.id;
        
        // Find the file in the secure upload directory
        const secureDir = path.join(process.cwd(), 'uploads', 'secure', userId);
        
        if (!fs.existsSync(secureDir)) {
          return res.status(404).json({
            error: 'File not found',
            code: 'FILE_NOT_FOUND'
          });
        }

        // Look for files with the matching ID
        const files = fs.readdirSync(secureDir);
        const targetFile = files.find(file => file.startsWith(fileId));
        
        if (!targetFile) {
          return res.status(404).json({
            error: 'File not found',
            code: 'FILE_NOT_FOUND'
          });
        }

        const filePath = path.join(secureDir, targetFile);
        
        // Delete the file
        fs.unlinkSync(filePath);
        
        console.log(`[SECURE_UPLOAD] File deleted: ${fileId}`);
        
        res.json({
          success: true,
          message: 'File deleted successfully',
          fileId
        });

      } catch (error) {
        console.error('[SECURE_UPLOAD] Delete error:', error);
        res.status(500).json({
          error: 'Delete failed',
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // List user's uploaded files
  app.get('/api/secure/files', 
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const secureDir = path.join(process.cwd(), 'uploads', 'secure', userId);
        
        if (!fs.existsSync(secureDir)) {
          return res.json({
            success: true,
            files: [],
            message: 'No files found'
          });
        }

        const files = fs.readdirSync(secureDir);
        const fileList = files.map(filename => {
          const filePath = path.join(secureDir, filename);
          const stats = fs.statSync(filePath);
          
          return {
            id: filename.split('_')[0],
            filename,
            size: stats.size,
            uploadedAt: stats.birthtime.toISOString(),
            url: `/api/secure/files/${filename.split('_')[0]}`
          };
        });

        res.json({
          success: true,
          files: fileList,
          count: fileList.length
        });

      } catch (error) {
        console.error('[SECURE_UPLOAD] List files error:', error);
        res.status(500).json({
          error: 'Failed to list files',
          code: 'LIST_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Upload status endpoint
  app.get('/api/secure/upload/status', 
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const secureDir = path.join(process.cwd(), 'uploads', 'secure', userId);
        
        let totalFiles = 0;
        let totalSize = 0;
        
        if (fs.existsSync(secureDir)) {
          const files = fs.readdirSync(secureDir);
          totalFiles = files.length;
          
          for (const file of files) {
            const filePath = path.join(secureDir, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          }
        }

        res.json({
          success: true,
          stats: {
            totalFiles,
            totalSize,
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
            maxFiles: parseInt(process.env.MAX_UPLOAD_FILES || '10'),
            allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf,text/plain,text/csv').split(',')
          }
        });

      } catch (error) {
        console.error('[SECURE_UPLOAD] Status error:', error);
        res.status(500).json({
          error: 'Failed to get upload status',
          code: 'STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
}
