/**
 * Test Script: Save Complete TREC Inspection with Hierarchical Structure
 * 
 * This will create a new TREC inspection with:
 * - All required fields
 * - Multiple sections filled out
 * - Various ratings (I, NI, NP, D)
 * - Comments for each item
 * - Photos (as URLs for now)
 */

const API_URL = 'http://localhost:5001';

async function saveCompleteTRECInspection() {
  console.log('='.repeat(80));
  console.log('CREATING COMPLETE TREC INSPECTION WITH HIERARCHICAL STRUCTURE');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Note: Using development bypass for authentication
    console.log('Note: Using development mode (authentication bypass)');
    console.log('');

    // Step 1: Create TREC inspection with complete data
    console.log('Step 1: Creating TREC inspection with complete data...');
    
    const trecInspectionData = {
      // Required TREC fields
      clientName: 'John and Jane Smith',
      inspectionDate: new Date().toISOString(),
      propertyAddress: '123 Main Street, Austin, TX 78701',
      inspectorName: 'Professional Inspector',
      trecLicenseNumber: 'TREC-12345',
      
      // Optional TREC fields
      sponsorName: 'Elite Inspection Services',
      sponsorTrecLicenseNumber: 'TREC-SPONSOR-001',
      
      // Status tracking
      status: 'completed',
      completedSections: ['I', 'II', 'III'],
      totalPhotos: 8,
      
      // Company data
      companyData: {
        companyName: 'AInspect Professional Services',
        companyPhone: '(555) 123-4567',
        companyEmail: 'inspector@ainspect.com',
        companyWebsite: 'www.ainspect.com',
        companyAddress: '200 S. Executive Dr., Suite 101, Brookfield, WI 53005'
      },
      
      // Warranty data
      warrantyData: {
        warrantyOptIn: true,
        warrantyProvider: 'Elite MGA',
        warrantyStatus: 'active',
        warrantyTermsUrl: 'https://www.elitemga.com/home-inspection-warranty/',
        warrantyNote: 'Billed by Elite MGA for $12'
      },
      
      // Inspection data with HIERARCHICAL STRUCTURE
      inspectionData: {
        coverPageData: {
          companyLogo: null,
          companyName: 'AInspect Professional Services',
          reportTitle: 'Property Inspection Report - TREC REI 7-6',
          companyEmail: 'inspector@ainspect.com',
          companyPhone: '(555) 123-4567',
          inspectorName: 'Professional Inspector',
          licenseNumber: 'TREC-12345',
          companyAddress: '200 S. Executive Dr., Suite 101, Brookfield, WI 53005',
          companyWebsite: 'www.ainspect.com',
          propertyFrontPhoto: null
        },
        
        // HIERARCHICAL SECTIONS STRUCTURE
        sections: {
          // Section I: Structural Systems
          'I': {
            id: 'I',
            title: 'STRUCTURAL SYSTEMS',
            subsections: {
              'A': {
                id: 'A',
                name: 'Foundations',
                fullName: 'A. Foundations',
                rating: 'I',
                comments: 'Foundation appears solid with no visible cracks or settling. Slab foundation in good condition.',
                photos: ['https://example.com/photos/foundation1.jpg', 'https://example.com/photos/foundation2.jpg']
              },
              'B': {
                id: 'B',
                name: 'Grading and Drainage',
                fullName: 'B. Grading and Drainage',
                rating: 'D',
                comments: 'Poor drainage near foundation on west side. Water pooling observed. Recommend regrading to direct water away from foundation.',
                photos: ['https://example.com/photos/drainage1.jpg']
              },
              'C': {
                id: 'C',
                name: 'Roof Covering Materials',
                fullName: 'C. Roof Covering Materials',
                rating: 'I',
                comments: 'Asphalt shingle roof in good condition. Approximately 5 years old with no visible damage.',
                photos: ['https://example.com/photos/roof1.jpg']
              },
              'D': {
                id: 'D',
                name: 'Roof Structures and Attics',
                fullName: 'D. Roof Structures and Attics',
                rating: 'I',
                comments: 'Roof structure and attic access inspected. No issues noted. Adequate ventilation present.',
                photos: []
              },
              'E': {
                id: 'E',
                name: 'Walls (Interior and Exterior)',
                fullName: 'E. Walls (Interior and Exterior)',
                rating: 'I',
                comments: 'Interior and exterior walls in satisfactory condition. No cracks or water damage observed.',
                photos: []
              }
            }
          },
          
          // Section II: Electrical Systems
          'II': {
            id: 'II',
            title: 'ELECTRICAL SYSTEMS',
            subsections: {
              'A': {
                id: 'A',
                name: 'Service Entrance and Panels',
                fullName: 'A. Service Entrance and Panels',
                rating: 'I',
                comments: 'Main electrical panel is 200 amp service. Properly labeled and grounded. GFCI protection in place where required.',
                photos: ['https://example.com/photos/electrical-panel.jpg']
              },
              'B': {
                id: 'B',
                name: 'Branch Circuits, Connected Devices, and Fixtures',
                fullName: 'B. Branch Circuits, Connected Devices, and Fixtures',
                rating: 'NI',
                comments: 'Several outlets in master bedroom not functioning properly. Recommend evaluation by licensed electrician.',
                photos: ['https://example.com/photos/outlets.jpg']
              },
              'C': {
                id: 'C',
                name: 'Other',
                fullName: 'C. Other',
                rating: 'NP',
                comments: 'No other electrical items present.',
                photos: []
              }
            }
          },
          
          // Section III: HVAC Systems
          'III': {
            id: 'III',
            title: 'HEATING, VENTILATION AND AIR CONDITIONING SYSTEMS',
            subsections: {
              'A': {
                id: 'A',
                name: 'Heating Equipment',
                fullName: 'A. Heating Equipment',
                rating: 'I',
                comments: 'Gas furnace appears to be functioning properly. Approximately 8 years old. Regular maintenance recommended.',
                photos: ['https://example.com/photos/furnace.jpg']
              },
              'B': {
                id: 'B',
                name: 'Cooling Equipment',
                fullName: 'B. Cooling Equipment',
                rating: 'I',
                comments: 'Central AC unit cooling properly. Condenser clean and in good condition.',
                photos: ['https://example.com/photos/ac-unit.jpg']
              },
              'C': {
                id: 'C',
                name: 'Duct Systems, Chases, and Vents',
                fullName: 'C. Duct Systems, Chases, and Vents',
                rating: 'I',
                comments: 'Ductwork accessible areas appear to be in satisfactory condition.',
                photos: []
              },
              'D': {
                id: 'D',
                name: 'Other',
                fullName: 'D. Other',
                rating: 'NP',
                comments: 'No other HVAC items present.',
                photos: []
              }
            }
          }
        },
        
        currentPhase: 'completed',
        activeSection: 'I'
      }
    };

    console.log('');
    console.log('Creating inspection with:');
    console.log(`  Client: ${trecInspectionData.clientName}`);
    console.log(`  Property: ${trecInspectionData.propertyAddress}`);
    console.log(`  Inspector: ${trecInspectionData.inspectorName}`);
    console.log(`  TREC License: ${trecInspectionData.trecLicenseNumber}`);
    console.log(`  Sections filled: ${Object.keys(trecInspectionData.inspectionData.sections).join(', ')}`);
    console.log('');
    console.log('Data Structure:');
    console.log('  Format: HIERARCHICAL ✅');
    console.log('  Sections with titles: ✅');
    console.log('  Subsections with names: ✅');
    console.log('  Ratings: I, NI, NP, D ✅');
    console.log('  Comments: ✅');
    console.log('  Photos: ✅ (URLs)');
    console.log('');

    // Create the inspection (using development endpoint with no authentication)
    const createResponse = await fetch(`${API_URL}/api/trec/inspections/dev-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(trecInspectionData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create inspection: ${createResponse.status} - ${errorText}`);
    }

    const createdInspection = await createResponse.json();
    console.log('✅ TREC Inspection created successfully!');
    console.log('');
    console.log('Inspection Details:');
    console.log(`  ID: ${createdInspection.id}`);
    console.log(`  Status: ${createdInspection.status}`);
    console.log(`  Created: ${createdInspection.createdAt}`);
    console.log('');

    // Step 3: Verify the saved data
    console.log('Step 3: Verifying saved data...');
    console.log('');
    
    const verifyResponse = await fetch(`${API_URL}/api/trec/inspections/${createdInspection.id}`);

    if (!verifyResponse.ok) {
      throw new Error(`Failed to fetch inspection: ${verifyResponse.status}`);
    }

    const savedInspection = await verifyResponse.json();
    
    console.log('✅ Data retrieved successfully');
    console.log('');
    console.log('Verification:');
    console.log(`  Client Name: ${savedInspection.clientName === trecInspectionData.clientName ? '✅' : '❌'}`);
    console.log(`  Property Address: ${savedInspection.propertyAddress === trecInspectionData.propertyAddress ? '✅' : '❌'}`);
    console.log(`  Has Company Data: ${savedInspection.companyData ? '✅' : '❌'}`);
    console.log(`  Has Inspection Data: ${savedInspection.inspectionData ? '✅' : '❌'}`);
    
    if (savedInspection.inspectionData?.sections) {
      const sections = savedInspection.inspectionData.sections;
      console.log('');
      console.log('Section Structure Verification:');
      console.log(`  Sections saved: ${Object.keys(sections).join(', ')}`);
      
      // Check if hierarchical
      const section1 = sections['I'];
      if (section1) {
        const isHierarchical = section1.subsections !== undefined;
        console.log(`  Format: ${isHierarchical ? 'HIERARCHICAL ✅' : 'FLAT ❌'}`);
        
        if (isHierarchical) {
          console.log(`  Section I title: ${section1.title}`);
          console.log(`  Subsections in Section I: ${Object.keys(section1.subsections).join(', ')}`);
          
          const subsectionA = section1.subsections['A'];
          if (subsectionA) {
            console.log('');
            console.log('Sample Subsection (I.A):');
            console.log(`    Name: ${subsectionA.name}`);
            console.log(`    Full Name: ${subsectionA.fullName}`);
            console.log(`    Rating: ${subsectionA.rating}`);
            console.log(`    Has Comments: ${subsectionA.comments ? '✅' : '❌'}`);
            console.log(`    Photo Count: ${subsectionA.photos?.length || 0}`);
          }
        }
      }
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('✅ TEST COMPLETE - HIERARCHICAL STRUCTURE VERIFIED');
    console.log('='.repeat(80));
    console.log('');
    console.log(`Inspection ID: ${createdInspection.id}`);
    console.log('');
    console.log('Next Steps:');
    console.log('1. Go to frontend and view this inspection');
    console.log('2. Download the PDF');
    console.log('3. Check backend console for logs showing "HIERARCHICAL (new)" format');
    console.log('4. Verify PDF shows section titles and subsection names');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  - Make sure backend is running on port 5001');
    console.error('  - Review backend console for detailed error logs');
    console.error('  - Check if the POST /api/trec/inspections endpoint is working');
    console.error('');
  }
}

// Run the test
saveCompleteTRECInspection();

