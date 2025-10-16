import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Colors
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

async function testTRECReportView() {
  try {
    log('\n' + '='.repeat(70), colors.bright + colors.blue);
    log('TREC REPORT VIEWER DATA TEST', colors.bright + colors.blue);
    log('='.repeat(70) + '\n', colors.bright + colors.blue);

    // Use the inspection ID from our previous test
    const inspectionId = 'ad52c8e8-4c0b-4db0-ae30-5d77c80b1c9f';
    
    log(`Fetching TREC inspection: ${inspectionId}`, colors.blue);
    
    const response = await fetch(`${API_URL}/api/trec/inspections/${inspectionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    log('\n✓ Successfully fetched TREC inspection', colors.green);
    log('─'.repeat(70), colors.blue);
    
    // Verify all fields are present
    log('\n📊 DATA VERIFICATION:', colors.bright);
    
    const checks = [
      { name: 'ID', value: data.id, expected: true },
      { name: 'Client Name', value: data.clientName, expected: true },
      { name: 'Property Address', value: data.propertyAddress, expected: true },
      { name: 'Inspector Name', value: data.inspectorName, expected: true },
      { name: 'TREC License', value: data.trecLicenseNumber, expected: true },
      { name: 'Company Data', value: data.companyData, expected: true },
      { name: 'Warranty Data', value: data.warrantyData, expected: true },
      { name: 'Inspection Data', value: data.inspectionData, expected: true },
      { name: 'Inspection Sections', value: data.inspectionData?.sections, expected: true },
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      const passed = check.expected ? !!check.value : !check.value;
      const symbol = passed ? '✓' : '✗';
      const color = passed ? colors.green : colors.red;
      log(`  ${symbol} ${check.name}: ${passed ? 'Present' : 'Missing'}`, color);
      if (!passed) allPassed = false;
    });
    
    // Show what the frontend will receive
    log('\n📦 DATA STRUCTURE FOR FRONTEND:', colors.bright + colors.yellow);
    log('─'.repeat(70), colors.yellow);
    
    const frontendData = {
      id: data.id,
      clientName: data.clientName,
      inspectionDate: data.inspectionDate,
      propertyAddress: data.propertyAddress,
      inspectorName: data.inspectorName,
      trecLicenseNumber: data.trecLicenseNumber,
      sponsorName: data.sponsorName,
      sponsorTrecLicenseNumber: data.sponsorTrecLicenseNumber,
      status: data.status,
      reportData: {
        companyData: data.companyData,
        warrantyData: data.warrantyData,
        inspectionData: data.inspectionData
      }
    };
    
    log('\nTransformed structure:', colors.yellow);
    log(JSON.stringify(frontendData, null, 2).substring(0, 500) + '...', colors.yellow);
    
    // Check sections specifically
    if (data.inspectionData?.sections) {
      const sections = data.inspectionData.sections;
      const sectionNames = Object.keys(sections);
      
      log('\n🏗️  INSPECTION SECTIONS:', colors.bright + colors.cyan);
      log(`  Total sections: ${sectionNames.length}`, colors.cyan);
      
      sectionNames.forEach((sectionName, idx) => {
        const section = sections[sectionName];
        const items = Object.keys(section);
        log(`\n  ${idx + 1}. ${sectionName}:`, colors.cyan);
        log(`     Items: ${items.length}`, colors.cyan);
        
        items.forEach(itemName => {
          const item = section[itemName];
          log(`     - ${itemName}: ${item.rating} (${item.photos?.length || 0} photos)`, colors.green);
        });
      });
    }
    
    log('\n' + '='.repeat(70), colors.bright + colors.green);
    if (allPassed) {
      log('✅ ALL DATA PRESENT - TREC REPORT VIEWER WILL WORK!', colors.bright + colors.green);
    } else {
      log('⚠️  SOME DATA MISSING - MAY HAVE DISPLAY ISSUES', colors.bright + colors.yellow);
    }
    log('='.repeat(70) + '\n', colors.bright + colors.green);
    
    log('Next steps:', colors.bright);
    log('  1. Open browser to: http://localhost:5173/trec-report/' + inspectionId, colors.blue);
    log('  2. All inspection data should be visible', colors.blue);
    log('  3. Section items with ratings and comments should display', colors.blue);
    log('  4. Photo references should be shown\n', colors.blue);
    
  } catch (error) {
    log('\n❌ Error:', error.message, colors.red);
    console.error(error);
    process.exit(1);
  }
}

testTRECReportView();


