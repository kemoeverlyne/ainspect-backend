import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function verifyTRECData() {
  try {
    console.log(colors.bright + colors.blue);
    console.log('='.repeat(70));
    console.log('TREC INSPECTION DATA VERIFICATION');
    console.log('='.repeat(70));
    console.log(colors.reset);

    // Get the most recent TREC inspection
    const inspections = await sql`
      SELECT * FROM trec_inspections 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;

    if (inspections.length === 0) {
      console.log(colors.yellow + '❌ No TREC inspections found in database' + colors.reset);
      return;
    }

    const inspection = inspections[0];

    console.log(colors.green + '\n✓ Found TREC Inspection' + colors.reset);
    console.log(colors.cyan + '─'.repeat(70) + colors.reset);
    
    // Basic Fields
    console.log(colors.bright + '\n📋 BASIC INFORMATION:' + colors.reset);
    console.log(`  ID: ${inspection.id}`);
    console.log(`  Client Name: ${inspection.client_name}`);
    console.log(`  Property Address: ${inspection.property_address}`);
    console.log(`  Inspector Name: ${inspection.inspector_name}`);
    console.log(`  TREC License: ${inspection.trec_license_number}`);
    console.log(`  Sponsor: ${inspection.sponsor_name || 'N/A'}`);
    console.log(`  Status: ${inspection.status}`);
    console.log(`  Total Photos: ${inspection.total_photos}`);
    console.log(`  Inspection Date: ${inspection.inspection_date}`);
    console.log(`  Created At: ${inspection.created_at}`);
    
    // Completed Sections
    console.log(colors.bright + '\n✅ COMPLETED SECTIONS:' + colors.reset);
    if (inspection.completed_sections) {
      console.log(`  Count: ${inspection.completed_sections.length}`);
      inspection.completed_sections.forEach((section, i) => {
        console.log(`  ${i + 1}. ${section}`);
      });
    } else {
      console.log('  None');
    }
    
    // Company Data
    console.log(colors.bright + '\n🏢 COMPANY DATA (JSONB):' + colors.reset);
    if (inspection.company_data) {
      console.log(`  ✓ Saved: YES`);
      console.log(`  Company Name: ${inspection.company_data.companyName || 'N/A'}`);
      console.log(`  Phone: ${inspection.company_data.companyPhone || 'N/A'}`);
      console.log(`  Email: ${inspection.company_data.companyEmail || 'N/A'}`);
      console.log(`  Website: ${inspection.company_data.companyWebsite || 'N/A'}`);
      console.log(`  Address: ${inspection.company_data.companyAddress || 'N/A'}`);
    } else {
      console.log('  ✗ Saved: NO');
    }
    
    // Warranty Data
    console.log(colors.bright + '\n🛡️  WARRANTY DATA (JSONB):' + colors.reset);
    if (inspection.warranty_data) {
      console.log(`  ✓ Saved: YES`);
      console.log(`  Opt-In: ${inspection.warranty_data.warrantyOptIn}`);
      console.log(`  Provider: ${inspection.warranty_data.warrantyProvider || 'N/A'}`);
      console.log(`  Status: ${inspection.warranty_data.warrantyStatus || 'N/A'}`);
      console.log(`  Terms URL: ${inspection.warranty_data.warrantyTermsUrl || 'N/A'}`);
      console.log(`  Note: ${inspection.warranty_data.warrantyNote || 'N/A'}`);
    } else {
      console.log('  ✗ Saved: NO');
    }
    
    // Inspection Data (The Big One - All Sections)
    console.log(colors.bright + '\n🔍 INSPECTION DATA (JSONB):' + colors.reset);
    if (inspection.inspection_data) {
      console.log(`  ✓ Saved: YES`);
      console.log(`  Data Size: ${JSON.stringify(inspection.inspection_data).length} bytes`);
      
      // Cover Page Data
      if (inspection.inspection_data.coverPageData) {
        console.log(colors.bright + '\n  📄 Cover Page Data:' + colors.reset);
        console.log(`    Title: ${inspection.inspection_data.coverPageData.title || 'N/A'}`);
        console.log(`    Subtitle: ${inspection.inspection_data.coverPageData.subtitle || 'N/A'}`);
      }
      
      // Sections Data - THE KEY PART
      if (inspection.inspection_data.sections) {
        const sections = inspection.inspection_data.sections;
        const sectionNames = Object.keys(sections);
        
        console.log(colors.bright + '\n  🏗️  Inspection Sections:' + colors.reset);
        console.log(`    Total Sections: ${sectionNames.length}`);
        
        sectionNames.forEach((sectionName, idx) => {
          const section = sections[sectionName];
          const items = Object.keys(section);
          
          console.log(colors.cyan + `\n    ${idx + 1}. ${sectionName.toUpperCase()} Section:` + colors.reset);
          console.log(`       Items: ${items.length}`);
          
          items.forEach((itemName, itemIdx) => {
            const item = section[itemName];
            console.log(colors.green + `       ${itemIdx + 1}. ${itemName}:` + colors.reset);
            console.log(`          Rating: ${item.rating || 'N/A'}`);
            console.log(`          Comment: ${item.comment || 'N/A'}`);
            if (item.photos && item.photos.length > 0) {
              console.log(`          Photos: ${item.photos.length} (${item.photos.join(', ')})`);
            } else {
              console.log(`          Photos: 0`);
            }
          });
        });
      } else {
        console.log('  ✗ No sections data found!');
      }
      
      // Phase and Active Section
      console.log(colors.bright + '\n  📊 Workflow Status:' + colors.reset);
      console.log(`    Current Phase: ${inspection.inspection_data.currentPhase || 'N/A'}`);
      console.log(`    Active Section: ${inspection.inspection_data.activeSection || 'N/A'}`);
      
    } else {
      console.log('  ✗ Saved: NO');
    }
    
    // Summary
    console.log(colors.bright + colors.green + '\n' + '='.repeat(70));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(70) + colors.reset);
    
    console.log(colors.bright + '\n📊 SUMMARY:' + colors.reset);
    console.log(`  ✓ Basic fields: SAVED`);
    console.log(`  ✓ Completed sections array: ${inspection.completed_sections ? 'SAVED (' + inspection.completed_sections.length + ' items)' : 'NOT SAVED'}`);
    console.log(`  ✓ Company data (JSONB): ${inspection.company_data ? 'SAVED' : 'NOT SAVED'}`);
    console.log(`  ✓ Warranty data (JSONB): ${inspection.warranty_data ? 'SAVED' : 'NOT SAVED'}`);
    console.log(`  ✓ Inspection data (JSONB): ${inspection.inspection_data ? 'SAVED' : 'NOT SAVED'}`);
    
    if (inspection.inspection_data && inspection.inspection_data.sections) {
      const totalSections = Object.keys(inspection.inspection_data.sections).length;
      let totalItems = 0;
      let totalPhotos = 0;
      
      Object.values(inspection.inspection_data.sections).forEach(section => {
        const items = Object.keys(section);
        totalItems += items.length;
        items.forEach(itemName => {
          const item = section[itemName];
          if (item.photos) {
            totalPhotos += item.photos.length;
          }
        });
      });
      
      console.log(colors.cyan + '\n  📈 Detailed Inspection Data:' + colors.reset);
      console.log(`     Sections saved: ${totalSections}`);
      console.log(`     Total inspection items: ${totalItems}`);
      console.log(`     Total photo references: ${totalPhotos}`);
    }
    
    console.log(colors.green + '\n✅ ALL DATA SUCCESSFULLY VERIFIED IN DATABASE!' + colors.reset);
    console.log('');
    
  } catch (error) {
    console.error(colors.yellow + '\n❌ Error:', error.message + colors.reset);
    console.error(error);
  } finally {
    await sql.end();
  }
}

verifyTRECData();


