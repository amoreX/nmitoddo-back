const {
  PrismaClient,
  Role,
  OrderStatus,
  WorkStatus,
  MovementType,
} = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data");
  await prisma.session.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.manufacturingOrder.deleteMany();
  await prisma.stockLedger.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        fullName: "Alice Admin",
        email: "alice@example.com",
        loginId: "alice",
        passwordHash: "hashed-password-1",
        role: Role.admin,
      },
      {
        fullName: "Bob Manager",
        email: "bob@example.com",
        loginId: "bob",
        passwordHash: "hashed-password-2",
        role: Role.manager,
      },
      {
        fullName: "Charlie Operator",
        email: "charlie@example.com",
        loginId: "charlie",
        passwordHash: "hashed-password-3",
        role: Role.operator,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Users seeded");

  const admin = await prisma.user.findFirst({ where: { role: Role.admin } });
  const operator = await prisma.user.findFirst({
    where: { role: Role.operator },
  });

  const product = await prisma.product.create({
    data: {
      name: "Steel Rod",
      description: "High-quality steel rod",
      unit: "kg",
    },
  });

  const mo = await prisma.manufacturingOrder.create({
    data: {
      quantity: 100,
      status: OrderStatus.planned,
      productId: product.id,
      createdById: admin.id,
      assignedToId: operator.id,
    },
  });

  await prisma.workOrder.create({
    data: {
      operation: "Cutting",
      status: WorkStatus.planned,
      moId: mo.id,
      assignedToId: operator.id,
    },
  });

  await prisma.stockLedger.create({
    data: {
      movementType: MovementType.in,
      quantity: 50,
      productId: product.id,
      createdById: admin.id,
    },
  });

  console.log("Seeding finished");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
