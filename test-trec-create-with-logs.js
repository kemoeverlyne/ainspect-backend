/**
 * Test script for TREC inspection creation with detailed logging
 * This script tests the create TREC inspection endpoint and shows all logs
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123',
  name: 'Test User'
};

// Cookie storage
let cookieJar = {};

// Helper functions for cookie management
function parseCookies(setCookieHeader) {
  if (!setCookieHeader) return;
  
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  cookies.forEach(cookie => {
    const [cookiePair] = cookie.split(';');
    const [name, value] = cookiePair.split('=');
    if (name && value) {
      cookieJar[name.trim()] = value.trim();
    }
  });
}

function getCookieHeader() {
  return Object.entries(cookieJar)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

// ANSI color codes for better terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function getCsrfToken() {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Include existing cookies
  const cookieHeader = getCookieHeader();
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }
  
  const response = await fetch(`${API_URL}/api/csrf-token`, {
    method: 'GET',
    headers: headers,
  });
  
  if (!response.ok) {
    throw new Error('Failed to get CSRF token');
  }
  
  // Store cookies from response
  parseCookies(response.headers.raw()['set-cookie']);
  
  const data = await response.json();
  
  return data.csrfToken;
}

async function login() {
  log('\n=== STEP 1: LOGIN ===', colors.bright + colors.blue);
  
  try {
    // Get CSRF token first
    log('  Getting CSRF token...', colors.blue);
    const csrfToken = await getCsrfToken();
    log(`  ✓ CSRF token obtained: ${csrfToken.substring(0, 20)}...`, colors.green);
    log(`  Cookies stored: ${Object.keys(cookieJar).join(', ')}`, colors.blue);
    
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': getCookieHeader(),
    };
    
    let response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      }),
    });

    // If login fails, try to register first
    if (!response.ok) {
      log(`  Login failed, attempting to register user...`, colors.yellow);
      
      const signupResponse = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': getCookieHeader(),
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
          name: TEST_USER.name,
          tos: true,
          privacy: true,
          optInNonFlagged: false,
          digitalSignature: TEST_USER.name,
          signatureDate: new Date().toISOString()
        }),
      });

      if (signupResponse.ok) {
        log(`  ✓ User registered successfully`, colors.green);
        
        // Store cookies from signup response
        parseCookies(signupResponse.headers.raw()['set-cookie']);
        
        // Try login again
        response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': getCookieHeader(),
          },
          body: JSON.stringify({
            email: TEST_USER.email,
            password: TEST_USER.password
          }),
        });
      } else {
        const errorText = await signupResponse.text();
        log(`  Registration failed: ${errorText}`, colors.yellow);
        // Continue - user might already exist
      }
    }

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    // Store cookies from login response
    parseCookies(response.headers.raw()['set-cookie']);
    
    const data = await response.json();
    log(`✓ Login successful`, colors.green);
    log(`  User ID: ${data.user?.id || 'N/A'}`, colors.green);
    log(`  Email: ${data.user?.email || TEST_USER.email}`, colors.green);
    log(`  Auth Token: ${data.token ? data.token.substring(0, 20) + '...' : data.accessToken?.substring(0, 20) + '...'}`, colors.green);
    
    // Get fresh CSRF token after login
    const csrfAfterLogin = await getCsrfToken();
    log(`  CSRF Token: ${csrfAfterLogin.substring(0, 20)}...`, colors.green);
    
    return {
      authToken: data.token || data.accessToken,
      csrfToken: csrfAfterLogin,
    };
  } catch (error) {
    log(`✗ Login failed: ${error.message}`, colors.red);
    throw error;
  }
}

async function createTRECInspection(auth) {
  log('\n=== STEP 2: CREATE TREC INSPECTION ===', colors.bright + colors.blue);
  
  const trecData = {
    // Required TREC fields
    clientName: 'John Doe Test Client',
    inspectionDate: new Date().toISOString(),
    propertyAddress: '123 Test Street, Austin, TX 78701',
    inspectorName: 'Test Inspector',
    trecLicenseNumber: 'TREC-12345',
    
    // Optional TREC fields
    sponsorName: 'Test Sponsor Company',
    sponsorTrecLicenseNumber: 'TREC-SPONSOR-67890',
    
    // Status tracking
    status: 'completed',
    completedSections: ['structural', 'electrical', 'plumbing', 'hvac'],
    totalPhotos: 15,
    
    // Additional data stored as JSONB
    companyData: {
      companyName: 'Test Inspection Company',
      companyPhone: '(512) 555-0100',
      companyEmail: 'info@testinspection.com',
      companyWebsite: 'https://testinspection.com',
      companyAddress: '456 Business Ave, Austin, TX 78702',
    },
    
    warrantyData: {
      warrantyOptIn: true,
      warrantyProvider: 'Test Home Warranty',
      warrantyStatus: 'active',
      warrantyTermsUrl: 'https://example.com/warranty-terms',
      warrantyNote: 'Premium warranty coverage',
    },
    
    inspectionData: {
      coverPageData: {
        title: 'Property Inspection Report',
        subtitle: 'TREC Compliant REI 7-6',
      },
      sections: {
        structural: {
          foundation: {
            rating: 'inspected',
            comment: 'Foundation appears in good condition',
            photos: ['photo1.jpg', 'photo2.jpg']
          },
          walls: {
            rating: 'inspected',
            comment: 'No significant issues observed',
            photos: ['photo3.jpg']
          }
        },
        electrical: {
          panel: {
            rating: 'inspected',
            comment: '200 amp service, appears adequate',
            photos: ['photo4.jpg']
          }
        },
        plumbing: {
          waterHeater: {
            rating: 'repair_needed',
            comment: 'Water heater nearing end of life, recommend replacement',
            photos: ['photo5.jpg', 'photo6.jpg']
          }
        }
      },
      currentPhase: 'completed',
      activeSection: 'review',
    }
  };

  log('Request Data:', colors.yellow);
  log(JSON.stringify(trecData, null, 2), colors.yellow);
  
  try {
    log('\nSending POST request to /api/trec/inspections...', colors.blue);
    log(`  Authorization: Bearer ${auth.authToken.substring(0, 20)}...`, colors.blue);
    log(`  X-CSRF-Token: ${auth.csrfToken.substring(0, 20)}...`, colors.blue);
    log(`  Cookie: ${getCookieHeader().substring(0, 50)}...`, colors.blue);
    
    const response = await fetch(`${API_URL}/api/trec/inspections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.authToken}`,
        'X-CSRF-Token': auth.csrfToken,
        'Cookie': getCookieHeader(),
      },
      body: JSON.stringify(trecData),
    });

    log(`\nResponse Status: ${response.status} ${response.statusText}`, 
      response.ok ? colors.green : colors.red);

    const result = await response.json();
    
    if (!response.ok) {
      log(`✗ Failed to create TREC inspection`, colors.red);
      log(`Error: ${result.message || 'Unknown error'}`, colors.red);
      throw new Error(result.message || 'Failed to create inspection');
    }

    log(`\n✓ TREC inspection created successfully!`, colors.green);
    log(`  Inspection ID: ${result.id}`, colors.green);
    log(`  Client Name: ${result.clientName}`, colors.green);
    log(`  Property Address: ${result.propertyAddress}`, colors.green);
    log(`  Status: ${result.status}`, colors.green);
    log(`  Created At: ${result.createdAt}`, colors.green);
    
    log('\nFull Response:', colors.yellow);
    log(JSON.stringify(result, null, 2), colors.yellow);
    
    return result;
  } catch (error) {
    log(`✗ Create TREC inspection failed: ${error.message}`, colors.red);
    throw error;
  }
}

async function verifyInspection(auth, inspectionId) {
  log('\n=== STEP 3: VERIFY INSPECTION WAS SAVED ===', colors.bright + colors.blue);
  
  try {
    log(`Fetching inspection ${inspectionId}...`, colors.blue);
    
    const response = await fetch(`${API_URL}/api/trec/inspections/${inspectionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.authToken}`,
        'Cookie': getCookieHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch inspection: ${response.statusText}`);
    }

    const inspection = await response.json();
    
    log(`✓ Inspection retrieved successfully`, colors.green);
    log(`  ID matches: ${inspection.id === inspectionId ? '✓' : '✗'}`, 
      inspection.id === inspectionId ? colors.green : colors.red);
    log(`  Client Name: ${inspection.clientName}`, colors.green);
    log(`  Property Address: ${inspection.propertyAddress}`, colors.green);
    log(`  Inspector ID: ${inspection.inspectorId}`, colors.green);
    log(`  Company Data saved: ${inspection.companyData ? '✓' : '✗'}`, 
      inspection.companyData ? colors.green : colors.red);
    log(`  Warranty Data saved: ${inspection.warrantyData ? '✓' : '✗'}`, 
      inspection.warrantyData ? colors.green : colors.red);
    log(`  Inspection Data saved: ${inspection.inspectionData ? '✓' : '✗'}`, 
      inspection.inspectionData ? colors.green : colors.red);
    
    if (inspection.inspectionData && inspection.inspectionData.sections) {
      log(`  Sections saved: ${Object.keys(inspection.inspectionData.sections).length}`, colors.green);
      log(`  Section names: ${Object.keys(inspection.inspectionData.sections).join(', ')}`, colors.green);
    }
    
    log('\nFull Inspection Data:', colors.yellow);
    log(JSON.stringify(inspection, null, 2), colors.yellow);
    
    return inspection;
  } catch (error) {
    log(`✗ Verification failed: ${error.message}`, colors.red);
    throw error;
  }
}

async function runTest() {
  log('\n' + '='.repeat(60), colors.bright);
  log('TREC INSPECTION CREATE TEST WITH DETAILED LOGGING', colors.bright + colors.blue);
  log('='.repeat(60) + '\n', colors.bright);
  log('This test will create a TREC inspection and show all server logs', colors.yellow);
  log('Check the backend console for detailed logging output\n', colors.yellow);

  try {
    // Step 1: Login
    const auth = await login();
    
    // Step 2: Create TREC inspection
    const inspection = await createTRECInspection(auth);
    
    // Step 3: Verify inspection was saved
    await verifyInspection(auth, inspection.id);
    
    log('\n' + '='.repeat(60), colors.bright + colors.green);
    log('✓ ALL TESTS PASSED!', colors.bright + colors.green);
    log('='.repeat(60) + '\n', colors.bright + colors.green);
    
    log('\nSUMMARY:', colors.bright);
    log(`  Inspection ID: ${inspection.id}`, colors.green);
    log(`  Database Table: trec_inspections`, colors.green);
    log(`  Audit Trail: trec_audit_trail`, colors.green);
    log(`  Data Storage:`, colors.green);
    log(`    - Required fields: VARCHAR, TEXT, TIMESTAMP, INTEGER`, colors.green);
    log(`    - Structured data: JSONB (companyData, warrantyData, inspectionData)`, colors.green);
    log(`    - Arrays: JSONB (completedSections)`, colors.green);
    
    log('\nCHECK THE BACKEND CONSOLE for detailed logs showing:', colors.bright + colors.yellow);
    log('  1. Incoming request data breakdown', colors.yellow);
    log('  2. Data transformation and preparation', colors.yellow);
    log('  3. Database INSERT operation details', colors.yellow);
    log('  4. Field-by-field breakdown of saved data', colors.yellow);
    log('  5. Verification of saved vs. input data', colors.yellow);
    
  } catch (error) {
    log('\n' + '='.repeat(60), colors.bright + colors.red);
    log('✗ TEST FAILED', colors.bright + colors.red);
    log('='.repeat(60) + '\n', colors.bright + colors.red);
    log(`Error: ${error.message}`, colors.red);
    if (error.stack) {
      log(`\nStack trace:\n${error.stack}`, colors.red);
    }
    process.exit(1);
  }
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

