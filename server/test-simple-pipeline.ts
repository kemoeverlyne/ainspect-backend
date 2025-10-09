// Simple test for homeowner service lead generation
import { createUniversalHomeownerLeads } from "./ai-defect-analysis";

async function testHomeownerLeads() {
  console.log('🏠 Testing Universal Homeowner Service Lead Generation');
  console.log('===================================================');

  const testData = {
    inspectionId: 1001,
    customerName: "Test Customer",
    customerEmail: "test@example.com",
    customerPhone: "(555) 123-4567",
    propertyAddress: "456 Test Avenue, Test City, TS 12345",
    inspectorId: "test-inspector-001"
  };

  try {
    console.log('Creating universal homeowner service leads...');
    const leadsCreated = await createUniversalHomeownerLeads(testData);
    
    console.log(`✅ SUCCESS: Created ${leadsCreated} homeowner service leads`);
    console.log('');
    console.log('Expected services:');
    console.log('  • Pest Control');
    console.log('  • Solar Installation');
    console.log('  • Home Security');
    console.log('  • Professional Cleaning');
    console.log('  • Home Insurance');
    console.log('  • Auto Insurance');
    console.log('  • Landscaping');
    console.log('  • Home Warranty');
    console.log('  • Internet/Cable');
    console.log('  • Utilities Setup');
    
    if (leadsCreated >= 10) {
      console.log('\n🎯 TEST PASSED: All 10 homeowner service leads created successfully!');
    } else {
      console.log(`\n❌ TEST FAILED: Expected 10 leads, got ${leadsCreated}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
  }
}

testHomeownerLeads().catch(console.error);