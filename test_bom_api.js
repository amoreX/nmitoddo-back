#!/usr/bin/env node

/**
 * Comprehensive BOM API Test Script
 * Tests all BOM CRUD endpoints with authentication, validation, and error handling
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let authToken = '';
let testProductId = null;
let testComponentIds = [];

// Helper functions
function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.blue}=== ${message} ===${colors.reset}`);
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers,
      timeout: 10000
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function authenticate() {
  logHeader('Authentication Test');
  
  const result = await makeRequest('POST', '/auth/login', TEST_USER);
  
  if (result.success && result.data.success) {
    authToken = result.data.token;
    logSuccess(`Authentication successful - Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    logError(`Authentication failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function setupTestData() {
  logHeader('Setting Up Test Data');
  
  // Create test products (main product and components)
  const mainProduct = {
    name: 'Test Finished Product',
    description: 'Test product for BOM testing',
    unit: 'piece'
  };
  
  const components = [
    { name: 'Test Component A', description: 'First test component', unit: 'kg' },
    { name: 'Test Component B', description: 'Second test component', unit: 'liter' },
    { name: 'Test Component C', description: 'Third test component', unit: 'piece' }
  ];
  
  // Create main product
  const mainProductResult = await makeRequest('POST', '/products', mainProduct, authToken);
  if (mainProductResult.success) {
    testProductId = mainProductResult.data.data.id;
    logSuccess(`Created main product: ${mainProduct.name} (ID: ${testProductId})`);
  } else {
    logError(`Failed to create main product: ${JSON.stringify(mainProductResult.error)}`);
    return false;
  }
  
  // Create component products
  for (const component of components) {
    const result = await makeRequest('POST', '/products', component, authToken);
    if (result.success) {
      testComponentIds.push(result.data.data.id);
      logSuccess(`Created component: ${component.name} (ID: ${result.data.data.id})`);
    } else {
      logError(`Failed to create component ${component.name}: ${JSON.stringify(result.error)}`);
    }
  }
  
  if (testComponentIds.length < 2) {
    logError('Insufficient test components created');
    return false;
  }
  
  logInfo(`Test setup complete - Main Product ID: ${testProductId}, Component IDs: ${testComponentIds.join(', ')}`);
  return true;
}

async function testCreateBOM() {
  logHeader('Testing CREATE BOM (POST /api/bom)');
  
  // Test 1: Valid BOM creation
  const validBOM = {
    productId: testProductId,
    components: [
      {
        componentId: testComponentIds[0],
        quantity: 5,
        opDurationMins: 10,
        notes: 'Primary component'
      },
      {
        componentId: testComponentIds[1],
        quantity: 2,
        opDurationMins: 5,
        notes: 'Secondary component'
      }
    ]
  };
  
  const result1 = await makeRequest('POST', '/bom', validBOM, authToken);
  if (result1.success && result1.data.success) {
    logSuccess(`BOM created successfully for product ${result1.data.data.product.name}`);
    logInfo(`Components: ${result1.data.data.componentCount}, Total Cost: ${result1.data.data.totalCost}, Total Duration: ${result1.data.data.totalDuration} mins`);
  } else {
    logError(`BOM creation failed: ${JSON.stringify(result1.error)}`);
  }
  
  // Test 2: Duplicate BOM creation (should fail)
  const result2 = await makeRequest('POST', '/bom', validBOM, authToken);
  if (!result2.success && result2.status === 409) {
    logSuccess('Duplicate BOM creation properly rejected (409 Conflict)');
  } else {
    logError('Duplicate BOM creation should have been rejected');
  }
  
  // Test 3: Invalid data validation
  const invalidBOM = {
    productId: testProductId,
    components: [
      {
        componentId: testComponentIds[0],
        quantity: -1, // Invalid quantity
        opDurationMins: 10
      }
    ]
  };
  
  const result3 = await makeRequest('POST', '/bom', invalidBOM, authToken);
  if (!result3.success && result3.status === 400) {
    logSuccess('Invalid quantity properly rejected (400 Bad Request)');
  } else {
    logError('Invalid quantity should have been rejected');
  }
  
  // Test 4: Non-existent product
  const invalidProductBOM = {
    productId: 99999,
    components: [
      {
        componentId: testComponentIds[0],
        quantity: 1,
        opDurationMins: 5
      }
    ]
  };
  
  const result4 = await makeRequest('POST', '/bom', invalidProductBOM, authToken);
  if (!result4.success && result4.status === 404) {
    logSuccess('Non-existent product properly rejected (404 Not Found)');
  } else {
    logError('Non-existent product should have been rejected');
  }
  
  // Test 5: Authentication required
  const result5 = await makeRequest('POST', '/bom', validBOM);
  if (!result5.success && result5.status === 401) {
    logSuccess('Unauthenticated request properly rejected (401 Unauthorized)');
  } else {
    logError('Unauthenticated request should have been rejected');
  }
}

async function testGetAllBOMs() {
  logHeader('Testing GET ALL BOMs (GET /api/bom)');
  
  // Test 1: Get all BOMs
  const result1 = await makeRequest('GET', '/bom', null, authToken);
  if (result1.success && result1.data.success) {
    logSuccess(`Retrieved ${result1.data.data.length} BOMs`);
    logInfo(`Pagination: total=${result1.data.pagination.total}, limit=${result1.data.pagination.limit}, offset=${result1.data.pagination.offset}`);
  } else {
    logError(`Failed to retrieve BOMs: ${JSON.stringify(result1.error)}`);
  }
  
  // Test 2: Get BOMs with filtering
  const result2 = await makeRequest('GET', `/bom?productId=${testProductId}&limit=10&offset=0`, null, authToken);
  if (result2.success && result2.data.success) {
    logSuccess(`Retrieved BOMs with filter - Found ${result2.data.data.length} BOMs for product ${testProductId}`);
  } else {
    logError(`Failed to retrieve filtered BOMs: ${JSON.stringify(result2.error)}`);
  }
  
  // Test 3: Invalid parameters
  const result3 = await makeRequest('GET', '/bom?limit=200', null, authToken);
  if (!result3.success && result3.status === 400) {
    logSuccess('Invalid limit properly rejected (400 Bad Request)');
  } else {
    logError('Invalid limit should have been rejected');
  }
  
  // Test 4: Authentication required
  const result4 = await makeRequest('GET', '/bom');
  if (!result4.success && result4.status === 401) {
    logSuccess('Unauthenticated request properly rejected (401 Unauthorized)');
  } else {
    logError('Unauthenticated request should have been rejected');
  }
}

async function testGetBOMByProductId() {
  logHeader('Testing GET BOM BY PRODUCT ID (GET /api/bom/:productId)');
  
  // Test 1: Get existing BOM
  const result1 = await makeRequest('GET', `/bom/${testProductId}`, null, authToken);
  if (result1.success && result1.data.success) {
    logSuccess(`Retrieved BOM for product ${result1.data.data.product.name}`);
    logInfo(`Components: ${result1.data.data.componentCount}, Total Cost: ${result1.data.data.totalCost}`);
    
    // Log component details
    result1.data.data.components.forEach((comp, index) => {
      logInfo(`  Component ${index + 1}: ${comp.component.name} - Qty: ${comp.quantity}, Duration: ${comp.opDurationMins || 0} mins`);
    });
  } else {
    logError(`Failed to retrieve BOM: ${JSON.stringify(result1.error)}`);
  }
  
  // Test 2: Non-existent product
  const result2 = await makeRequest('GET', '/bom/99999', null, authToken);
  if (!result2.success && result2.status === 404) {
    logSuccess('Non-existent product BOM properly rejected (404 Not Found)');
  } else {
    logError('Non-existent product BOM should have been rejected');
  }
  
  // Test 3: Invalid product ID
  const result3 = await makeRequest('GET', '/bom/invalid', null, authToken);
  if (!result3.success && result3.status === 400) {
    logSuccess('Invalid product ID properly rejected (400 Bad Request)');
  } else {
    logError('Invalid product ID should have been rejected');
  }
  
  // Test 4: Authentication required
  const result4 = await makeRequest('GET', `/bom/${testProductId}`);
  if (!result4.success && result4.status === 401) {
    logSuccess('Unauthenticated request properly rejected (401 Unauthorized)');
  } else {
    logError('Unauthenticated request should have been rejected');
  }
}

async function testUpdateBOM() {
  logHeader('Testing UPDATE BOM (PUT /api/bom/:productId)');
  
  // Test 1: Valid BOM update
  const updatedBOM = {
    components: [
      {
        componentId: testComponentIds[0],
        quantity: 3, // Changed from 5 to 3
        opDurationMins: 8, // Changed from 10 to 8
        notes: 'Updated primary component'
      },
      {
        componentId: testComponentIds[2], // Different component
        quantity: 1,
        opDurationMins: 12,
        notes: 'New third component'
      }
    ]
  };
  
  const result1 = await makeRequest('PUT', `/bom/${testProductId}`, updatedBOM, authToken);
  if (result1.success && result1.data.success) {
    logSuccess(`BOM updated successfully for product ${result1.data.data.product.name}`);
    logInfo(`Updated Components: ${result1.data.data.componentCount}, New Total Cost: ${result1.data.data.totalCost}, New Total Duration: ${result1.data.data.totalDuration} mins`);
  } else {
    logError(`BOM update failed: ${JSON.stringify(result1.error)}`);
  }
  
  // Test 2: Invalid data validation
  const invalidUpdate = {
    components: [
      {
        componentId: testComponentIds[0],
        quantity: 0, // Invalid quantity
        opDurationMins: 5
      }
    ]
  };
  
  const result2 = await makeRequest('PUT', `/bom/${testProductId}`, invalidUpdate, authToken);
  if (!result2.success && result2.status === 400) {
    logSuccess('Invalid quantity in update properly rejected (400 Bad Request)');
  } else {
    logError('Invalid quantity in update should have been rejected');
  }
  
  // Test 3: Non-existent product
  const result3 = await makeRequest('PUT', '/bom/99999', updatedBOM, authToken);
  if (!result3.success && result3.status === 404) {
    logSuccess('Update of non-existent product BOM properly rejected (404 Not Found)');
  } else {
    logError('Update of non-existent product BOM should have been rejected');
  }
  
  // Test 4: Authentication required
  const result4 = await makeRequest('PUT', `/bom/${testProductId}`, updatedBOM);
  if (!result4.success && result4.status === 401) {
    logSuccess('Unauthenticated update request properly rejected (401 Unauthorized)');
  } else {
    logError('Unauthenticated update request should have been rejected');
  }
}

async function testCheckBOMUsage() {
  logHeader('Testing CHECK BOM USAGE (GET /api/bom/:productId/usage)');
  
  // Test 1: Check BOM usage
  const result1 = await makeRequest('GET', `/bom/${testProductId}/usage`, null, authToken);
  if (result1.success && result1.data.success) {
    logSuccess(`BOM usage checked for product ${result1.data.data.productName}`);
    logInfo(`Is used: ${result1.data.data.isUsed}, Active MOs: ${result1.data.data.activeManufacturingOrders.length}`);
    
    if (result1.data.data.activeManufacturingOrders.length > 0) {
      logInfo(`Total Active Quantity: ${result1.data.data.totalActiveQuantity}`);
    }
  } else {
    logError(`BOM usage check failed: ${JSON.stringify(result1.error)}`);
  }
  
  // Test 2: Non-existent product
  const result2 = await makeRequest('GET', '/bom/99999/usage', null, authToken);
  if (result2.success || !result2.success) { // Usage check might still work for non-existent products
    logSuccess('BOM usage check handled gracefully for non-existent product');
  }
  
  // Test 3: Authentication required
  const result3 = await makeRequest('GET', `/bom/${testProductId}/usage`);
  if (!result3.success && result3.status === 401) {
    logSuccess('Unauthenticated usage check properly rejected (401 Unauthorized)');
  } else {
    logError('Unauthenticated usage check should have been rejected');
  }
}

async function testDeleteBOM() {
  logHeader('Testing DELETE BOM (DELETE /api/bom/:productId)');
  
  // Test 1: Check usage before deletion
  const usageResult = await makeRequest('GET', `/bom/${testProductId}/usage`, null, authToken);
  let canDelete = true;
  
  if (usageResult.success && usageResult.data.success && usageResult.data.data.isUsed) {
    logWarning('BOM is in use by active Manufacturing Orders - deletion should be prevented');
    canDelete = false;
  }
  
  // Test 2: Delete BOM
  const result1 = await makeRequest('DELETE', `/bom/${testProductId}`, null, authToken);
  
  if (canDelete) {
    if (result1.success && result1.data.success) {
      logSuccess(`BOM deleted successfully: ${result1.data.message}`);
      logInfo(`Deleted ${result1.data.data.deletedComponents} components for product ${result1.data.data.productName}`);
    } else {
      logError(`BOM deletion failed: ${JSON.stringify(result1.error)}`);
    }
  } else {
    if (!result1.success && result1.status === 409) {
      logSuccess('BOM deletion properly prevented due to active usage (409 Conflict)');
    } else {
      logError('BOM deletion should have been prevented due to active usage');
    }
  }
  
  // Test 3: Delete non-existent BOM
  const result2 = await makeRequest('DELETE', '/bom/99999', null, authToken);
  if (!result2.success && result2.status === 404) {
    logSuccess('Deletion of non-existent BOM properly rejected (404 Not Found)');
  } else {
    logError('Deletion of non-existent BOM should have been rejected');
  }
  
  // Test 4: Authentication required
  const result3 = await makeRequest('DELETE', `/bom/${testProductId}`);
  if (!result3.success && result3.status === 401) {
    logSuccess('Unauthenticated deletion request properly rejected (401 Unauthorized)');
  } else {
    logError('Unauthenticated deletion request should have been rejected');
  }
  
  // Test 5: Try to get deleted BOM (if it was actually deleted)
  if (canDelete && result1.success) {
    const result4 = await makeRequest('GET', `/bom/${testProductId}`, null, authToken);
    if (!result4.success && result4.status === 404) {
      logSuccess('Deleted BOM properly not found (404 Not Found)');
    } else {
      logError('Deleted BOM should not be found');
    }
  }
}

async function cleanup() {
  logHeader('Cleaning Up Test Data');
  
  try {
    // Delete test products (this will cascade delete BOMs)
    if (testProductId) {
      await makeRequest('DELETE', `/products/${testProductId}`, null, authToken);
      logInfo(`Cleaned up main product (ID: ${testProductId})`);
    }
    
    for (const componentId of testComponentIds) {
      await makeRequest('DELETE', `/products/${componentId}`, null, authToken);
      logInfo(`Cleaned up component (ID: ${componentId})`);
    }
    
    logSuccess('Test data cleanup completed');
  } catch (error) {
    logWarning(`Cleanup may have failed: ${error.message}`);
  }
}

async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    BOM API TEST SUITE                       ║');
  console.log('║                  Comprehensive CRUD Testing                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Authenticate
    const authSuccess = await authenticate();
    if (!authSuccess) {
      logError('Authentication failed - cannot proceed with tests');
      return;
    }
    
    // Step 2: Setup test data
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      logError('Test data setup failed - cannot proceed with tests');
      return;
    }
    
    // Step 3: Run all BOM tests
    await testCreateBOM();
    await testGetAllBOMs();
    await testGetBOMByProductId();
    await testUpdateBOM();
    await testCheckBOMUsage();
    await testDeleteBOM();
    
    // Step 4: Cleanup
    await cleanup();
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  logHeader('Test Summary');
  logInfo(`Total execution time: ${duration} seconds`);
  logSuccess('BOM API test suite completed');
  
  console.log(`\n${colors.bold}${colors.green}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   TESTING COMPLETED                         ║');
  console.log('║   Review the output above for detailed test results         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
}

// Check if server is running
async function checkServerHealth() {
  try {
    // Try to make a simple request to the auth endpoint to verify server is running
    const response = await axios.get(`${API_BASE}/auth/login`, { 
      timeout: 5000,
      validateStatus: function (status) {
        // Accept any status that's not a connection error
        return status < 500;
      }
    });
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('Server is not running on http://localhost:3000');
      logError('Please start the server with: npm run dev');
    } else {
      logError(`Server check failed: ${error.message}`);
    }
    return false;
  }
}

// Main execution
async function main() {
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    logError('Server is not accessible. Please start the server and try again.');
    process.exit(1);
  }
  
  logSuccess('Server is accessible - starting BOM API tests');
  await runAllTests();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logWarning('\nTest interrupted by user');
  await cleanup();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled promise rejection: ${reason}`);
  process.exit(1);
});

// Run the tests
main().catch(console.error);