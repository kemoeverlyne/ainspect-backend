/**
 * Test script for the new PDF generation system
 */

import { PDFGenerator } from './server/services/pdfGenerator.js';

async function testPDFGeneration() {
  try {
    console.log('Testing PDF generation...');
    
    // Test data
    const testInspectionData = {
      id: 'TEST-001',
      clientName: 'Test Client',
      propertyAddress: '123 Test Street, Test City, TX 12345',
      inspectionDate: new Date(),
      inspectorName: 'Test Inspector',
      licenseNumber: 'TX-12345',
      companyData: {
        companyName: 'Test Inspection Company',
        companyPhone: '(555) 123-4567',
        companyEmail: 'test@company.com',
        companyAddress: '456 Company St, Test City, TX 12345'
      },
      reportData: {
        summary: {
          itemsPassed: 45,
          itemsFailed: 3,
          safetyIssues: 1,
          majorDefects: 2,
          overallCondition: 'Good'
        },
        sections: {},
        photos: [],
        frontHomePhoto: undefined
      },
      status: 'completed'
    };

    // Generate PDF
    const pdfBuffer = await PDFGenerator.generateStandardReportPDF(testInspectionData, {
      format: 'A4',
      quality: 'high',
      landscape: false
    });

    console.log('PDF generated successfully!');
    console.log('PDF size:', pdfBuffer.length, 'bytes');
    
    // Save to file for testing
    const fs = await import('fs');
    fs.writeFileSync('./test-report.pdf', pdfBuffer);
    console.log('PDF saved as test-report.pdf');

  } catch (error) {
    console.error('Error testing PDF generation:', error);
  } finally {
    // Close browser
    await PDFGenerator.closeBrowser();
    process.exit(0);
  }
}

// Run the test
testPDFGeneration();








