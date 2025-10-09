# Secure File Upload System Documentation

## Overview

The secure file upload system provides comprehensive security measures for handling file uploads in the AInspect application. It includes file validation, content verification, rate limiting, and secure storage.

## Features

### 🔒 Security Features
- **File Type Validation**: Validates MIME types and file extensions
- **Content Verification**: Checks file headers (magic numbers) to ensure content matches declared type
- **Size Limits**: Configurable file size restrictions
- **Rate Limiting**: Prevents abuse with upload rate limits
- **Path Traversal Protection**: Prevents directory traversal attacks
- **Malicious File Detection**: Blocks executable files and suspicious extensions
- **Secure Storage**: Files stored in user-specific directories with UUID-based naming

### 📁 File Management
- **User Isolation**: Each user's files stored in separate directories
- **Secure Naming**: UUID-based filenames prevent conflicts and guessing
- **Cleanup**: Automatic cleanup of failed uploads
- **Audit Logging**: Comprehensive logging of upload activities

## Configuration

### Environment Variables

```bash
# File size limits
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Maximum files per request
MAX_UPLOAD_FILES=10

# Allowed file types (comma-separated)
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf,text/plain,text/csv

# Upload directory
UPLOAD_PATH=uploads/secure
```

### Default Settings

- **Max File Size**: 10MB
- **Max Files per Request**: 10
- **Allowed Types**: JPEG, PNG, WebP, PDF, TXT, CSV
- **Rate Limit**: 20 uploads per 15 minutes per IP

## API Endpoints

### Upload File
```http
POST /api/secure/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: files (multipart file upload)
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "uuid-here",
      "originalName": "document.pdf",
      "filename": "uuid-here_document.pdf",
      "size": 1024000,
      "mimetype": "application/pdf",
      "path": "/path/to/file",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "uploadedBy": "user-id",
      "url": "/api/secure/files/uuid-here"
    }
  ],
  "message": "1 file(s) uploaded successfully",
  "uploadId": "upload_timestamp_user-id"
}
```

### Download File
```http
GET /api/secure/files/:fileId
Authorization: Bearer <token>
```

**Response:** File stream with appropriate headers

### List Files
```http
GET /api/secure/files
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "uuid-here",
      "filename": "uuid-here_document.pdf",
      "size": 1024000,
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "url": "/api/secure/files/uuid-here"
    }
  ],
  "count": 1
}
```

### Delete File
```http
DELETE /api/secure/files/:fileId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "fileId": "uuid-here"
}
```

### Upload Status
```http
GET /api/secure/upload/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 5,
    "totalSize": 5242880,
    "maxFileSize": 10485760,
    "maxFiles": 10,
    "allowedTypes": ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain", "text/csv"]
  }
}
```

## Security Measures

### File Validation
1. **MIME Type Check**: Validates declared content type
2. **Extension Check**: Ensures file extension matches content
3. **Header Verification**: Checks file magic numbers
4. **Size Validation**: Enforces size limits
5. **Content Scanning**: Basic script detection in images

### Filename Security
- **Path Traversal Prevention**: Blocks `../` and directory separators
- **Extension Filtering**: Blocks executable and script extensions
- **Length Limits**: Maximum 255 characters
- **Character Sanitization**: Removes special characters

### Rate Limiting
- **Per-IP Limits**: 20 uploads per 15 minutes
- **Configurable**: Can be adjusted via environment variables
- **Graceful Degradation**: Returns 429 status with retry information

### Storage Security
- **User Isolation**: Files stored in user-specific directories
- **UUID Naming**: Prevents filename guessing and conflicts
- **Permission Setting**: Files stored with restricted permissions (644)
- **Cleanup**: Automatic removal of failed uploads

## Error Handling

### Common Error Codes
- `NO_FILES`: No files provided in upload
- `PROCESSING_FAILED`: Files could not be processed
- `UPLOAD_ERROR`: General upload error
- `FILE_NOT_FOUND`: File not found for download/delete
- `CONTENT_VALIDATION_FAILED`: File content validation failed
- `UPLOAD_RATE_LIMIT`: Rate limit exceeded

### Error Response Format
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "message": "Detailed error message"
}
```

## Testing

### Running Tests
```bash
# Install test dependencies
npm install --save-dev supertest form-data

# Run unit tests
npm test -- upload.test.ts

# Run integration test
node test-secure-upload.js
```

### Test Coverage
- File validation (size, type, content)
- Security checks (malicious files, path traversal)
- Rate limiting
- Upload/download functionality
- Error handling
- Cleanup procedures

## Usage Examples

### Frontend Integration
```javascript
// Upload file
const formData = new FormData();
formData.append('files', fileInput.files[0]);

const response = await fetch('/api/secure/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
if (result.success) {
  console.log('Upload successful:', result.files);
}
```

### Backend Integration
```typescript
import { secureUploadMiddleware } from './middleware/secureUpload';

// Use in route
app.post('/upload', 
  authenticateToken,
  ...secureUploadMiddleware,
  (req, res) => {
    const files = req.files;
    // Process uploaded files
  }
);
```

## Monitoring and Logging

### Audit Logs
All upload activities are logged with:
- Timestamp
- User ID
- IP address
- User agent
- File details
- Success/failure status

### Log Format
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "userId": "user-123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "endpoint": "/api/secure/upload",
  "method": "POST",
  "statusCode": 200,
  "fileCount": 1,
  "success": true
}
```

## Maintenance

### Cleanup Tasks
- **Orphaned Files**: Remove files not referenced in database
- **Expired Files**: Clean up old temporary files
- **Storage Monitoring**: Monitor disk usage and file counts

### Performance Optimization
- **Image Processing**: Consider adding image compression
- **CDN Integration**: Move files to CDN for better performance
- **Caching**: Implement file metadata caching

## Security Considerations

### Production Deployment
1. **HTTPS Only**: Ensure all upload endpoints use HTTPS
2. **File Scanning**: Consider integrating virus scanning service
3. **Storage Isolation**: Use separate storage for sensitive files
4. **Access Logs**: Monitor upload patterns for anomalies
5. **Backup Strategy**: Implement secure file backup procedures

### Compliance
- **Data Retention**: Implement file retention policies
- **Privacy**: Ensure user data protection compliance
- **Audit Trails**: Maintain comprehensive audit logs
- **Access Control**: Implement proper access controls

## Troubleshooting

### Common Issues
1. **Upload Failures**: Check file size and type restrictions
2. **Authentication Errors**: Verify token validity and permissions
3. **Storage Issues**: Check disk space and directory permissions
4. **Rate Limiting**: Monitor upload frequency and adjust limits

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=upload:*
```

This will provide detailed information about upload processing, validation, and storage operations.
