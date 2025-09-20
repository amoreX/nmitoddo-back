const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

async function testNewMO() {
  try {
    console.log('Testing /mo/new - should create MO with empty product...');
    
    // Test creating MO - should always create empty product
    const newMOResponse = await axios.post(`${baseURL}/mo/new`, {
      userId: 1,
      quantity: 5,
      scheduleStartDate: '2025-09-25',
      deadline: '2025-09-30'
    });

    console.log('✅ Successfully created MO with empty product!');
    console.log('Response:', JSON.stringify(newMOResponse.data, null, 2));
    
    const createdMO = newMOResponse.data.data;
    console.log(`\n📋 Created MO ID: ${createdMO.id}`);
    console.log(`📦 Product ID: ${createdMO.product.id}`);
    console.log(`📦 Product Name: "${createdMO.product.name}" (should be empty)`);
    console.log(`📦 Product Description: "${createdMO.product.description}" (should be empty)`);
    console.log(`📦 Product BOM entries: ${createdMO.product.bom.length}`);
    
    // Test getting the MO details to verify product was included
    const moDetailsResponse = await axios.get(`${baseURL}/mo/${createdMO.id}`);
    console.log('\n✅ Successfully retrieved MO details!');
    console.log(`📋 MO Status: ${moDetailsResponse.data.data.status}`);
    console.log(`📦 Product included: ${moDetailsResponse.data.data.product ? 'Yes' : 'No'}`);
    
    return createdMO;
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testNewProductMOWithBOM() {
  try {
    console.log('\n\nTesting MO creation with new product and BOM...');
    
    // Test creating MO with new product and BOM
    const newProductBOMResponse = await axios.post(`${baseURL}/mo/new-with-bom-product`, {
      userId: 1,
      product: {
        name: `Test BOM Product ${Date.now()}`,
        description: 'A test product with BOM created via MO API',
        unit: 'pieces'
      },
      quantity: 3,
      scheduleStartDate: '2025-09-25',
      deadline: '2025-09-30',
      assignedToId: 1
    });

    console.log('✅ Successfully created MO with new product and BOM!');
    console.log('Response:', JSON.stringify(newProductBOMResponse.data, null, 2));
    
    const createdMO = newProductBOMResponse.data.data;
    console.log(`\n📋 Created MO ID: ${createdMO.id}`);
    console.log(`📦 Product ID: ${createdMO.product.id}`);
    console.log(`📦 Product Name: ${createdMO.product.name}`);
    console.log(`⚙️ Work Orders Created: ${createdMO.workOrdersCreated}`);
    
    return createdMO;
    
  } catch (error) {
    console.error('❌ BOM Test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  try {
    await testNewProductMO();
    await testNewProductMOWithBOM();
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n💥 Tests failed!');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testNewProductMO, testNewProductMOWithBOM };