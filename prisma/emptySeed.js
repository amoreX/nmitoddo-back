const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database clear process...');

  // Delete dependent records first
  await prisma.session.deleteMany();
  await prisma.report.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.manufacturingOrder.deleteMany();
  await prisma.billOfMaterial.deleteMany();
  await prisma.productStock.deleteMany();
  await prisma.productLedger.deleteMany();
  await prisma.workCenter.deleteMany();

  // Finally, delete primary entities
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database has been cleared.');
}

main()
  .catch((e) => {
    console.error('Error clearing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });