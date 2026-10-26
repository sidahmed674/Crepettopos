import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [users, cats, items, ings, tables, settings, orders] = await Promise.all([
    prisma.user.count(),
    prisma.menuCategory.count(),
    prisma.menuItem.count(),
    prisma.ingredient.count(),
    prisma.table.count(),
    prisma.setting.count(),
    prisma.order.count(),
  ]);
  console.log(JSON.stringify({ users, cats, items, ings, tables, settings, orders }));
  const catList = await prisma.menuCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  for (const c of catList) {
    const n = await prisma.menuItem.count({ where: { categoryId: c.id } });
    console.log(`CAT: ${c.name} | ar=${c.nameAr} | fr=${c.nameFr} | sort=${c.sortOrder} | items=${n}`);
  }
  const sample = await prisma.menuItem.findMany({ take: 3 });
  for (const i of sample) {
    console.log(`ITEM: name=${i.name} | ar=${i.nameAr} | fr=${i.nameFr} | price=${i.price} | barcode=${i.barcode} | desc=${i.description}`);
  }
}

main().finally(() => prisma.$disconnect());
