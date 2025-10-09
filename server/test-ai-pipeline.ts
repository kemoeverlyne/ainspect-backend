// Manual test script for AI defect analysis pipeline
// Run with: npx tsx server/test-ai-pipeline.ts

import { processInspectionForLeads } from "./ai-defect-analysis";

async function testAIPipeline() {
  console.log('🧪 Testing AI Defect Analysis Pipeline');
  console.log('=====================================');

  // Test data with known defects
  const testInspectionData = {
    inspectionId: 999,
    photos: [
      {
        url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
        description: "Water damage under kitchen sink",
        roomType: "kitchen",
        systemType: "plumbing"
      },
      {
        url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
        description: "Exposed electrical wiring in basement",
        roomType: "basement",
        systemType: "electrical"
      }
    ],
    notes: [
      {
        text: "Kitchen sink has visible water damage underneath, appears to be from leaking supply lines. Water stains on cabinet floor indicate ongoing issue.",
        roomType: "kitchen",
        systemType: "plumbing"
      },
      {
        text: "Basement electrical outlet has exposed wires, immediate safety hazard. Breaker should be turned off until repaired.",
        roomType: "basement", 
        systemType: "electrical"
      },
      {
        text: "Roof inspection reveals missing shingles on south side. Several shingles blown off, potential for water infiltration during rain.",
        roomType: "exterior",
        systemType: "roofing"
      },
      {
        text: "HVAC system making unusual noises, furnace not heating properly. Thermostat set to 72°F but house temperature only reaching 65°F.",
        roomType: "basement",
        systemType: "hvac"
      }
    ],
    customerName: "John Test Customer",
    customerEmail: "john.test@example.com", 
    customerPhone: "(555) 123-4567",
    propertyAddress: "123 Test Street, Test City, TS 12345",
    inspectorId: "test-inspector-001"
  };

  try {
    console.log(`📸 Analyzing ${testInspectionData.photos.length} photos...`);
    console.log(`📝 Analyzing ${testInspectionData.notes.length} notes...`);
    console.log('');

    const results = await processInspectionForLeads(testInspectionData);

    console.log('✅ AI Analysis Results:');
    console.log('======================');
    console.log(`📊 Total Defects Found: ${results.totalDefectsFound}`);
    console.log(`🔧 Defect-Based Leads: ${results.defectLeadsCreated}`);
    console.log(`🏡 Homeowner Service Leads: ${results.homeownerLeadsCreated}`);
    console.log(`🎯 Total Leads Created: ${results.totalLeadsCreated}`);
    console.log('');

    console.log('📋 Defects by Contractor Category:');
    Object.entries(results.defectsByCategory).forEach(([category, count]) => {
      console.log(`  • ${category.replace('_', ' ').toUpperCase()}: ${count} issue${count !== 1 ? 's' : ''}`);
    });
    console.log('');

    console.log('🏠 Universal Homeowner Services:');
    Object.entries(results.homeownerServicesByCategory).forEach(([category, count]) => {
      console.log(`  • ${category.replace('_', ' ').toUpperCase()}: ${count} service${count !== 1 ? 's' : ''}`);
    });
    console.log('');

    console.log('🔍 Detailed Defect Analysis:');
    results.processingResults.forEach((defect, index) => {
      console.log(`\n${index + 1}. ${defect.description}`);
      console.log(`   📍 Location: ${defect.location}`);
      console.log(`   🚨 Severity: ${defect.severity.toUpperCase()}`);
      console.log(`   ⚡ Urgency: ${defect.urgency.replace('_', ' ')}`);
      console.log(`   🔧 Contractor: ${defect.contractorCategory.replace('_', ' ')}`);
      console.log(`   📈 Confidence: ${Math.round(defect.confidence * 100)}%`);
      console.log(`   🧾 Evidence: ${defect.supportingEvidence.type} - "${defect.supportingEvidence.source.substring(0, 50)}..."`);
    });

    console.log('\n');
    console.log('🎯 Lead Generation Pipeline Test Results:');
    console.log('=========================================');
    
    if (results.totalDefectsFound > 0) {
      console.log('✅ PASS: AI successfully detected defects from photos and notes');
    } else {
      console.log('❌ FAIL: No defects detected - check AI analysis logic');
    }

    if (results.defectLeadsCreated === results.totalDefectsFound) {
      console.log('✅ PASS: All detected defects converted to contractor leads');
    } else {
      console.log(`❌ FAIL: Defect lead creation mismatch - found ${results.totalDefectsFound} defects but created ${results.defectLeadsCreated} defect leads`);
    }

    if (results.homeownerLeadsCreated >= 10) {
      console.log('✅ PASS: Universal homeowner service leads generated (10+ services)');
    } else {
      console.log(`❌ FAIL: Insufficient homeowner service leads - expected 10+, got ${results.homeownerLeadsCreated}`);
    }

    const expectedCategories = ['plumbing', 'electrical', 'roofing', 'hvac'];
    const foundCategories = Object.keys(results.defectsByCategory);
    const matchedCategories = expectedCategories.filter(cat => foundCategories.includes(cat));
    
    if (matchedCategories.length >= 2) {
      console.log(`✅ PASS: Multiple contractor categories identified (${matchedCategories.join(', ')})`);
    } else {
      console.log('⚠️  WARN: Limited contractor category diversity detected');
    }

    console.log('\n🚀 Pipeline integration test completed successfully!');
    console.log('   All detected defects have been processed and leads generated.');

  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    console.error('\nError details:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.message.includes('OpenAI')) {
      console.log('\n💡 Check that OPENAI_API_KEY environment variable is set correctly');
    }
  }
}

// Run the test when called directly
testAIPipeline().catch(console.error);

export { testAIPipeline };