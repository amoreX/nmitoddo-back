#!/usr/bin/env node

/**
 * Quick test to list existing products and test BOM operations
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImxvZ2luSWQiOiJrZXNoYXYiLCJpYXQiOjE3NTgzOTg0NjcsImV4cCI6MTc1OTAwMzI2N30.jljeaGY8A_Q4gcWDE4k09s7pKvEsJvaAzl_DfDeHxHw';

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

async function listProducts() {
  try {
    log('\n=== Listing Existing Products ===', 'blue');
    
    const response = await axios.get(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    if (response.data.status) {
      log(`✓ Found ${response.data.data.length} products:`, 'green');
      response.data.data.slice(0, 5).forEach((product, index) => {
        log(`  ${index + 1}. ID: ${product.id}, Name: "${product.name}", Unit: ${product.unit}`, 'blue');
      });
      if (response.data.data.length > 5) {
        log(`  ... and ${response.data.data.length - 5} more products`, 'blue');
      }
      return response.data.data;
    } else {
      log('✗ Failed to list products', 'red');
      return [];
    }
  } catch (error) {
    log(`✗ Error listing products: ${error.response?.data?.message || error.message}`, 'red');
    return [];
  }
}

async function testBOMWithExistingProducts(products) {
  if (products.length < 3) {
    log('✗ Need at least 3 products for BOM testing', 'red');
    return;
  }
  
  // Find products that don't already have BOMs
  let mainProduct = null;
  let component1 = null;
  let component2 = null;
  
  // Look for products without existing BOMs
  for (const product of products) {
    if (product._count && product._count.bom === 0) {
      if (!mainProduct) {
        mainProduct = product;
      } else if (!component1) {
        component1 = product;
      } else if (!component2) {
        component2 = product;
        break;
      }
    }
  }
  
  // Fallback to first few products if no BOM-free products found
  if (!mainProduct) mainProduct = products[0];
  if (!component1) component1 = products[1];
  if (!component2) component2 = products[2];
  
  log(`\n=== Testing BOM Creation ===`, 'blue');
  log(`Main Product: ${mainProduct.name} (ID: ${mainProduct.id})`, 'blue');
  log(`Component 1: ${component1.name} (ID: ${component1.id})`, 'blue');
  log(`Component 2: ${component2.name} (ID: ${component2.id})`, 'blue');
  
  try {
    // Create BOM
    const bomData = {
      productId: mainProduct.id,
      components: [
        {
          componentId: component1.id,
          quantity: 5,
          opDurationMins: 10,
          notes: 'Primary component for testing'
        },
        {
          componentId: component2.id,
          quantity: 2,
          opDurationMins: 5,
          notes: 'Secondary component for testing'
        }
      ]
    };
    
    const createResponse = await axios.post(`${BASE_URL}/bom`, bomData, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    if (createResponse.data.success) {
      log('✓ BOM created successfully!', 'green');
      log(`  Product: ${createResponse.data.data.product.name}`, 'blue');
      log(`  Components: ${createResponse.data.data.componentCount}`, 'blue');
      log(`  Total Cost: ${createResponse.data.data.totalCost}`, 'blue');
      log(`  Total Duration: ${createResponse.data.data.totalDuration} mins`, 'blue');
      
      // Test retrieval
      log(`\n=== Testing BOM Retrieval ===`, 'blue');
      
      const getResponse = await axios.get(`${BASE_URL}/bom/${mainProduct.id}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      if (getResponse.data.success) {
        log('✓ BOM retrieved successfully!', 'green');
        log(`  Product: ${getResponse.data.data.product.name}`, 'blue');
        getResponse.data.data.components.forEach((comp, index) => {
          log(`    ${index + 1}. ${comp.component.name} - Qty: ${comp.quantity}, Duration: ${comp.opDurationMins || 0} mins`, 'blue');
        });
      }
      
      // Test list all BOMs
      log(`\n=== Testing BOM List ===`, 'blue');
      
      const listResponse = await axios.get(`${BASE_URL}/bom?limit=10`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      if (listResponse.data.success) {
        log(`✓ BOM list retrieved - Found ${listResponse.data.data.length} BOMs`, 'green');
        log(`  Total: ${listResponse.data.pagination.total}`, 'blue');
      }
      
      // Test update
      log(`\n=== Testing BOM Update ===`, 'blue');
      
      const updateData = {
        components: [
          {
            componentId: component1.id,
            quantity: 3, // Changed from 5 to 3
            opDurationMins: 8, // Changed from 10 to 8
            notes: 'Updated primary component'
          }
        ]
      };
      
      const updateResponse = await axios.put(`${BASE_URL}/bom/${mainProduct.id}`, updateData, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      if (updateResponse.data.success) {
        log('✓ BOM updated successfully!', 'green');
        log(`  Updated Components: ${updateResponse.data.data.componentCount}`, 'blue');
        log(`  New Total Cost: ${updateResponse.data.data.totalCost}`, 'blue');
      }
      
      // Test usage check
      log(`\n=== Testing BOM Usage Check ===`, 'blue');
      
      const usageResponse = await axios.get(`${BASE_URL}/bom/${mainProduct.id}/usage`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      
      if (usageResponse.data.success) {
        log('✓ BOM usage checked successfully!', 'green');
        log(`  Is used: ${usageResponse.data.data.isUsed}`, 'blue');
        log(`  Active MOs: ${usageResponse.data.data.activeManufacturingOrders?.length || 0}`, 'blue');
      }
      
      // Test deletion (if not in use)
      log(`\n=== Testing BOM Deletion ===`, 'blue');
      
      if (!usageResponse.data.data.isUsed) {
        const deleteResponse = await axios.delete(`${BASE_URL}/bom/${mainProduct.id}`, {
          headers: { Authorization: `Bearer ${TOKEN}` }
        });
        
        if (deleteResponse.data.success) {
          log('✓ BOM deleted successfully!', 'green');
          log(`  Message: ${deleteResponse.data.message}`, 'blue');
        }
      } else {
        log('⚠ BOM is in use - skipping deletion test', 'blue');
      }
      
      log('\n=== All BOM Tests Completed Successfully! ===', 'green');
      
    } else {
      log('✗ BOM creation failed', 'red');
      log(`  Error: ${createResponse.data.message}`, 'red');
    }
    
  } catch (error) {
    log(`✗ BOM test error: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data) {
      log(`  Full error: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    QUICK BOM API TEST                       ║');
  console.log('║                Using Existing Products                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  const products = await listProducts();
  if (products.length > 0) {
    await testBOMWithExistingProducts(products);
  } else {
    log('✗ No products found - cannot test BOM operations', 'red');
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});