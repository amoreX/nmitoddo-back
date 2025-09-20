const {
  PrismaClient,
  Role,
  OrderStatus,
  WorkStatus,
  MovementType,
} = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data in dependency order...");
  // Clear data in dependency order (child tables first)
  await prisma.workOrder.deleteMany();
  await prisma.manufacturingOrder.deleteMany();
  await prisma.mOPresets.deleteMany();
  await prisma.billOfMaterial.deleteMany();
  await prisma.productLedger.deleteMany();
  await prisma.productStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.workCenter.deleteMany();
  await prisma.report.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create users with hashed passwords
  console.log("Creating users...");
  const saltRounds = 12;
  
  const users = [
    {
      name: "Keshav Joshi",
      email: "keshav@example.com",
      loginId: "keshav",
      password: await bcrypt.hash("Password@123", saltRounds),
      role: Role.admin,
    },
    {
      name: "Nihal",
      email: "nihal@example.com",
      loginId: "nihal", 
      password: await bcrypt.hash("nihal", saltRounds),
      role: Role.manager,
    },
    {
      name: "Ronish",
      email: "ronish@example.com",
      loginId: "ronish",
      password: await bcrypt.hash("ronish", saltRounds),
      role: Role.user,
    },
  ];

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log("Users seeded");

  // Get users for assignments
  const admin = await prisma.user.findFirst({ where: { role: Role.admin } });
  const manager = await prisma.user.findFirst({ where: { role: Role.manager } });
  const user = await prisma.user.findFirst({ where: { role: Role.user } });

  // Create Work Centers first
  console.log("Creating work centers...");
  const assemblyLine = await prisma.workCenter.create({
    data: { 
      name: "Assembly Line", 
      location: "Production Floor A", 
      capacityPerHour: 6, 
      costPerHour: 25.0,
      createdById: admin.id 
    }
  });
  const paintFloor = await prisma.workCenter.create({
    data: { 
      name: "Paint Floor", 
      location: "Painting Bay B", 
      capacityPerHour: 12, 
      costPerHour: 20.0,
      createdById: admin.id 
    }
  });
  const packagingLine = await prisma.workCenter.create({
    data: { 
      name: "Packaging Line", 
      location: "Shipping Area C", 
      capacityPerHour: 18, 
      costPerHour: 15.0,
      createdById: admin.id 
    }
  });

    // Step 1: Create component/material products for Dining Table
  console.log("Creating Dining Table components...");
  const diningTableLegs = await prisma.product.create({
    data: { name: "Wooden Legs - Dining", description: "Solid oak table legs", unit: "pieces" }
  });
  const diningTableTop = await prisma.product.create({
    data: { name: "Wooden Top - Dining", description: "Large dining table surface", unit: "pieces" }
  });
  const tableScrews = await prisma.product.create({
    data: { name: "Wood Screws", description: "Heavy-duty wood screws", unit: "pieces" }
  });
  const oakVarnish = await prisma.product.create({
    data: { name: "Oak Varnish", description: "Premium wood finish", unit: "bottles" }
  });
  const sandpaper = await prisma.product.create({
    data: { name: "Sandpaper", description: "Fine-grit sandpaper", unit: "sheets" }
  });

  // Step 2: Create component products for Coffee Table
  console.log("Creating Coffee Table components...");
  const coffeeTableLegs = await prisma.product.create({
    data: { name: "Wooden Legs - Coffee", description: "Short coffee table legs", unit: "pieces" }
  });
  const coffeeTableTop = await prisma.product.create({
    data: { name: "Wooden Top - Coffee", description: "Round coffee table surface", unit: "pieces" }
  });
  const metalBrackets = await prisma.product.create({
    data: { name: "Metal Brackets", description: "Reinforcement brackets", unit: "pieces" }
  });
  const clearVarnish = await prisma.product.create({
    data: { name: "Clear Varnish", description: "Transparent wood finish", unit: "bottles" }
  });
  const foamPadding = await prisma.product.create({
    data: { name: "Foam Padding", description: "Protective packaging foam", unit: "sheets" }
  });

  // Step 3: Create component products for Office Desk
  console.log("Creating Office Desk components...");
  const deskLegs = await prisma.product.create({
    data: { name: "Wooden Legs - Desk", description: "Adjustable desk legs", unit: "pieces" }
  });
  const deskTop = await prisma.product.create({
    data: { name: "Wooden Top - Desk", description: "Rectangular desk surface", unit: "pieces" }
  });
  const deskDrawer = await prisma.product.create({
    data: { name: "Desk Drawer", description: "Side drawer unit", unit: "pieces" }
  });
  const drawerSlides = await prisma.product.create({
    data: { name: "Drawer Slides", description: "Heavy-duty drawer slides", unit: "pairs" }
  });
  const deskVarnish = await prisma.product.create({
    data: { name: "Mahogany Varnish", description: "Rich mahogany finish", unit: "bottles" }
  });

  // Step 2: Create components for MO Preset 2: Gaming Desktop
  console.log("Creating Gaming Desktop components...");
  const amdProcessor = await prisma.product.create({
    data: { name: "AMD Ryzen 9 CPU", description: "Gaming processor", unit: "pieces" }
  });
  const gamingGpu = await prisma.product.create({
    data: { name: "NVIDIA RTX 4080", description: "High-end graphics card", unit: "pieces" }
  });
  const ddr5Ram = await prisma.product.create({
    data: { name: "32GB DDR5 RAM", description: "Gaming memory kit", unit: "pieces" }
  });
  const motherboard = await prisma.product.create({
    data: { name: "Gaming Motherboard", description: "ATX gaming motherboard", unit: "pieces" }
  });
  const powerSupply = await prisma.product.create({
    data: { name: "850W PSU", description: "Modular power supply", unit: "pieces" }
  });

  // Step 3: Create components for MO Preset 3: Office Workstation
  console.log("Creating Office Workstation components...");
  const workstationCpu = await prisma.product.create({
    data: { name: "Intel Xeon CPU", description: "Professional processor", unit: "pieces" }
  });
  const eccRam = await prisma.product.create({
    data: { name: "64GB ECC RAM", description: "Error-correcting memory", unit: "pieces" }
  });
  const workstationGpu = await prisma.product.create({
    data: { name: "Quadro RTX A4000", description: "Professional graphics", unit: "pieces" }
  });
  const nvmeSsd = await prisma.product.create({
    data: { name: "1TB NVMe SSD", description: "Professional storage", unit: "pieces" }
  });
  const workstationCase = await prisma.product.create({
    data: { name: "Tower Case", description: "Full tower case", unit: "pieces" }
  });

  console.log("Components created");

  // Step 4: Create finished products for MOPresets
  console.log("Creating finished products...");
  
  const diningTableProduct = await prisma.product.create({
    data: { name: "Dining Table - Oak", description: "6-seater oak dining table", unit: "pieces" }
  });
  const coffeeTableProduct = await prisma.product.create({
    data: { name: "Coffee Table - Round", description: "Round coffee table with storage", unit: "pieces" }
  });
  const officeDeskProduct = await prisma.product.create({
    data: { name: "Office Desk - Executive", description: "Executive mahogany desk with drawers", unit: "pieces" }
  });

  console.log("Finished products created");

  // Step 5: Create Bill of Materials with separate operation and opDurationMins
  console.log("Creating Bill of Materials...");
  
  // Dining Table BoM - Following the example: 4 × Wooden Legs Assembly 60 mins, 1 × Wooden Top Painting 30 mins, 12 × Screws Packing 20 mins, 1 × Varnish Bottle
  await prisma.billOfMaterial.createMany({
    data: [
      { productId: diningTableProduct.id, componentId: diningTableLegs.id, quantity: 4, operation: "Assembly", opDurationMins: 60 },
      { productId: diningTableProduct.id, componentId: diningTableTop.id, quantity: 1, operation: "Painting", opDurationMins: 30 },
      { productId: diningTableProduct.id, componentId: tableScrews.id, quantity: 12, operation: "Packing", opDurationMins: 20 },
      { productId: diningTableProduct.id, componentId: oakVarnish.id, quantity: 1, operation: "Finishing", opDurationMins: 15 },
      { productId: diningTableProduct.id, componentId: sandpaper.id, quantity: 3, operation: "Sanding", opDurationMins: 45 },
    ]
  });

  // Coffee Table BoM
  await prisma.billOfMaterial.createMany({
    data: [
      { productId: coffeeTableProduct.id, componentId: coffeeTableLegs.id, quantity: 4, operation: "Assembly", opDurationMins: 45 },
      { productId: coffeeTableProduct.id, componentId: coffeeTableTop.id, quantity: 1, operation: "Painting", opDurationMins: 25 },
      { productId: coffeeTableProduct.id, componentId: tableScrews.id, quantity: 8, operation: "Packing", opDurationMins: 15 },
      { productId: coffeeTableProduct.id, componentId: metalBrackets.id, quantity: 4, operation: "Assembly", opDurationMins: 20 },
      { productId: coffeeTableProduct.id, componentId: clearVarnish.id, quantity: 1, operation: "Finishing", opDurationMins: 20 },
    ]
  });

  // Office Desk BoM
  await prisma.billOfMaterial.createMany({
    data: [
      { productId: officeDeskProduct.id, componentId: deskLegs.id, quantity: 4, operation: "Assembly", opDurationMins: 50 },
      { productId: officeDeskProduct.id, componentId: deskTop.id, quantity: 1, operation: "Painting", opDurationMins: 40 },
      { productId: officeDeskProduct.id, componentId: deskDrawer.id, quantity: 2, operation: "Assembly", opDurationMins: 35 },
      { productId: officeDeskProduct.id, componentId: drawerSlides.id, quantity: 2, operation: "Assembly", opDurationMins: 25 },
      { productId: officeDeskProduct.id, componentId: tableScrews.id, quantity: 16, operation: "Packing", opDurationMins: 25 },
      { productId: officeDeskProduct.id, componentId: deskVarnish.id, quantity: 1, operation: "Finishing", opDurationMins: 30 },
    ]
  });

  console.log("Bill of Materials created");

  // Step 6: Create MOPresets linked to the products
  console.log("Creating MOPresets...");
  const diningTablePreset = await prisma.mOPresets.create({
    data: {
      name: "Dining Table - Oak Standard",
      description: "6-seater oak dining table with premium finish",
      quantity: 5,
      productId: diningTableProduct.id,
      createdById: admin.id,
    },
  });
  
  const coffeeTablePreset = await prisma.mOPresets.create({
    data: {
      name: "Coffee Table - Round Standard",
      description: "Round coffee table with storage compartment",
      quantity: 8,
      productId: coffeeTableProduct.id,
      createdById: admin.id,
    },
  });
  
  const officeDeskPreset = await prisma.mOPresets.create({
    data: {
      name: "Office Desk - Executive Series",
      description: "Executive mahogany desk with drawers",
      quantity: 3,
      productId: officeDeskProduct.id,
      createdById: admin.id,
    },
  });

  console.log("MOPresets created");

  // Step 7: Create Manufacturing Orders from the presets
  console.log("Creating Manufacturing Orders...");
  const diningTableMO = await prisma.manufacturingOrder.create({
    data: {
      quantity: diningTablePreset.quantity,
      status: OrderStatus.confirmed,
      productId: diningTableProduct.id,
      createdById: admin.id,
      assignedToId: manager.id,
      scheduleStartDate: new Date('2024-10-01'),
      deadline: new Date('2024-10-15'),
    },
  });

  const coffeeTableMO = await prisma.manufacturingOrder.create({
    data: {
      quantity: coffeeTablePreset.quantity,
      status: OrderStatus.in_progress,
      productId: coffeeTableProduct.id,
      createdById: admin.id,
      assignedToId: manager.id,
      scheduleStartDate: new Date('2024-09-25'),
      deadline: new Date('2024-10-10'),
    },
  });

  const officeDeskMO = await prisma.manufacturingOrder.create({
    data: {
      quantity: officeDeskPreset.quantity,
      status: OrderStatus.draft,
      productId: officeDeskProduct.id,
      createdById: admin.id,
      assignedToId: user.id,
      scheduleStartDate: new Date('2024-10-05'),
      deadline: new Date('2024-10-30'),
    },
  });

  // Step 8: Create Work Orders for each Manufacturing Order
  console.log("Creating Work Orders...");
  
  // Work Orders for Dining Table MO - Following the example: Assembly @ Assembly Line 60 mins, Painting @ Paint Floor 30 mins, Packing @ Packaging Line 20 mins
  await prisma.workOrder.createMany({
    data: [
      {
        operation: "Assembly",
        status: WorkStatus.completed,
        moId: diningTableMO.id,
        workCenterId: assemblyLine.id,
        assignedToId: user.id,
        durationMins: 60,
        durationDoneMins: 58,
        startedAt: new Date('2024-10-01T09:00:00Z'),
        completedAt: new Date('2024-10-01T09:58:00Z'),
      },
      {
        operation: "Painting", 
        status: WorkStatus.completed,
        moId: diningTableMO.id,
        workCenterId: paintFloor.id,
        assignedToId: user.id,
        durationMins: 30,
        durationDoneMins: 30,
        startedAt: new Date('2024-10-01T10:30:00Z'),
        completedAt: new Date('2024-10-01T11:00:00Z'),
      },
      {
        operation: "Packing",
        status: WorkStatus.started,
        moId: diningTableMO.id,
        workCenterId: packagingLine.id,
        assignedToId: user.id,
        durationMins: 20,
        durationDoneMins: 10,
        startedAt: new Date('2024-10-01T11:30:00Z'),
      },
    ]
  });

  // Work Orders for Coffee Table MO
  await prisma.workOrder.createMany({
    data: [
      {
        operation: "Assembly",
        status: WorkStatus.completed,
        moId: coffeeTableMO.id,
        workCenterId: assemblyLine.id,
        assignedToId: manager.id,
        durationMins: 45,
        durationDoneMins: 47,
        startedAt: new Date('2024-09-25T08:00:00Z'),
        completedAt: new Date('2024-09-25T08:47:00Z'),
      },
      {
        operation: "Painting",
        status: WorkStatus.completed,
        moId: coffeeTableMO.id,
        workCenterId: paintFloor.id,
        assignedToId: user.id,
        durationMins: 25,
        durationDoneMins: 25,
        startedAt: new Date('2024-09-25T09:15:00Z'),
        completedAt: new Date('2024-09-25T09:40:00Z'),
      },
      {
        operation: "Packing",
        status: WorkStatus.to_do,
        moId: coffeeTableMO.id,
        workCenterId: packagingLine.id,
        assignedToId: manager.id,
        durationMins: 15,
        durationDoneMins: 0,
      },
    ]
  });

  // Work Orders for Office Desk MO (draft status)
  await prisma.workOrder.createMany({
    data: [
      {
        operation: "Assembly",
        status: WorkStatus.to_do,
        moId: officeDeskMO.id,
        workCenterId: assemblyLine.id,
        assignedToId: user.id,
        durationMins: 50,
        durationDoneMins: 0,
      },
      {
        operation: "Painting",
        status: WorkStatus.to_do,
        moId: officeDeskMO.id,
        workCenterId: paintFloor.id,
        assignedToId: user.id,
        durationMins: 40,
        durationDoneMins: 0,
      },
    ]
  });

  console.log("Work Orders created");

  console.log("MOPresets and related data seeded successfully");

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
