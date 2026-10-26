import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDemo() {
  console.log('Cleaning up demo data...');
  
  await prisma.orderItem.deleteMany();
  console.log('  Deleted all order items');
  
  await prisma.order.deleteMany();
  console.log('  Deleted all orders');
  
  await prisma.dailyReport.deleteMany();
  console.log('  Deleted all daily reports');
  
  await prisma.auditLog.deleteMany();
  console.log('  Deleted all audit logs');
  
  await prisma.stockMovement.deleteMany();
  console.log('  Deleted all stock movements');
  
  await prisma.expense.deleteMany();
  console.log('  Deleted all expenses');
  
  await prisma.menuItem.deleteMany();
  console.log('  Deleted all menu items');
  
  await prisma.menuCategory.deleteMany();
  console.log('  Deleted all menu categories');
  
  await prisma.ingredient.deleteMany();
  console.log('  Deleted all ingredients');
  
  await prisma.table.deleteMany();
  console.log('  Deleted all tables');
  
  await prisma.setting.deleteMany();
  console.log('  Deleted all settings');
  
  await prisma.user.deleteMany();
  console.log('  Deleted all users');
  
  console.log('\nCleanup complete. Run `npm run db:seed` to populate fresh data.');
}

cleanupDemo()
  .catch((e) => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
