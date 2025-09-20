const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ProductLedger and ProductStock data...');

  // Clear existing ProductLedger and ProductStock data
  console.log('🧹 Clearing existing stock data...');
  await prisma.productLedger.deleteMany();
  await prisma.productStock.deleteMany();

  // Get actual product IDs from database
  console.log('🔍 Fetching product IDs...');
  const diningTableLegs = await prisma.product.findFirst({ where: { name: { contains: 'Wooden Legs - Dining' } } });
  const diningTableTop = await prisma.product.findFirst({ where: { name: { contains: 'Wooden Top - Dining' } } });
  const tableScrews = await prisma.product.findFirst({ where: { name: { contains: 'Wood Screws' } } });
  const oakVarnish = await prisma.product.findFirst({ where: { name: { contains: 'Oak Varnish' } } });
  const sandpaper = await prisma.product.findFirst({ where: { name: { contains: 'Sandpaper' } } });
  
  const coffeeTableLegs = await prisma.product.findFirst({ where: { name: { contains: 'Wooden Legs - Coffee' } } });
  const coffeeTableTop = await prisma.product.findFirst({ where: { name: { contains: 'Wooden Top - Coffee' } } });
  const metalBrackets = await prisma.product.findFirst({ where: { name: { contains: 'Metal Brackets' } } });
  const clearVarnish = await prisma.product.findFirst({ where: { name: { contains: 'Clear Varnish' } } });
  const foamPadding = await prisma.product.findFirst({ where: { name: { contains: 'Foam Padding' } } });
  
  const deskLegs = await prisma.product.findFirst({ where: { name: { contains: 'Wooden Legs - Desk' } } });
  const deskTop = await prisma.product.findFirst({ where: { name: { contains: 'Wooden Top - Desk' } } });
  const deskDrawer = await prisma.product.findFirst({ where: { name: { contains: 'Desk Drawer' } } });
  const drawerSlides = await prisma.product.findFirst({ where: { name: { contains: 'Drawer Slides' } } });
  const deskVarnish = await prisma.product.findFirst({ where: { name: { contains: 'Mahogany Varnish' } } });

  // Get finished product IDs and corresponding MO IDs
  const diningTableProduct = await prisma.product.findFirst({ where: { name: { contains: 'Dining Table - Oak' } } });
  const coffeeTableProduct = await prisma.product.findFirst({ where: { name: { contains: 'Coffee Table - Round' } } });
  
  // Get MO IDs for products
  const diningTableMO = await prisma.manufacturingOrder.findFirst({ where: { productId: diningTableProduct?.id } });
  const coffeeTableMO = await prisma.manufacturingOrder.findFirst({ where: { productId: coffeeTableProduct?.id } });

  // Check if all products were found
  const products = [diningTableLegs, diningTableTop, tableScrews, oakVarnish, sandpaper, 
                   coffeeTableLegs, coffeeTableTop, metalBrackets, clearVarnish, foamPadding,
                   deskLegs, deskTop, deskDrawer, drawerSlides, deskVarnish];
                   
  if (products.some(p => !p)) {
    console.error('❌ Some products not found. Please run the main seed.js first.');
    process.exit(1);
  }

  // First, let's add some initial stock for raw materials (components)
  const componentStockData = [
    // Components for Dining Table
    { productId: diningTableLegs.id, quantity: 40, referenceType: 'purchase', movementType: 'in' }, // Wooden Legs - Dining (10 tables worth)
    { productId: diningTableTop.id, quantity: 10, referenceType: 'purchase', movementType: 'in' }, // Wooden Top - Dining
    { productId: tableScrews.id, quantity: 200, referenceType: 'purchase', movementType: 'in' }, // Wood Screws
    { productId: oakVarnish.id, quantity: 15, referenceType: 'purchase', movementType: 'in' }, // Oak Varnish
    { productId: sandpaper.id, quantity: 50, referenceType: 'purchase', movementType: 'in' }, // Sandpaper

    // Components for Coffee Table
    { productId: coffeeTableLegs.id, quantity: 32, referenceType: 'purchase', movementType: 'in' }, // Wooden Legs - Coffee (8 tables worth)
    { productId: coffeeTableTop.id, quantity: 8, referenceType: 'purchase', movementType: 'in' }, // Wooden Top - Coffee
    { productId: metalBrackets.id, quantity: 40, referenceType: 'purchase', movementType: 'in' }, // Metal Brackets
    { productId: clearVarnish.id, quantity: 12, referenceType: 'purchase', movementType: 'in' }, // Clear Varnish
    { productId: foamPadding.id, quantity: 25, referenceType: 'purchase', movementType: 'in' }, // Foam Padding

    // Components for Office Desk
    { productId: deskLegs.id, quantity: 20, referenceType: 'purchase', movementType: 'in' }, // Wooden Legs - Desk (5 desks worth)
    { productId: deskTop.id, quantity: 5, referenceType: 'purchase', movementType: 'in' }, // Wooden Top - Desk
    { productId: deskDrawer.id, quantity: 10, referenceType: 'purchase', movementType: 'in' }, // Desk Drawer
    { productId: drawerSlides.id, quantity: 10, referenceType: 'purchase', movementType: 'in' }, // Drawer Slides
    { productId: deskVarnish.id, quantity: 8, referenceType: 'purchase', movementType: 'in' }, // Mahogany Varnish
  ];

  // Add some consumption entries (simulate production usage)
  const consumptionData = [
    // Consumption for Dining Table production (2 units made)
    ...(diningTableMO ? [
      { productId: diningTableLegs.id, quantity: 8, referenceType: 'MO', referenceId: diningTableMO.id, movementType: 'out' }, // 4 legs × 2 tables
      { productId: diningTableTop.id, quantity: 2, referenceType: 'MO', referenceId: diningTableMO.id, movementType: 'out' }, // 1 top × 2 tables
      { productId: tableScrews.id, quantity: 24, referenceType: 'MO', referenceId: diningTableMO.id, movementType: 'out' }, // 12 screws × 2 tables
      { productId: oakVarnish.id, quantity: 2, referenceType: 'MO', referenceId: diningTableMO.id, movementType: 'out' }, // 1 bottle × 2 tables
      { productId: sandpaper.id, quantity: 6, referenceType: 'MO', referenceId: diningTableMO.id, movementType: 'out' }, // 3 sheets × 2 tables
    ] : []),

    // Consumption for Coffee Table production (3 units made)
    ...(coffeeTableMO ? [
      { productId: coffeeTableLegs.id, quantity: 12, referenceType: 'MO', referenceId: coffeeTableMO.id, movementType: 'out' }, // 4 legs × 3 tables
      { productId: coffeeTableTop.id, quantity: 3, referenceType: 'MO', referenceId: coffeeTableMO.id, movementType: 'out' }, // 1 top × 3 tables
      { productId: metalBrackets.id, quantity: 12, referenceType: 'MO', referenceId: coffeeTableMO.id, movementType: 'out' }, // 4 brackets × 3 tables
      { productId: clearVarnish.id, quantity: 3, referenceType: 'MO', referenceId: coffeeTableMO.id, movementType: 'out' }, // 1 bottle × 3 tables
      { productId: tableScrews.id, quantity: 24, referenceType: 'MO', referenceId: coffeeTableMO.id, movementType: 'out' }, // 8 screws × 3 tables
    ] : []),
  ];

  // Add finished goods production
  const finishedGoodsData = [
    // Finished Dining Tables (2 units produced)
    ...(diningTableProduct && diningTableMO ? [{ productId: diningTableProduct.id, quantity: 2, referenceType: 'MO', referenceId: diningTableMO.id, movementType: 'in' }] : []),
    
    // Finished Coffee Tables (3 units produced)
    ...(coffeeTableProduct && coffeeTableMO ? [{ productId: coffeeTableProduct.id, quantity: 3, referenceType: 'MO', referenceId: coffeeTableMO.id, movementType: 'in' }] : []),
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
  
    // Get office desk product for stock calculation
  const officeDeskProduct = await prisma.product.findFirst({ where: { name: { contains: 'Office Desk - Executive' } } });

  // Calculate final stock quantities (this would normally be calculated from ledger movements)
  const stockCalculations = [
    // Dining Table components after consumption (2 tables produced)
    { productId: diningTableLegs.id, quantity: 32 }, // Wooden Legs - Dining: 40 - 8 = 32
    { productId: diningTableTop.id, quantity: 8 }, // Wooden Top - Dining: 10 - 2 = 8
    { productId: oakVarnish.id, quantity: 13 }, // Oak Varnish: 15 - 2 = 13
    { productId: sandpaper.id, quantity: 44 }, // Sandpaper: 50 - 6 = 44
    
    // Coffee Table components after consumption (3 tables produced)
    { productId: coffeeTableLegs.id, quantity: 20 }, // Wooden Legs - Coffee: 32 - 12 = 20
    { productId: coffeeTableTop.id, quantity: 5 }, // Wooden Top - Coffee: 8 - 3 = 5
    { productId: metalBrackets.id, quantity: 28 }, // Metal Brackets: 40 - 12 = 28
    { productId: clearVarnish.id, quantity: 9 }, // Clear Varnish: 12 - 3 = 9
    { productId: foamPadding.id, quantity: 25 }, // Foam Padding: 25 - 0 = 25 (unused)
    
    // Office Desk components (no consumption yet)
    { productId: deskLegs.id, quantity: 20 }, // Wooden Legs - Desk
    { productId: deskTop.id, quantity: 5 }, // Wooden Top - Desk
    { productId: deskDrawer.id, quantity: 10 }, // Desk Drawer
    { productId: drawerSlides.id, quantity: 10 }, // Drawer Slides
    { productId: deskVarnish.id, quantity: 8 }, // Mahogany Varnish
    
    // Shared components (screws used by both dining and coffee tables)
    { productId: tableScrews.id, quantity: 152 }, // Wood Screws: 200 - 24 - 24 = 152
    
    // Finished goods
    ...(diningTableProduct ? [{ productId: diningTableProduct.id, quantity: 2 }] : []), // Dining Table: 2 produced
    ...(coffeeTableProduct ? [{ productId: coffeeTableProduct.id, quantity: 3 }] : []),  // Coffee Table: 3 produced
    ...(officeDeskProduct ? [{ productId: officeDeskProduct.id, quantity: 0 }] : []),  // Office Desk: 0 produced
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
    { productId: diningTableTop.id, quantity: 1, referenceType: 'quality_return', movementType: 'out' },
    { productId: clearVarnish.id, quantity: 1, referenceType: 'quality_return', movementType: 'out' },
    
    // Emergency purchase
    { productId: foamPadding.id, quantity: 10, referenceType: 'emergency_purchase', movementType: 'in' },
    
    // Sales/shipping (using actual finished product IDs)
    ...(diningTableProduct ? [{ productId: diningTableProduct.id, quantity: 1, referenceType: 'sales', movementType: 'out' }] : []),
    ...(coffeeTableProduct ? [{ productId: coffeeTableProduct.id, quantity: 2, referenceType: 'sales', movementType: 'out' }] : []),
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
    where: { productId: diningTableTop.id },
    data: { quantity: 7 }, // 8 - 1 (quality return)
  });

  await prisma.productStock.update({
    where: { productId: clearVarnish.id },
    data: { quantity: 8 }, // 9 - 1 (quality return)
  });

  await prisma.productStock.update({
    where: { productId: foamPadding.id },
    data: { quantity: 35 }, // 25 + 10 (emergency purchase)
  });

  if (diningTableProduct) {
    await prisma.productStock.update({
      where: { productId: diningTableProduct.id },
      data: { quantity: 1 }, // 2 - 1 (sales)
    });
  }

  if (coffeeTableProduct) {
    await prisma.productStock.update({
      where: { productId: coffeeTableProduct.id },
      data: { quantity: 1 }, // 3 - 2 (sales)
    });
  }

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