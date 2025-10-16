/**
 * Test Script: Save TREC Inspection with Valid Photo Data URLs
 * 
 * This creates a complete TREC inspection with actual base64 photo data
 */

const API_URL = 'http://localhost:5001';

// Simple 1x1 red pixel PNG as base64 (for testing)
const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

const trecInspectionData = {
  clientName: "Test Client with Photos",
  propertyAddress: "456 Test Street, Austin, TX 78701",
  inspectionDate: new Date().toISOString(),
  inspectorName: "Test Inspector",
  trecLicenseNumber: "TREC-99999",
  sponsorName: "Test Sponsor Company",
  sponsorTrecLicenseNumber: "TREC-SPONSOR-999",
  status: "completed",
  completedSections: ["I", "II", "III"],
  totalPhotos: 6,
  
  companyData: {
    companyName: "Test Inspection Services",
    companyEmail: "test@test.com",
    companyPhone: "(555) 999-9999",
    companyAddress: "123 Test Ave, Austin, TX 78701",
    companyWebsite: "www.testinspections.com"
  },
  
  warrantyData: {
    warrantyNote: "Test warranty",
    warrantyOptIn: true,
    warrantyStatus: "active",
    warrantyProvider: "Test Warranty Co",
    warrantyTermsUrl: "https://example.com/warranty"
  },
  
  inspectionData: {
    currentPhase: "walkthrough",
    activeSection: "I",
    coverPageData: {
      propertyType: "Single Family Home",
      yearBuilt: "2010",
      squareFootage: "2500",
      weather: "Clear, 75°F"
    },
    sections: {
      "I": {
        "id": "I",
        "title": "STRUCTURAL SYSTEMS",
        "subsections": {
          "A": {
            "id": "A",
            "name": "Foundations",
            "fullName": "A. Foundations",
            "rating": "I",
            "comments": "Foundation is solid with no cracks.",
            "photos": [PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGE]
          },
          "B": {
            "id": "B",
            "name": "Grading and Drainage",
            "fullName": "B. Grading and Drainage",
            "rating": "D",
            "comments": "Poor drainage observed. Recommend regrading.",
            "photos": [PLACEHOLDER_IMAGE]
          },
          "C": {
            "id": "C",
            "name": "Roof Covering Materials",
            "fullName": "C. Roof Covering Materials",
            "rating": "I",
            "comments": "Roof in good condition.",
            "photos": [PLACEHOLDER_IMAGE]
          }
        }
      },
      "II": {
        "id": "II",
        "title": "ELECTRICAL SYSTEMS",
        "subsections": {
          "A": {
            "id": "A",
            "name": "Service Entrance and Panels",
            "fullName": "A. Service Entrance and Panels",
            "rating": "I",
            "comments": "200 amp service, panel properly labeled.",
            "photos": [PLACEHOLDER_IMAGE]
          },
          "B": {
            "id": "B",
            "name": "Branch Circuits, Connected Devices, and Fixtures",
            "fullName": "B. Branch Circuits, Connected Devices, and Fixtures",
            "rating": "NI",
            "comments": "All outlets and fixtures functioning properly.",
            "photos": [PLACEHOLDER_IMAGE]
          }
        }
      }
    }
  }
};

async function saveInspection() {
  console.log('='.repeat(80));
  console.log('SAVING TREC INSPECTION WITH VALID PHOTO DATA');
  console.log('='.repeat(80));
  console.log('');

  try {
    console.log('Step 1: Creating TREC inspection...');
    
    const createResponse = await fetch(`${API_URL}/api/trec/inspections/dev-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trecInspectionData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create inspection: ${createResponse.status} - ${errorText}`);
    }

    const savedInspection = await createResponse.json();
    console.log('✅ Inspection created!');
    console.log('ID:', savedInspection.id);
    console.log('Client:', savedInspection.clientName);
    console.log('');

    console.log('Step 2: Verifying saved data...');
    const verifyResponse = await fetch(`${API_URL}/api/trec/inspections/${savedInspection.id}`);
    const verifiedData = await verifyResponse.json();
    
    console.log('✅ Data verified!');
    console.log('Sections:', Object.keys(verifiedData.inspectionData.sections));
    console.log('Section I subsections:', Object.keys(verifiedData.inspectionData.sections.I.subsections));
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ INSPECTION SAVED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log('');
    console.log('Inspection ID:', savedInspection.id);
    console.log('');
    console.log('Next: Generate PDF with:');
    console.log(`  node test-pdf-with-logs.js (update INSPECTION_ID to ${savedInspection.id})`);
    console.log('');
    console.log('Or test download:');
    console.log(`  ${API_URL}/api/trec/inspections/${savedInspection.id}/report.pdf`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
  }
}

saveInspection();

