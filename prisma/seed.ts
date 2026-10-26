import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../server/auth.js';
import { sampleCategories, sampleMenuItems, sampleIngredients, sampleTables } from '../src/utils/sampleData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CrepettooPOS database...');

  // Users
  const adminPass = await hashPassword('admin123');
  const cashierPass = await hashPassword('cashier123');

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminPass, name: 'Admin', role: 'admin' },
  });
  await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: { username: 'cashier', password: cashierPass, name: 'Cashier', role: 'cashier' },
  });
  console.log('✅ Users created');

  // Categories
  const categoryMap: Record<string, string> = {};
  for (const cat of sampleCategories) {
    const existing = await prisma.menuCategory.findUnique({ where: { name: cat.name } });
    if (existing) {
      categoryMap[cat.name] = existing.id;
    } else {
      const created = await prisma.menuCategory.create({ data: cat });
      categoryMap[cat.name] = created.id;
    }
  }
  console.log('✅ Categories created');

  // Menu Items
  const categoryNames = Object.keys(categoryMap);
  for (let i = 0; i < sampleMenuItems.length; i++) {
    const item = sampleMenuItems[i];
    const catIndex = i < 6 ? 0 : i < 10 ? 1 : i < 16 ? 2 : i < 20 ? 3 : i < 23 ? 5 : 4;
    const catName = categoryNames[catIndex] || categoryNames[0];
    const categoryId = categoryMap[catName];

    const existing = await prisma.menuItem.findFirst({ where: { barcode: item.barcode } });
    if (!existing) {
      await prisma.menuItem.create({
        data: { ...item, categoryId } as any,
      });
    }
  }
  console.log('✅ Menu items created');

  // Ingredients
  for (const ing of sampleIngredients) {
    const existing = await prisma.ingredient.findFirst({ where: { name: ing.name } });
    if (!existing) {
      await prisma.ingredient.create({ data: ing as any });
    }
  }
  console.log('✅ Ingredients created');

  // Tables
  for (const table of sampleTables) {
    const existing = await prisma.table.findUnique({ where: { number: table.number } });
    if (!existing) {
      await prisma.table.create({ data: table });
    }
  }
  console.log('✅ Tables created');

  // Settings
  const defaultSettings: Record<string, string> = {
    storeName: JSON.stringify('Crepettoo'),
    storeNameAr: JSON.stringify('كريبتتو'),
    currency: JSON.stringify('DZD'),
    taxRate: JSON.stringify(19),
    receiptFooter: JSON.stringify('Merci pour votre visite!'),
    receiptFooterAr: JSON.stringify('شكراً لزيارتكم!'),
    lowStockThreshold: JSON.stringify(5),
    autoPrint: JSON.stringify(true),
    paperSize: JSON.stringify('80mm'),
    storeAddress: JSON.stringify('38 Bd Colonel Lotfi Boudghane, Sidi Bel Abbes'),
    storePhone: JSON.stringify('0550000000'),
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log('✅ Settings created');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
