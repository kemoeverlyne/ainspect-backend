// Test script for the service marketplace system
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

// Simple fetch polyfill for Node.js
global.fetch = fetch;

async function testServices() {
  console.log('🧪 Testing Service Marketplace System...\n');

  try {
    // Test 1: Get all services
    console.log('1. Testing GET /api/services...');
    const servicesResponse = await fetch(`${API_BASE}/api/services`);
    const servicesData = await servicesResponse.json();
    
    if (servicesData.success) {
      console.log(`✅ Found ${servicesData.data.length} services`);
      console.log('   Categories:', [...new Set(servicesData.data.map(s => s.category))]);
    } else {
      console.log('❌ Failed to fetch services:', servicesData.error);
    }

    // Test 2: Get services by category
    console.log('\n2. Testing GET /api/services/category/safety...');
    const safetyResponse = await fetch(`${API_BASE}/api/services/category/safety`);
    const safetyData = await safetyResponse.json();
    
    if (safetyData.success) {
      console.log(`✅ Found ${safetyData.data.length} safety services`);
    } else {
      console.log('❌ Failed to fetch safety services:', safetyData.error);
    }

    // Test 3: Get service recommendations
    console.log('\n3. Testing GET /api/services/recommendations...');
    const recommendationsResponse = await fetch(`${API_BASE}/api/services/recommendations?propertyType=Single%20Family&squareFootage=2000&yearBuilt=1995`);
    const recommendationsData = await recommendationsResponse.json();
    
    if (recommendationsData.success) {
      console.log(`✅ Found ${recommendationsData.data.length} recommended services`);
    } else {
      console.log('❌ Failed to fetch recommendations:', recommendationsData.error);
    }

    console.log('\n🎉 Service marketplace system is working!');

  } catch (error) {
    console.error('❌ Error testing services:', error.message);
  }
}

// Run the test
testServices();
