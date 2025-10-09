import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple fetch polyfill for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testSecureUpload() {
  console.log('🔒 Testing Secure File Upload System...\n');
  
  const BASE_URL = 'http://localhost:5000';
  let authToken = null;
  
  try {
    // Step 1: Login to get authentication token
    console.log('1. Authenticating...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123'
        })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed, trying to create test user...');
      
      // Try to create a test user
      const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123',
          name: 'Test User',
          tos: true,
          privacy: true,
          optInNonFlagged: false,
          digitalSignature: 'Test User',
          signatureDate: new Date().toISOString()
        })
      });
      
      if (!signupResponse.ok) {
        const signupError = await signupResponse.text();
        console.log('❌ Signup failed:', signupError);
        return;
      }
      
      console.log('✅ Test user created successfully');
      
      // Try login again
      const retryLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123'
        })
      });
      
      if (!retryLoginResponse.ok) {
        console.log('❌ Login still failed after signup');
        return;
      }
      
      const loginData = await retryLoginResponse.json();
      authToken = loginData.accessToken;
    } else {
      const loginData = await loginResponse.json();
      authToken = loginData.accessToken;
    }
    
    console.log('✅ Authentication successful\n');
    
    // Step 2: Test upload status endpoint
    console.log('2. Checking upload status...');
    const statusResponse = await fetch(`${BASE_URL}/api/secure/upload/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Upload status:', JSON.stringify(statusData, null, 2));
    } else {
      console.log('❌ Upload status check failed');
    }
    
    // Step 3: Create test files
    console.log('\n3. Creating test files...');
    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create a valid JPEG file
    const validJpegPath = path.join(testDir, 'valid-test.jpg');
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    fs.writeFileSync(validJpegPath, jpegHeader);
    
    // Create a malicious file (executable)
    const maliciousPath = path.join(testDir, 'malicious.exe');
    fs.writeFileSync(maliciousPath, Buffer.from('fake executable content'));
    
    // Create a large file
    const largeFilePath = path.join(testDir, 'large-file.jpg');
    const largeContent = Buffer.alloc(15 * 1024 * 1024); // 15MB
    fs.writeFileSync(largeFilePath, largeContent);
    
    console.log('✅ Test files created');
    
    // Step 4: Test valid file upload
    console.log('\n4. Testing valid file upload...');
    const formData = new FormData();
    formData.append('files', fs.createReadStream(validJpegPath));
    
    const uploadResponse = await fetch(`${BASE_URL}/api/secure/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Valid file upload successful:', JSON.stringify(uploadData, null, 2));
      
      // Test file download
      if (uploadData.files && uploadData.files.length > 0) {
        const fileId = uploadData.files[0].id;
        console.log(`\n5. Testing file download for ID: ${fileId}`);
        
        const downloadResponse = await fetch(`${BASE_URL}/api/secure/files/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (downloadResponse.ok) {
          console.log('✅ File download successful');
        } else {
          console.log('❌ File download failed');
        }
      }
    } else {
      const uploadError = await uploadResponse.text();
      console.log('❌ Valid file upload failed:', uploadError);
    }
    
    // Step 5: Test malicious file rejection
    console.log('\n6. Testing malicious file rejection...');
    const maliciousFormData = new FormData();
    maliciousFormData.append('files', fs.createReadStream(maliciousPath));
    
    const maliciousResponse = await fetch(`${BASE_URL}/api/secure/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...maliciousFormData.getHeaders()
      },
      body: maliciousFormData
    });
    
    if (!maliciousResponse.ok) {
      const maliciousError = await maliciousResponse.text();
      console.log('✅ Malicious file correctly rejected:', maliciousError);
    } else {
      console.log('❌ Malicious file was not rejected!');
    }
    
    // Step 6: Test large file rejection
    console.log('\n7. Testing large file rejection...');
    const largeFormData = new FormData();
    largeFormData.append('files', fs.createReadStream(largeFilePath));
    
    const largeResponse = await fetch(`${BASE_URL}/api/secure/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...largeFormData.getHeaders()
      },
      body: largeFormData
    });
    
    if (!largeResponse.ok) {
      const largeError = await largeResponse.text();
      console.log('✅ Large file correctly rejected:', largeError);
    } else {
      console.log('❌ Large file was not rejected!');
    }
    
    // Step 7: Test file listing
    console.log('\n8. Testing file listing...');
    const listResponse = await fetch(`${BASE_URL}/api/secure/files`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ File listing successful:', JSON.stringify(listData, null, 2));
    } else {
      console.log('❌ File listing failed');
    }
    
    // Step 8: Test rate limiting
    console.log('\n9. Testing rate limiting...');
    let rateLimitHit = false;
    for (let i = 0; i < 25; i++) {
      const rateLimitResponse = await fetch(`${BASE_URL}/api/secure/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (rateLimitResponse.status === 429) {
        rateLimitHit = true;
        console.log('✅ Rate limiting working correctly');
        break;
      }
    }
    
    if (!rateLimitHit) {
      console.log('⚠️  Rate limiting not triggered (may need more requests)');
    }
    
    console.log('\n🎉 Secure upload testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    // Cleanup test files
    const testDir = path.join(__dirname, 'test-files');
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
      console.log('🧹 Test files cleaned up');
    }
  }
}

// Run the test
testSecureUpload().catch(console.error);
