const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ProductLedger and ProductStock data...');

  // First, let's add some initial stock for raw materials (components)
  const componentStockData = [
    // Components for Premium Laptop A1
    { productId: 19, quantity: 50, referenceType: 'purchase', movementType: 'in' }, // Intel Core i7 Processor
    { productId: 20, quantity: 100, referenceType: 'purchase', movementType: 'in' }, // 16GB DDR4 RAM
    { productId: 21, quantity: 75, referenceType: 'purchase', movementType: 'in' }, // 512GB NVMe SSD
    { productId: 22, quantity: 60, referenceType: 'purchase', movementType: 'in' }, // 15.6 4K Display
    { productId: 23, quantity: 80, referenceType: 'purchase', movementType: 'in' }, // Lithium Battery

    // Components for Gaming Desktop GX
    { productId: 24, quantity: 30, referenceType: 'purchase', movementType: 'in' }, // AMD Ryzen 9 CPU
    { productId: 25, quantity: 25, referenceType: 'purchase', movementType: 'in' }, // NVIDIA RTX 4080
    { productId: 26, quantity: 40, referenceType: 'purchase', movementType: 'in' }, // 32GB DDR5 RAM
    { productId: 27, quantity: 35, referenceType: 'purchase', movementType: 'in' }, // Gaming Motherboard
    { productId: 28, quantity: 45, referenceType: 'purchase', movementType: 'in' }, // 850W PSU

    // Components for Office Workstation Pro
    { productId: 29, quantity: 20, referenceType: 'purchase', movementType: 'in' }, // Intel Xeon CPU
    { productId: 30, quantity: 25, referenceType: 'purchase', movementType: 'in' }, // 64GB ECC RAM
    { productId: 31, quantity: 15, referenceType: 'purchase', movementType: 'in' }, // Quadro RTX A4000
    { productId: 32, quantity: 30, referenceType: 'purchase', movementType: 'in' }, // 1TB NVMe SSD
    { productId: 33, quantity: 40, referenceType: 'purchase', movementType: 'in' }, // Tower Case
  ];

  // Add some consumption entries (simulate production usage)
  const consumptionData = [
    // Consumption for Premium Laptop A1 production (10 units made)
    { productId: 19, quantity: 10, referenceType: 'MO', referenceId: 6, movementType: 'out' }, // Intel Core i7
    { productId: 20, quantity: 10, referenceType: 'MO', referenceId: 6, movementType: 'out' }, // 16GB DDR4 RAM
    { productId: 21, quantity: 10, referenceType: 'MO', referenceId: 6, movementType: 'out' }, // 512GB NVMe SSD
    { productId: 22, quantity: 10, referenceType: 'MO', referenceId: 6, movementType: 'out' }, // 15.6 4K Display
    { productId: 23, quantity: 10, referenceType: 'MO', referenceId: 6, movementType: 'out' }, // Lithium Battery

    // Consumption for Gaming Desktop GX production (3 units made partially)
    { productId: 24, quantity: 3, referenceType: 'MO', referenceId: 7, movementType: 'out' }, // AMD Ryzen 9 CPU
    { productId: 25, quantity: 3, referenceType: 'MO', referenceId: 7, movementType: 'out' }, // NVIDIA RTX 4080
    { productId: 26, quantity: 3, referenceType: 'MO', referenceId: 7, movementType: 'out' }, // 32GB DDR5 RAM
    { productId: 27, quantity: 3, referenceType: 'MO', referenceId: 7, movementType: 'out' }, // Gaming Motherboard
    { productId: 28, quantity: 3, referenceType: 'MO', referenceId: 7, movementType: 'out' }, // 850W PSU
  ];

  // Add finished goods production
  const finishedGoodsData = [
    // Finished Premium Laptop A1 (10 units produced)
    { productId: 34, quantity: 10, referenceType: 'MO', referenceId: 6, movementType: 'in' },
    
    // Partially finished Gaming Desktop GX (3 units produced so far)
    { productId: 35, quantity: 3, referenceType: 'MO', referenceId: 7, movementType: 'in' },
  ];

  // Create ProductLedger entries
  console.log('📦 Creating initial stock entries...');
  for (const entry of componentStockData) {
    await prisma.productLedger.create({
      data: {
        productId: entry.productId,
        movementType: entry.movementType,
        quantity: entry.quantity,
        referenceType: entry.referenceType,
        createdAt: new Date('2024-09-01T10:00:00.000Z'), // Initial stock date
      },
    });
  }

  console.log('🏭 Creating consumption entries...');
  for (const entry of consumptionData) {
    await prisma.productLedger.create({
      data: {
        productId: entry.productId,
        movementType: entry.movementType,
        quantity: entry.quantity,
        referenceType: entry.referenceType,
        referenceId: entry.referenceId,
        createdAt: new Date('2024-10-01T12:00:00.000Z'), // Production date
      },
    });
  }

  console.log('✅ Creating finished goods entries...');
  for (const entry of finishedGoodsData) {
    await prisma.productLedger.create({
      data: {
        productId: entry.productId,
        movementType: entry.movementType,
        quantity: entry.quantity,
        referenceType: entry.referenceType,
        referenceId: entry.referenceId,
        createdAt: new Date('2024-10-01T15:00:00.000Z'), // Finished goods date
      },
    });
  }

  // Now create ProductStock entries based on calculated balances
  console.log('📊 Creating ProductStock records...');
  
  const stockCalculations = [
    // Components stock (initial - consumed)
    { productId: 19, quantity: 40 }, // Intel Core i7: 50 - 10 = 40
    { productId: 20, quantity: 90 }, // 16GB DDR4 RAM: 100 - 10 = 90
    { productId: 21, quantity: 65 }, // 512GB NVMe SSD: 75 - 10 = 65
    { productId: 22, quantity: 50 }, // 15.6 4K Display: 60 - 10 = 50
    { productId: 23, quantity: 70 }, // Lithium Battery: 80 - 10 = 70
    
    { productId: 24, quantity: 27 }, // AMD Ryzen 9 CPU: 30 - 3 = 27
    { productId: 25, quantity: 22 }, // NVIDIA RTX 4080: 25 - 3 = 22
    { productId: 26, quantity: 37 }, // 32GB DDR5 RAM: 40 - 3 = 37
    { productId: 27, quantity: 32 }, // Gaming Motherboard: 35 - 3 = 32
    { productId: 28, quantity: 42 }, // 850W PSU: 45 - 3 = 42
    
    // Office Workstation Pro components (no consumption yet)
    { productId: 29, quantity: 20 }, // Intel Xeon CPU
    { productId: 30, quantity: 25 }, // 64GB ECC RAM
    { productId: 31, quantity: 15 }, // Quadro RTX A4000
    { productId: 32, quantity: 30 }, // 1TB NVMe SSD
    { productId: 33, quantity: 40 }, // Tower Case
    
    // Finished goods
    { productId: 34, quantity: 10 }, // Premium Laptop A1: 10 produced
    { productId: 35, quantity: 3 },  // Gaming Desktop GX: 3 produced
    { productId: 36, quantity: 0 },  // Office Workstation Pro: 0 produced
  ];

  for (const stock of stockCalculations) {
    await prisma.productStock.create({
      data: {
        productId: stock.productId,
        quantity: stock.quantity,
        updatedAt: new Date(),
      },
    });
  }

  // Add some additional random stock movements to make it more realistic
  console.log('🔄 Adding additional stock movements...');
  
  const additionalMovements = [
    // Quality issues - some defective components returned
    { productId: 20, quantity: 2, referenceType: 'quality_return', movementType: 'out' },
    { productId: 25, quantity: 1, referenceType: 'quality_return', movementType: 'out' },
    
    // Emergency purchase
    { productId: 31, quantity: 5, referenceType: 'emergency_purchase', movementType: 'in' },
    
    // Sales/shipping
    { productId: 34, quantity: 8, referenceType: 'sales', movementType: 'out' },
    { productId: 35, quantity: 2, referenceType: 'sales', movementType: 'out' },
  ];

  for (const movement of additionalMovements) {
    await prisma.productLedger.create({
      data: {
        productId: movement.productId,
        movementType: movement.movementType,
        quantity: movement.quantity,
        referenceType: movement.referenceType,
        createdAt: new Date('2024-10-10T14:00:00.000Z'),
      },
    });
  }

  // Update ProductStock to reflect additional movements
  console.log('📈 Updating stock quantities...');
  
  // Update stocks based on additional movements
  await prisma.productStock.update({
    where: { productId: 20 },
    data: { quantity: 88 }, // 90 - 2 (quality return)
  });

  await prisma.productStock.update({
    where: { productId: 25 },
    data: { quantity: 21 }, // 22 - 1 (quality return)
  });

  await prisma.productStock.update({
    where: { productId: 31 },
    data: { quantity: 20 }, // 15 + 5 (emergency purchase)
  });

  await prisma.productStock.update({
    where: { productId: 34 },
    data: { quantity: 2 }, // 10 - 8 (sales)
  });

  await prisma.productStock.update({
    where: { productId: 35 },
    data: { quantity: 1 }, // 3 - 2 (sales)
  });

  console.log('✅ ProductLedger and ProductStock seeding completed!');
  
  // Display summary
  const totalLedgerEntries = await prisma.productLedger.count();
  const totalStockEntries = await prisma.productStock.count();
  
  console.log(`📋 Summary:`);
  console.log(`   - ProductLedger entries: ${totalLedgerEntries}`);
  console.log(`   - ProductStock entries: ${totalStockEntries}`);
  console.log(`   - Stock movements include: purchases, production consumption, finished goods, quality returns, emergency purchases, and sales`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });