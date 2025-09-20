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
  const cuttingStation = await prisma.workCenter.create({
    data: { 
      name: "Cutting Station", 
      location: "Workshop A", 
      capacityPerHour: 10, 
      costPerHour: 25.0,
      createdById: admin.id 
    }
  });
  const assemblyStation = await prisma.workCenter.create({
    data: { 
      name: "Assembly Station", 
      location: "Workshop B", 
      capacityPerHour: 8, 
      costPerHour: 30.0,
      createdById: admin.id 
    }
  });
  const finishingStation = await prisma.workCenter.create({
    data: { 
      name: "Finishing Station", 
      location: "Workshop C", 
      capacityPerHour: 6, 
      costPerHour: 35.0,
      createdById: admin.id 
    }
  });

  // Step 1: Create component/material products for MO Preset 1: Premium Laptop
  console.log("Creating Premium Laptop components...");
  const intelProcessor = await prisma.product.create({
    data: { name: "Intel Core i7 Processor", description: "High-performance processor", unit: "pieces" }
  });
  const ramMemory = await prisma.product.create({
    data: { name: "16GB DDR4 RAM", description: "High-speed memory", unit: "pieces" }
  });
  const ssdStorage = await prisma.product.create({
    data: { name: "512GB NVMe SSD", description: "Fast storage drive", unit: "pieces" }
  });
  const laptopScreen = await prisma.product.create({
    data: { name: "15.6 4K Display", description: "Ultra HD display", unit: "pieces" }
  });
  const laptopBattery = await prisma.product.create({
    data: { name: "Lithium Battery", description: "Long-life battery", unit: "pieces" }
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
  
  const premiumLaptopProduct = await prisma.product.create({
    data: { name: "Premium Laptop A1", description: "High-end laptop configuration", unit: "Unit" }
  });
  const gamingDesktopProduct = await prisma.product.create({
    data: { name: "Gaming Desktop GX", description: "Ultimate gaming machine", unit: "Unit" }
  });
  const workstationProduct = await prisma.product.create({
    data: { name: "Office Workstation Pro", description: "Professional workstation", unit: "Unit" }
  });

  console.log("Finished products created");

  // Step 5: Create Bill of Materials with separate operation and opDurationMins
  console.log("Creating Bill of Materials...");
  
  // Premium Laptop BoM
  await prisma.billOfMaterial.createMany({
    data: [
      { productId: premiumLaptopProduct.id, componentId: intelProcessor.id, quantity: 1, operation: "CPU Installation", opDurationMins: 30 },
      { productId: premiumLaptopProduct.id, componentId: ramMemory.id, quantity: 1, operation: "Memory Installation", opDurationMins: 15 },
      { productId: premiumLaptopProduct.id, componentId: ssdStorage.id, quantity: 1, operation: "Storage Installation", opDurationMins: 20 },
      { productId: premiumLaptopProduct.id, componentId: laptopScreen.id, quantity: 1, operation: "Display Assembly", opDurationMins: 45 },
      { productId: premiumLaptopProduct.id, componentId: laptopBattery.id, quantity: 1, operation: "Battery Installation", opDurationMins: 25 },
    ]
  });

  // Gaming Desktop BoM
  await prisma.billOfMaterial.createMany({
    data: [
      { productId: gamingDesktopProduct.id, componentId: amdProcessor.id, quantity: 1, operation: "CPU Installation", opDurationMins: 35 },
      { productId: gamingDesktopProduct.id, componentId: gamingGpu.id, quantity: 1, operation: "GPU Installation", opDurationMins: 40 },
      { productId: gamingDesktopProduct.id, componentId: ddr5Ram.id, quantity: 1, operation: "Memory Installation", opDurationMins: 20 },
      { productId: gamingDesktopProduct.id, componentId: motherboard.id, quantity: 1, operation: "Motherboard Assembly", opDurationMins: 60 },
      { productId: gamingDesktopProduct.id, componentId: powerSupply.id, quantity: 1, operation: "PSU Installation", opDurationMins: 30 },
    ]
  });

  // Office Workstation BoM
  await prisma.billOfMaterial.createMany({
    data: [
      { productId: workstationProduct.id, componentId: workstationCpu.id, quantity: 1, operation: "Workstation CPU Install", opDurationMins: 40 },
      { productId: workstationProduct.id, componentId: eccRam.id, quantity: 1, operation: "ECC Memory Install", opDurationMins: 25 },
      { productId: workstationProduct.id, componentId: workstationGpu.id, quantity: 1, operation: "Professional GPU Install", opDurationMins: 35 },
      { productId: workstationProduct.id, componentId: nvmeSsd.id, quantity: 1, operation: "Enterprise Storage Install", opDurationMins: 30 },
      { productId: workstationProduct.id, componentId: workstationCase.id, quantity: 1, operation: "Case Assembly", opDurationMins: 50 },
    ]
  });

  console.log("Bill of Materials created");

  // Step 6: Create MOPresets linked to the products
  console.log("Creating MOPresets...");
  const laptopPreset = await prisma.mOPresets.create({
    data: {
      name: "Premium Laptop A1 - Standard Build",
      description: "High-end laptop configuration with premium components",
      quantity: 10,
      productId: premiumLaptopProduct.id,
      createdById: admin.id,
    },
  });
  
  const gamingPreset = await prisma.mOPresets.create({
    data: {
      name: "Gaming Desktop GX - Performance Build",
      description: "Ultimate gaming machine with top-tier components",
      quantity: 5,
      productId: gamingDesktopProduct.id,
      createdById: admin.id,
    },
  });
  
  const workstationPreset = await prisma.mOPresets.create({
    data: {
      name: "Office Workstation Pro - Enterprise",
      description: "Professional workstation for enterprise use",
      quantity: 15,
      productId: workstationProduct.id,
      createdById: admin.id,
    },
  });

  console.log("MOPresets created");

  // Step 7: Create Manufacturing Orders from the presets
  console.log("Creating Manufacturing Orders...");
  const laptopMO = await prisma.manufacturingOrder.create({
    data: {
      quantity: laptopPreset.quantity,
      status: OrderStatus.confirmed,
      productId: premiumLaptopProduct.id,
      createdById: admin.id,
      assignedToId: manager.id,
      scheduleStartDate: new Date('2024-10-01'),
      deadline: new Date('2024-10-15'),
    },
  });

  const gamingMO = await prisma.manufacturingOrder.create({
    data: {
      quantity: gamingPreset.quantity,
      status: OrderStatus.in_progress,
      productId: gamingDesktopProduct.id,
      createdById: admin.id,
      assignedToId: manager.id,
      scheduleStartDate: new Date('2024-09-25'),
      deadline: new Date('2024-10-10'),
    },
  });

  const workstationMO = await prisma.manufacturingOrder.create({
    data: {
      quantity: workstationPreset.quantity,
      status: OrderStatus.draft,
      productId: workstationProduct.id,
      createdById: admin.id,
      assignedToId: user.id,
      scheduleStartDate: new Date('2024-10-05'),
      deadline: new Date('2024-10-30'),
    },
  });

  // Step 8: Create Work Orders for each Manufacturing Order
  console.log("Creating Work Orders...");
  
  // Work Orders for Laptop MO
  await prisma.workOrder.createMany({
    data: [
      {
        operation: "CPU Installation",
        status: WorkStatus.completed,
        moId: laptopMO.id,
        workCenterId: assemblyStation.id,
        assignedToId: user.id,
        durationMins: 30,
        durationDoneMins: 28,
        startedAt: new Date('2024-10-01T09:00:00Z'),
        completedAt: new Date('2024-10-01T09:28:00Z'),
      },
      {
        operation: "Memory Installation", 
        status: WorkStatus.completed,
        moId: laptopMO.id,
        workCenterId: assemblyStation.id,
        assignedToId: user.id,
        durationMins: 15,
        durationDoneMins: 15,
        startedAt: new Date('2024-10-01T09:30:00Z'),
        completedAt: new Date('2024-10-01T09:45:00Z'),
      },
      {
        operation: "Display Assembly",
        status: WorkStatus.started,
        moId: laptopMO.id,
        workCenterId: assemblyStation.id,
        assignedToId: user.id,
        durationMins: 45,
        durationDoneMins: 20,
        startedAt: new Date('2024-10-01T10:00:00Z'),
      },
    ]
  });

  // Work Orders for Gaming Desktop MO
  await prisma.workOrder.createMany({
    data: [
      {
        operation: "Motherboard Assembly",
        status: WorkStatus.completed,
        moId: gamingMO.id,
        workCenterId: assemblyStation.id,
        assignedToId: manager.id,
        durationMins: 60,
        durationDoneMins: 65,
        startedAt: new Date('2024-09-25T08:00:00Z'),
        completedAt: new Date('2024-09-25T09:05:00Z'),
      },
      {
        operation: "GPU Installation",
        status: WorkStatus.completed,
        moId: gamingMO.id,
        workCenterId: assemblyStation.id,
        assignedToId: user.id,
        durationMins: 40,
        durationDoneMins: 38,
        startedAt: new Date('2024-09-25T09:15:00Z'),
        completedAt: new Date('2024-09-25T09:53:00Z'),
      },
      {
        operation: "Final Testing",
        status: WorkStatus.to_do,
        moId: gamingMO.id,
        workCenterId: finishingStation.id,
        assignedToId: manager.id,
        durationMins: 90,
        durationDoneMins: 0,
      },
    ]
  });

  // Work Orders for Workstation MO (draft status)
  await prisma.workOrder.createMany({
    data: [
      {
        operation: "Workstation CPU Install",
        status: WorkStatus.to_do,
        moId: workstationMO.id,
        workCenterId: assemblyStation.id,
        assignedToId: user.id,
        durationMins: 40,
        durationDoneMins: 0,
      },
      {
        operation: "ECC Memory Install",
        status: WorkStatus.to_do,
        moId: workstationMO.id,
        workCenterId: assemblyStation.id,
        assignedToId: user.id,
        durationMins: 25,
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
