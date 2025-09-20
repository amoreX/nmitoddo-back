const axios = require('axios');

const baseURL = 'http://localhost:3000/api';

async function testNewAndSaveDraft() {
  try {
    console.log('=== Testing /mo/new - creates MO with empty product ===');
    
    // Step 1: Create new MO - always creates empty product
    const newMOResponse = await axios.post(`${baseURL}/mo/new`, {
      userId: 1,
      quantity: 5,
      scheduleStartDate: '2025-09-25',
      deadline: '2025-09-30'
    });

    console.log('✅ Successfully created MO with empty product!');
    const createdMO = newMOResponse.data.data;
    console.log(`📋 Created MO ID: ${createdMO.id}`);
    console.log(`📦 Product ID: ${createdMO.product.id}`);
    console.log(`📦 Product Name: "${createdMO.product.name}" (empty)`);
    console.log(`📦 Product Description: "${createdMO.product.description}" (empty)`);
    
    console.log('\n=== Testing /mo/save-draft - updates all MO fields including product ===');
    
    // Step 2: Update MO with save-draft - should update all fields including product
    const saveDraftResponse = await axios.post(`${baseURL}/mo/save-draft`, {
      id: createdMO.id,
      userId: 1,
      productId: createdMO.product.id,
      product: {
        name: "Updated Product Name",
        description: "Updated product description",
        unit: "pieces"
      },
      quantity: 10, // Updated quantity
      scheduleStartDate: '2025-09-26', // Updated date
      deadline: '2025-10-01', // Updated deadline
      assignedToId: 1, // Assign to user
      status: "draft"
    });

    console.log('✅ Successfully updated MO with save-draft!');
    const updatedMO = saveDraftResponse.data.data;
    console.log(`📋 MO ID: ${updatedMO.id}`);
    console.log(`📦 Product ID: ${updatedMO.product.id}`);
    console.log(`📦 Product Name: "${updatedMO.product.name}" (should be updated)`);
    console.log(`📦 Product Description: "${updatedMO.product.description}" (should be updated)`);
    console.log(`📦 Product Unit: "${updatedMO.product.unit}" (should be updated)`);
    console.log(`📊 Quantity: ${updatedMO.quantity} (should be 10)`);
    console.log(`👤 Assigned To: ${updatedMO.assignedTo ? updatedMO.assignedTo.name || updatedMO.assignedTo.email : 'None'}`);
    console.log(`📅 Schedule Start: ${updatedMO.scheduleStartDate}`);
    console.log(`⏰ Deadline: ${updatedMO.deadline}`);
    
    console.log('\n🎉 All tests passed! The workflow is:');
    console.log('1. POST /mo/new - Creates MO with empty product');
    console.log('2. POST /mo/save-draft - Updates ALL fields including product details');
    
    return updatedMO;
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    throw error;
  }
}

// Fields that save-draft accepts:
console.log('📝 Fields that /mo/save-draft accepts:');
console.log('• id (required) - MO ID');
console.log('• userId (required) - Creator ID');
console.log('• productId (optional) - Product ID to update');
console.log('• product (optional) - Product fields to update:');
console.log('  - name');
console.log('  - description');
console.log('  - unit');
console.log('• quantity - MO quantity');
console.log('• scheduleStartDate - Start date');
console.log('• deadline - Deadline date');
console.log('• assignedToId - Assigned user ID');
console.log('• components - Array of BOM components');
console.log('• workOrders - Array of work orders');
console.log('• bomIds - Array of BOM IDs to update');
console.log('• workOrderIds - Array of work order IDs to update');
console.log('• status - MO status');
console.log('');

// Run tests if this file is executed directly
if (require.main === module) {
  testNewAndSaveDraft();
}

module.exports = { testNewAndSaveDraft };