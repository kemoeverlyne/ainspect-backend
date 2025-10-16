/**
 * Test Script: Download TREC PDF with Hierarchical Data
 * 
 * This will test the PDF generation with the hierarchical inspection we just created
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:5001';
const INSPECTION_ID = 'fed76dba-6ae6-45a0-aeba-911f5b2ca079'; // With valid photo data

async function testTRECPDFDownload() {
  console.log('='.repeat(80));
  console.log('TESTING TREC PDF GENERATION WITH HIERARCHICAL DATA');
  console.log('='.repeat(80));
  console.log('');
  console.log('Inspection ID:', INSPECTION_ID);
  console.log('');

  try {
    console.log('Step 1: Downloading TREC PDF...');
    console.log('Endpoint:', `${API_URL}/api/trec/inspections/${INSPECTION_ID}/report.pdf`);
    console.log('');
    
    const response = await fetch(`${API_URL}/api/trec/inspections/${INSPECTION_ID}/report.pdf`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download PDF: ${response.status} - ${errorText}`);
    }

    console.log('✅ PDF generated successfully!');
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('');

    // Save the PDF to a file
    const pdfBuffer = await response.arrayBuffer();
    const pdfPath = path.join(__dirname, 'test-trec-hierarchical-report.pdf');
    fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));

    console.log('✅ PDF saved to:', pdfPath);
    console.log('File size:', (pdfBuffer.byteLength / 1024).toFixed(2), 'KB');
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ PDF DOWNLOAD COMPLETE');
    console.log('='.repeat(80));
    console.log('');
    console.log('CHECK BACKEND CONSOLE FOR DETAILED LOGS:');
    console.log('  [STORAGE GET] - Data retrieval from database');
    console.log('  [TREC PDF API] - Data format detection');
    console.log('  [TREC PDF] - Section processing (should show HIERARCHICAL format)');
    console.log('');
    console.log('OPEN THE PDF AND VERIFY:');
    console.log('  ✓ Section titles: "I. STRUCTURAL SYSTEMS", "II. ELECTRICAL SYSTEMS"');
    console.log('  ✓ Subsection names: "A. Foundations", "B. Grading and Drainage"');
    console.log('  ✓ Ratings: Checkmarks in I, NI, NP, D columns');
    console.log('  ✓ Comments: All inspector comments displayed');
    console.log('  ✓ Photos: All photos rendered in the PDF');
    console.log('');
    console.log('Expected Sections in PDF:');
    console.log('  - I. STRUCTURAL SYSTEMS (5 items: A-E)');
    console.log('  - II. ELECTRICAL SYSTEMS (2 items: A-B)');
    console.log('  - III. HEATING, VENTILATION AND AIR CONDITIONING SYSTEMS (4 items: A-D)');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  - Make sure backend is running on port 5001');
    console.error('  - Check backend console for detailed error logs');
    console.error('  - Verify the inspection ID exists');
    console.error('');
  }
}

// Run the test
testTRECPDFDownload();

