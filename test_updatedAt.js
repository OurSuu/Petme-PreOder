const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`UPDATE "Order" SET "updatedAt" = NOW() WHERE id = 12`;
  const orders = await prisma.order.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, updatedAt: true }
  });
  console.log(orders);
}

main().catch(console.error).finally(() => prisma.$disconnect());
