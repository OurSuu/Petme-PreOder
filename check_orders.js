const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, customerName: true, status: true, secureToken: true, lineUid: true, createdAt: true }
  });
  console.log(orders);
}

main().catch(console.error).finally(() => prisma.$disconnect());
