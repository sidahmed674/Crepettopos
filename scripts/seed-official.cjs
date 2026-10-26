// Wipe ALL data and seed official Crepettoo menu (from Word doc) + tables.
// Run with DATABASE_URL env pointing at target DB.
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const MENU = [
  { name: 'Nos Mojitos', nameAr: 'الموخيتو', nameFr: 'Nos Mojitos', sortOrder: 1,
    items: [
      ['Classic', 350], ['Framboise', 450], ['Blue Mojito', 450], ['Fraise Mojito', 450], ['Energy Mojito', 500],
    ] },
  { name: 'Jus Pressés', nameAr: 'العصائر الطبيعية', nameFr: 'Jus Pressés', sortOrder: 2,
    items: [
      ["Jus de Citron", 350], ["Jus de Banane", 350], ["Jus d'Orange", 400], ["Jus de Pêche", 400],
      ["Jus de Fraise", 450], ["Jus de Cocktail", 500], ["Salade de Fruits", 450],
    ] },
  { name: 'Milk-shakes & Mixologie', nameAr: 'ميلك شيك وموكتيل', nameFr: 'Milk-shakes & Mixologie', sortOrder: 3,
    items: [
      ['Banane', 350], ['Vanille', 350], ['Choco / Vanille', 400], ['Fraise', 400], ['Chocolat', 450],
      ['Lotus', 450], ['Chocolat Banane', 500], ['Brownie', 500], ['Milkshake Healthy', 500],
      ['Tropical', 450], ['The Dark', 450], ['Pink Colada', 450], ['Bleu Iceberg', 450], ['Piña Colada', 500],
    ] },
  { name: 'Boissons Chaudes & Café', nameAr: 'المشروبات الساخنة والقهوة', nameFr: 'Boissons Chaudes & Café', sortOrder: 4,
    items: [
      ['Café Simple', 100], ['Américaino', 150], ['Thé Lipton', 150], ['Café (Noisette / Caramel)', 200],
      ['Café Maxwell', 200], ['Café Bombo', 150], ["Café (l'Or / Caps)", 200], ['Café au Chocolat Noir', 200],
      ['Nespresso', 250], ['Lait', 100], ['Café au Lait', 150], ['Cappuccino', 200], ['Lait Chocolat', 200],
      ['Café Mocha', 250], ['Hot Chocolate', 450], ['Iced Coffee Classic', 350], ['Iced Coffee Vanille', 400],
      ['Iced Coffee Caramel', 400], ['Iced Coffee Chocolat', 450],
    ] },
  { name: 'Cheesecake & Tiramisu & Mégas Crêpes', nameAr: 'تشيز كيك وتيراميسو وميجا كريب', nameFr: 'Cheesecake & Tiramisu & Mégas Crêpes', sortOrder: 5,
    items: [
      ['Cheesecake au Choix', 450], ['Saint Sébastien Chocolat', 450], ['Saint Sébastien Lotus', 500],
      ['Saint Sébastien Pistachio', 600], ['Tiramisu Classique', 500], ['Tiramisu au Choix', 600],
      ['Tiramisu Mokassirat', 700], ['Méga Fruits', 3500], ['Cœur Frais', 3500], ['Méga Mix', 4500],
      ['Méga Crepettoo', 5800],
    ] },
  { name: 'Assiettes & Crêpes Sushi', nameAr: 'أطباق وكريب سوشي', nameFr: 'Assiettes & Crêpes Sushi', sortOrder: 6,
    items: [
      ['Brownie (Assiette)', 450], ['Fruita (Assiette)', 500], ['Lotus (Assiette)', 550],
      ['Chocolat (Assiette)', 550], ['Infinity (Assiette)', 650], ['Pistache (Assiette)', 650],
      ['Magique (Assiette)', 750],
      ['Sushi Banane', 550, 'banane + crème maison + tasse chocolat'],
      ['Sushi Brownies', 600, 'brownie + crème maison + tasse chocolat'],
      ['Sushi Fruit', 600, 'fruit + crème maison + tasse chocolat'],
      ['Sushi Kiwi', 650, 'kiwi + crème maison + tasse chocolat'],
    ] },
  { name: 'Pancakes', nameAr: 'بان كيك', nameFr: 'Pancakes', sortOrder: 7,
    items: [
      ['Miel / Confiture', 250], ['Chocolat', 350], ['Beurre de Cacahuète', 350], ['Banane', 450],
      ['Mixte Fruits', 500], ['Délice (Fruits Secs)', 550], ['Burger Chocolat', 650], ['Burger Lotus', 700],
      ['Burger Pistache', 750], ['Pancake Healthy', 600],
    ] },
  { name: 'Gaufres', nameAr: 'غوفري', nameFr: 'Gaufres', sortOrder: 8,
    items: [
      ['Miel / Confiture', 250], ['Chocolat', 350], ['Banane', 400], ['Fruita', 500], ['Lotus', 500],
      ['Pistachio', 650], ['Spécial', 650], ['Crepettoo', 750],
    ] },
  { name: 'Crêpes Française', nameAr: 'كريب فرنسي', nameFr: 'Crêpes Française', sortOrder: 9,
    items: [
      ['Confiture', 250], ['Chocolat', 350], ['Spaghetti', 400], ['Roulée', 450], ['Banana', 450],
      ['Fruita', 500], ['Japonaise', 650], ['Pistachio', 700], ['Magique', 750],
    ] },
  { name: 'Crêpes Croustillantes', nameAr: 'كريب مقرمش', nameFr: 'Crêpes Croustillantes', sortOrder: 10,
    items: [
      ['Chocolat', 300], ['Banane', 400], ['Ananas', 400], ['Fraise', 450], ['Fruita (3 Fruits)', 450],
      ['Noix', 550], ['Lotus', 550], ['Pistachio', 650], ['Crepettoo', 750],
    ] },
  { name: 'Menu Dubai', nameAr: 'منيو دبي', nameFr: 'Menu Dubai', sortOrder: 11,
    items: [
      ['Brownies Dubai', 450], ['Cheesecake Dubai', 500], ['Crêpe Croustillante Dubai', 650],
      ['Crêpe Française Dubai', 650], ['Crêpe Roulée Dubai', 650], ['Cake Dubai', 900], ['Milkshake Dubai', 550],
    ] },
  { name: 'Suppléments', nameAr: 'الإضافات', nameFr: 'Suppléments', sortOrder: 12,
    items: [
      ['Fruits', 100],
      ['Nutella - Boule de glace au choix - Lotus - Chocolat - Pistache - Beurre de cacahuète - Nestlé - Fruits secs', 200],
    ] },
];

const TABLES = [
  ...Array.from({ length: 10 }, (_, i) => ({ number: i + 1, name: `T${i + 1}`, capacity: 4, zone: 'interieur' })),
  { number: 11, name: 'C1', capacity: 2, zone: 'comptoir' },
  { number: 12, name: 'C2', capacity: 2, zone: 'comptoir' },
  { number: 13, name: 'TR1', capacity: 4, zone: 'terrasse' },
  { number: 14, name: 'TR2', capacity: 4, zone: 'terrasse' },
  { number: 15, name: 'TR3', capacity: 4, zone: 'terrasse' },
  { number: 16, name: 'TR4', capacity: 4, zone: 'terrasse' },
];

(async () => {
  console.log('DB:', process.env.DATABASE_URL);

  // 1) WIPE EVERYTHING (FK-safe order)
  await p.orderItem.deleteMany();
  await p.order.deleteMany();
  await p.stockMovement.deleteMany();
  await p.ingredient.deleteMany();
  await p.auditLog.deleteMany();
  await p.dailyReport.deleteMany();
  await p.expense.deleteMany();
  await p.setting.deleteMany();
  await p.menuItem.deleteMany();
  await p.menuCategory.deleteMany();
  await p.table.deleteMany();
  await p.user.deleteMany();
  console.log('wiped: orders/items, ingredients/movements, audits, reports, expenses, settings, menu, tables, users');

  // 2) SEED MENU
  for (const cat of MENU) {
    const created = await p.menuCategory.create({
      data: { name: cat.name, nameAr: cat.nameAr, nameFr: cat.nameFr, sortOrder: cat.sortOrder, active: true },
    });
    await p.menuItem.createMany({
      data: cat.items.map(([name, price, desc]) => ({
        name,
        nameAr: name,
        nameFr: name,
        description: desc || null,
        descriptionFr: desc || null,
        price,
        costPrice: 0,
        categoryId: created.id,
        available: true,
      })),
    });
    console.log(`category "${cat.name}": ${cat.items.length} items`);
  }

  // 3) SEED TABLES
  await p.table.createMany({ data: TABLES });
  console.log(`tables: ${TABLES.length} (10 interieur + 2 comptoir + 4 terrasse)`);

  // 4) summary counts
  const [cats, items, tbl] = await Promise.all([
    p.menuCategory.count(), p.menuItem.count(), p.table.count(),
  ]);
  console.log(`RESULT: categories=${cats} items=${items} tables=${tbl}`);
})()
  .catch((e) => { console.error('ERR:', e.message); process.exit(1); })
  .finally(() => p.$disconnect());
