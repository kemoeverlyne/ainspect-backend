/**
 * Test Script: Generate PDF and Watch Backend Logs
 * 
 * This will trigger PDF generation and we can watch the backend console
 */

const API_URL = 'http://localhost:5001';
const INSPECTION_ID = 'fed76dba-6ae6-45a0-aeba-911f5b2ca079';

async function generatePDF() {
  console.log('='.repeat(80));
  console.log('GENERATING TREC PDF - WATCH BACKEND CONSOLE FOR LOGS');
  console.log('='.repeat(80));
  console.log('');
  console.log('Inspection ID:', INSPECTION_ID);
  console.log('');
  console.log('📋 WATCH FOR THESE LOGS IN BACKEND CONSOLE:');
  console.log('  [TREC PDF] Processing section I');
  console.log('  [TREC PDF] Section I format: HIERARCHICAL (new) or FLAT (old)');
  console.log('  [TREC PDF] Section I title: ...');
  console.log('  [TREC PDF] Subsections: ...');
  console.log('  [TREC PDF] I.A (hierarchical): { name, rating, hasComments, hasPhotos }');
  console.log('');
  console.log('Requesting PDF...');
  console.log('');

  try {
    const response = await fetch(`${API_URL}/api/trec/inspections/${INSPECTION_ID}/report.pdf`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed: ${response.status} - ${errorText}`);
    }

    console.log('✅ PDF Generated Successfully!');
    console.log('');
    console.log('='.repeat(80));
    console.log('NOW CHECK THE BACKEND CONSOLE OUTPUT ABOVE');
    console.log('='.repeat(80));
    console.log('');
    console.log('Look for:');
    console.log('  1. "Section I format: HIERARCHICAL (new)" - Should say HIERARCHICAL');
    console.log('  2. "I.A (hierarchical): { ... }" - Should show data for each item');
    console.log('  3. Check if ratings, comments, and photos are detected');
    console.log('');
    console.log('If you see "FLAT (old)" format, the data is not being read correctly!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generatePDF();

