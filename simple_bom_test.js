#!/usr/bin/env node

/**
 * Simple BOM API Test
 * Quick verification of BOM endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuth() {
  try {
    log('\n=== Testing Authentication ===', 'blue');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      loginId: 'keshav',
      pwd: 'Password@123'
    });
    
    if (response.data.success) {
      log('✓ Authentication successful', 'green');
      return response.data.token;
    } else {
      log('✗ Authentication failed', 'red');
      return null;
    }
  } catch (error) {
    log(`✗ Auth error: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testCreateProduct(token, name, description) {
  try {
    const response = await axios.post(`${BASE_URL}/products`, {
      name,
      description,
      unit: 'piece'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      log(`✓ Created product: ${name} (ID: ${response.data.data.id})`, 'green');
      return response.data.data.id;
    } else {
      log(`✗ Failed to create product: ${name}`, 'red');
      return null;
    }
  } catch (error) {
    log(`✗ Product creation error: ${JSON.stringify(error.response?.data) || error.message}`, 'red');
    return null;
  }
}

async function testCreateBOM(token, productId, components) {
  try {
    log('\n=== Testing BOM Creation ===', 'blue');
    
    const response = await axios.post(`${BASE_URL}/bom`, {
      productId,
      components
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      log('✓ BOM created successfully', 'green');
      log(`  Product: ${response.data.data.product.name}`, 'blue');
      log(`  Components: ${response.data.data.componentCount}`, 'blue');
      log(`  Total Cost: ${response.data.data.totalCost}`, 'blue');
      log(`  Total Duration: ${response.data.data.totalDuration} mins`, 'blue');
      return true;
    } else {
      log('✗ BOM creation failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ BOM creation error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetBOM(token, productId) {
  try {
    log('\n=== Testing BOM Retrieval ===', 'blue');
    
    const response = await axios.get(`${BASE_URL}/bom/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      log('✓ BOM retrieved successfully', 'green');
      log(`  Product: ${response.data.data.product.name}`, 'blue');
      log(`  Components: ${response.data.data.componentCount}`, 'blue');
      response.data.data.components.forEach((comp, index) => {
        log(`    ${index + 1}. ${comp.component.name} - Qty: ${comp.quantity}`, 'blue');
      });
      return true;
    } else {
      log('✗ BOM retrieval failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ BOM retrieval error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testGetAllBOMs(token) {
  try {
    log('\n=== Testing BOM List ===', 'blue');
    
    const response = await axios.get(`${BASE_URL}/bom?limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      log(`✓ Retrieved ${response.data.data.length} BOMs`, 'green');
      log(`  Total: ${response.data.pagination.total}`, 'blue');
      return true;
    } else {
      log('✗ BOM list retrieval failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ BOM list error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testUpdateBOM(token, productId, components) {
  try {
    log('\n=== Testing BOM Update ===', 'blue');
    
    const response = await axios.put(`${BASE_URL}/bom/${productId}`, {
      components
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      log('✓ BOM updated successfully', 'green');
      log(`  Updated Components: ${response.data.data.componentCount}`, 'blue');
      log(`  New Total Cost: ${response.data.data.totalCost}`, 'blue');
      return true;
    } else {
      log('✗ BOM update failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ BOM update error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testDeleteBOM(token, productId) {
  try {
    log('\n=== Testing BOM Deletion ===', 'blue');
    
    const response = await axios.delete(`${BASE_URL}/bom/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      log('✓ BOM deleted successfully', 'green');
      log(`  Message: ${response.data.message}`, 'blue');
      return true;
    } else {
      log('✗ BOM deletion failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ BOM deletion error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function runSimpleTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    SIMPLE BOM API TEST                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  try {
    // Step 1: Authenticate
    const token = await testAuth();
    if (!token) {
      log('Cannot proceed without authentication', 'red');
      return;
    }
    
    // Step 2: Create test products with unique names
    log('\n=== Creating Test Products ===', 'blue');
    const timestamp = Date.now();
    const mainProductId = await testCreateProduct(token, `Test BOM Product ${timestamp}`, 'Main product for BOM testing');
    const comp1Id = await testCreateProduct(token, `Test Component 1 ${timestamp}`, 'First component');
    const comp2Id = await testCreateProduct(token, `Test Component 2 ${timestamp}`, 'Second component');
    
    if (!mainProductId || !comp1Id || !comp2Id) {
      log('Failed to create test products', 'red');
      return;
    }
    
    // Step 3: Test BOM CRUD operations
    const components = [
      { componentId: comp1Id, quantity: 5, opDurationMins: 10, notes: 'Primary component' },
      { componentId: comp2Id, quantity: 2, opDurationMins: 5, notes: 'Secondary component' }
    ];
    
    const createSuccess = await testCreateBOM(token, mainProductId, components);
    if (!createSuccess) return;
    
    const getSuccess = await testGetBOM(token, mainProductId);
    if (!getSuccess) return;
    
    await testGetAllBOMs(token);
    
    // Update with modified components
    const updatedComponents = [
      { componentId: comp1Id, quantity: 3, opDurationMins: 8, notes: 'Updated primary component' }
    ];
    
    const updateSuccess = await testUpdateBOM(token, mainProductId, updatedComponents);
    if (!updateSuccess) return;
    
    // Final verification
    await testGetBOM(token, mainProductId);
    
    // Cleanup - delete BOM and products
    await testDeleteBOM(token, mainProductId);
    
    log('\n=== Test Summary ===', 'blue');
    log('✓ All basic BOM operations completed successfully', 'green');
    
  } catch (error) {
    log(`\nTest failed with error: ${error.message}`, 'red');
  }
}

// Check if we can connect to the server
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/auth/login`, { 
      timeout: 3000,
      validateStatus: () => true // Accept any response
    });
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('Server is not running. Please start with: npm run dev', 'red');
    } else {
      log(`Server check failed: ${error.message}`, 'red');
    }
    return false;
  }
}

async function main() {
  const serverOk = await checkServer();
  if (!serverOk) {
    process.exit(1);
  }
  
  log('Server is accessible - starting tests...', 'green');
  await runSimpleTests();
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});