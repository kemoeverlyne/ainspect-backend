#!/usr/bin/env node

/**
 * Test script to verify TREC PDF generation works
 */

import { TRECReportGenerator } from './server/services/trecReportGenerator.js';

const testReportData = {
  header: {
    clientName: 'Test Client',
    propertyAddress: '123 Test Street, Test City, TX 12345',
    inspectionDate: new Date().toISOString(),
    inspectorName: 'Test Inspector',
    licenseNo: 'TEST-001',
    companyName: 'Test Inspection Company',
    companyPhone: '(555) 123-4567',
    companyEmail: 'test@company.com',
    companyAddress: '456 Company St, City, TX 67890',
    companyWebsite: 'www.testcompany.com',
    reportNo: 'TEST-REPORT-001',
    sponsorName: 'Test Sponsor',
    sponsorLicenseNo: 'SPONSOR-001'
  },
  sections: {
    'IA': {
      'foundation': {
        rating: 'S',
        comment: 'Foundation appears to be in satisfactory condition',
        notes: 'No visible cracks or settling observed'
      }
    },
    'IC': {
      'grading': {
        rating: 'NI',
        comment: 'Grading needs improvement',
        notes: 'Water pooling observed near foundation'
      }
    }
  },
  cover: {
    reportTitle: 'TREC Property Inspection Report'
  },
  propertyPhotos: [],
  propertyInfo: {
    type: 'Single Family',
    yearBuilt: '2020',
    squareFootage: '2000',
    weather: 'Clear'
  }
};

async function testPDFGeneration() {
  try {
    console.log('Testing TREC PDF generation...');
    
    const pdfBuffer = await TRECReportGenerator.generateTRECReport(testReportData);
    
    console.log('✅ PDF generation successful!');
    console.log('PDF size:', pdfBuffer.length, 'bytes');
    
    // Save test PDF
    const fs = await import('fs/promises');
    await fs.writeFile('test-trec-report.pdf', pdfBuffer);
    console.log('✅ Test PDF saved as test-trec-report.pdf');
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    process.exit(1);
  }
}

testPDFGeneration();
