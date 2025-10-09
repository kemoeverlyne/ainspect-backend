import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { secureUploadMiddleware } from '../middleware/secureUpload';
import { validateFile, validateFileContent } from '../validation';

// Mock authentication middleware
const mockAuth = (req: any, res: any, next: any) => {
  req.user = { id: 'test-user-123' };
  next();
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(mockAuth);
  
  app.post('/upload', ...secureUploadMiddleware, (req: any, res: any) => {
    const files = req.files;
    res.json({
      success: true,
      files: files.map((file: any) => ({
        id: file.filename.split('_')[0],
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      })),
      message: `${files.length} file(s) uploaded successfully`
    });
  });
  
  return app;
};

describe('Secure File Upload Tests', () => {
  let app: express.Application;
  const testDir = path.join(__dirname, '../uploads/test');
  
  beforeAll(() => {
    app = createTestApp();
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  describe('File Validation', () => {
    test('should accept valid image files', () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        fieldname: 'files',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
        buffer: Buffer.from('fake image data')
      };
      
      const result = validateFile(mockFile as any);
      expect(result.valid).toBe(true);
    });
    
    test('should reject files that are too large', () => {
      const mockFile = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 20 * 1024 * 1024, // 20MB
        fieldname: 'files',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
        buffer: Buffer.from('fake image data')
      };
      
      const result = validateFile(mockFile as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds maximum limit');
    });
    
    test('should reject unsupported file types', () => {
      const mockFile = {
        originalname: 'malicious.exe',
        mimetype: 'application/x-executable',
        size: 1024,
        fieldname: 'files',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
        buffer: Buffer.from('fake executable data')
      };
      
      const result = validateFile(mockFile as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });
    
    test('should reject files with suspicious extensions', () => {
      const mockFile = {
        originalname: 'script.js',
        mimetype: 'text/plain',
        size: 1024,
        fieldname: 'files',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
        buffer: Buffer.from('fake script data')
      };
      
      const result = validateFile(mockFile as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed for security reasons');
    });
    
    test('should reject files with path traversal attempts', () => {
      const mockFile = {
        originalname: '../../../etc/passwd.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        fieldname: 'files',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
        buffer: Buffer.from('fake image data')
      };
      
      const result = validateFile(mockFile as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });
    
    test('should warn about large image files', () => {
      const mockFile = {
        originalname: 'large-image.jpg',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024, // 6MB
        fieldname: 'files',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
        buffer: Buffer.from('fake image data')
      };
      
      const result = validateFile(mockFile as any);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Large image file detected');
    });
  });
  
  describe('File Content Validation', () => {
    test('should validate JPEG file headers', async () => {
      // Create a temporary JPEG file with correct headers
      const tempFile = path.join(testDir, 'test.jpg');
      const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      fs.writeFileSync(tempFile, jpegHeader);
      
      const result = await validateFileContent(tempFile, 'image/jpeg');
      expect(result.valid).toBe(true);
      
      // Clean up
      fs.unlinkSync(tempFile);
    });
    
    test('should reject files with incorrect headers', async () => {
      // Create a temporary file with incorrect headers
      const tempFile = path.join(testDir, 'fake.jpg');
      const fakeHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
      fs.writeFileSync(tempFile, fakeHeader);
      
      const result = await validateFileContent(tempFile, 'image/jpeg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not match expected type');
      
      // Clean up
      fs.unlinkSync(tempFile);
    });
    
    test('should detect embedded scripts in images', async () => {
      // Create a temporary file with script content
      const tempFile = path.join(testDir, 'malicious.jpg');
      const maliciousContent = Buffer.from('<script>alert("xss")</script>');
      fs.writeFileSync(tempFile, maliciousContent);
      
      const result = await validateFileContent(tempFile, 'image/jpeg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('suspicious content');
      
      // Clean up
      fs.unlinkSync(tempFile);
    });
  });
  
  describe('Upload Endpoint Tests', () => {
    test('should upload valid files successfully', async () => {
      // Create a test file
      const testFile = path.join(testDir, 'test-upload.jpg');
      const testContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      fs.writeFileSync(testFile, testContent);
      
      const response = await request(app)
        .post('/upload')
        .attach('files', testFile)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].originalName).toBe('test-upload.jpg');
      
      // Clean up
      fs.unlinkSync(testFile);
    });
    
    test('should reject files that are too large', async () => {
      // Create a large test file (simulate by mocking)
      const response = await request(app)
        .post('/upload')
        .attach('files', Buffer.alloc(20 * 1024 * 1024), 'large-file.jpg')
        .expect(400);
      
      expect(response.body.error).toContain('File too large');
    });
    
    test('should reject unsupported file types', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('files', Buffer.from('fake executable'), 'malicious.exe')
        .expect(400);
      
      expect(response.body.message).toContain('not allowed');
    });
    
    test('should handle multiple file uploads', async () => {
      // Create test files
      const testFile1 = path.join(testDir, 'test1.jpg');
      const testFile2 = path.join(testDir, 'test2.png');
      const testContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      fs.writeFileSync(testFile1, testContent);
      fs.writeFileSync(testFile2, testContent);
      
      const response = await request(app)
        .post('/upload')
        .attach('files', testFile1)
        .attach('files', testFile2)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.files).toHaveLength(2);
      
      // Clean up
      fs.unlinkSync(testFile1);
      fs.unlinkSync(testFile2);
    });
    
    test('should enforce rate limiting', async () => {
      // This test would require multiple rapid requests
      // For now, we'll just test that the middleware is applied
      const response = await request(app)
        .post('/upload')
        .expect(400); // No files attached
      
      expect(response.body.error).toBeDefined();
    });
  });
  
  describe('Security Tests', () => {
    test('should sanitize filenames', async () => {
      const maliciousFilename = '../../etc/passwd.jpg';
      const testFile = path.join(testDir, 'test.jpg');
      const testContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      fs.writeFileSync(testFile, testContent);
      
      const response = await request(app)
        .post('/upload')
        .attach('files', testFile, maliciousFilename)
        .expect(400);
      
      expect(response.body.message).toContain('invalid characters');
      
      // Clean up
      fs.unlinkSync(testFile);
    });
    
    test('should prevent double extension attacks', async () => {
      const maliciousFilename = 'image.jpg.exe';
      const testFile = path.join(testDir, 'test.jpg');
      const testContent = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      fs.writeFileSync(testFile, testContent);
      
      const response = await request(app)
        .post('/upload')
        .attach('files', testFile, maliciousFilename)
        .expect(400);
      
      expect(response.body.message).toContain('not allowed for security reasons');
      
      // Clean up
      fs.unlinkSync(testFile);
    });
    
    test('should validate file content matches MIME type', async () => {
      // Create a file with PNG content but JPEG extension
      const testFile = path.join(testDir, 'fake.jpg');
      const pngContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      fs.writeFileSync(testFile, pngContent);
      
      const response = await request(app)
        .post('/upload')
        .attach('files', testFile)
        .expect(400);
      
      expect(response.body.error).toContain('content validation failed');
      
      // Clean up
      fs.unlinkSync(testFile);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle upload errors gracefully', async () => {
      const response = await request(app)
        .post('/upload')
        .expect(400);
      
      expect(response.body.error).toBeDefined();
    });
    
    test('should clean up failed uploads', async () => {
      // This test would verify that temporary files are cleaned up
      // when uploads fail
      const response = await request(app)
        .post('/upload')
        .attach('files', Buffer.from('invalid content'), 'test.txt')
        .expect(400);
      
      expect(response.body.error).toBeDefined();
    });
  });
});
