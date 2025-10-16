/**
 * Test Script: Verify Saved TREC Inspection Data Structure
 * 
 * This will fetch the inspection we just created and show its exact structure
 */

const API_URL = 'http://localhost:5001';
const INSPECTION_ID = 'a9053b0a-77db-43d3-bd5a-9033a11b6957';

async function verifyInspectionData() {
  console.log('='.repeat(80));
  console.log('VERIFYING TREC INSPECTION DATA STRUCTURE');
  console.log('='.repeat(80));
  console.log('');
  console.log('Inspection ID:', INSPECTION_ID);
  console.log('');

  try {
    console.log('Fetching inspection data from database...');
    console.log('');
    
    const response = await fetch(`${API_URL}/api/trec/inspections/${INSPECTION_ID}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch inspection: ${response.status} - ${errorText}`);
    }

    const inspection = await response.json();
    
    console.log('✅ Inspection fetched successfully!');
    console.log('');
    console.log('='.repeat(80));
    console.log('TOP-LEVEL STRUCTURE');
    console.log('='.repeat(80));
    console.log('Keys:', Object.keys(inspection));
    console.log('');
    
    // Check for inspectionData
    if (inspection.inspectionData) {
      console.log('✅ inspectionData exists');
      console.log('Keys:', Object.keys(inspection.inspectionData));
      console.log('');
      
      if (inspection.inspectionData.sections) {
        console.log('✅ inspectionData.sections exists');
        console.log('Section keys:', Object.keys(inspection.inspectionData.sections));
        console.log('');
        
        // Check format of first section
        const firstSectionKey = Object.keys(inspection.inspectionData.sections)[0];
        const firstSection = inspection.inspectionData.sections[firstSectionKey];
        
        console.log('='.repeat(80));
        console.log(`ANALYZING SECTION "${firstSectionKey}"`);
        console.log('='.repeat(80));
        console.log(JSON.stringify(firstSection, null, 2));
        console.log('');
        
        if (firstSection.subsections) {
          console.log('✅ HIERARCHICAL FORMAT DETECTED!');
          console.log('Section has:', {
            id: firstSection.id,
            title: firstSection.title,
            subsections: Object.keys(firstSection.subsections)
          });
          console.log('');
          
          // Show first subsection
          const firstSubKey = Object.keys(firstSection.subsections)[0];
          console.log(`First subsection (${firstSubKey}):`);
          console.log(JSON.stringify(firstSection.subsections[firstSubKey], null, 2));
        } else {
          console.log('⚠️ FLAT FORMAT DETECTED (old format)');
          console.log('Section structure:', firstSection);
        }
      } else {
        console.log('❌ inspectionData.sections does NOT exist');
      }
    } else if (inspection.reportData) {
      console.log('⚠️ Old format: data is in reportData');
      console.log('Keys:', Object.keys(inspection.reportData));
    } else {
      console.log('❌ No inspectionData or reportData found!');
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('FULL INSPECTION DATA (truncated)');
    console.log('='.repeat(80));
    const dataStr = JSON.stringify(inspection, null, 2);
    console.log(dataStr.substring(0, 3000));
    if (dataStr.length > 3000) {
      console.log('...(truncated, total length:', dataStr.length, 'chars)');
    }
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
  }
}

// Run the test
verifyInspectionData();

