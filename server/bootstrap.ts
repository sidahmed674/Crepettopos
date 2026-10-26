import prisma from './db.js';
import { hashPassword } from './auth.js';

export async function bootstrap(): Promise<void> {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const hashed = await hashPassword('admin123');
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashed,
        name: 'Admin',
        role: 'admin',
        mustChangePassword: true,
      },
    });
    console.log('[bootstrap] Default admin user created (admin / admin123)');
  }

  const settingCount = await prisma.setting.count();
  if (settingCount === 0) {
    const defaults: Array<{ key: string; value: string }> = [
      { key: 'storeName', value: JSON.stringify('Crepettoo') },
      { key: 'storeNameAr', value: JSON.stringify('كريبتتو') },
      { key: 'storeAddress', value: JSON.stringify('') },
      { key: 'storePhone', value: JSON.stringify('') },
      { key: 'currency', value: JSON.stringify('DZD') },
      { key: 'taxRate', value: JSON.stringify(0) },
      { key: 'logo', value: JSON.stringify('') },
      { key: 'language', value: JSON.stringify('ar') },
      { key: 'receiptFooter', value: JSON.stringify('Merci pour votre visite!') },
      { key: 'receiptFooterAr', value: JSON.stringify('شكراً لزيارتكم!') },
      { key: 'autoPrint', value: JSON.stringify(true) },
      { key: 'paperSize', value: JSON.stringify('80mm') },
      { key: 'nif', value: JSON.stringify('') },
      { key: 'nis', value: JSON.stringify('') },
      { key: 'rc', value: JSON.stringify('') },
      { key: 'nfl', value: JSON.stringify('') },
    ];
    await prisma.setting.createMany({ data: defaults });
    console.log('[bootstrap] Default settings created');
  }

  const tableCount = await prisma.table.count();
  if (tableCount === 0) {
    const defaultTables = [
      { number: 1, name: 'T1', capacity: 2, zone: 'interieur' },
      { number: 2, name: 'T2', capacity: 2, zone: 'interieur' },
      { number: 3, name: 'T3', capacity: 4, zone: 'interieur' },
      { number: 4, name: 'T4', capacity: 4, zone: 'interieur' },
      { number: 5, name: 'T5', capacity: 6, zone: 'interieur' },
      { number: 6, name: 'Terrasse 1', capacity: 4, zone: 'terrasse' },
      { number: 7, name: 'Terrasse 2', capacity: 4, zone: 'terrasse' },
      { number: 8, name: 'Terrasse 3', capacity: 6, zone: 'terrasse' },
    ];
    await prisma.table.createMany({ data: defaultTables });
    console.log('[bootstrap] Default tables created (8 tables)');
  }

  const categoryCount = await prisma.menuCategory.count();
  if (categoryCount === 0) {
    const defaultCategories = [
      { name: 'Crepe Sucree', nameAr: 'كريب حلو', nameFr: 'Crêpe Sucrée', sortOrder: 1, active: true },
      { name: 'Crepe Salee', nameAr: 'كريب مالح', nameFr: 'Crêpe Salée', sortOrder: 2, active: true },
      { name: 'Boissons Chaudes', nameAr: 'مشروبات ساخنة', nameFr: 'Boissons Chaudes', sortOrder: 3, active: true },
      { name: 'Boissons Froides', nameAr: 'مشروبات باردة', nameFr: 'Boissons Froides', sortOrder: 4, active: true },
      { name: 'Desserts', nameAr: 'حلويات', nameFr: 'Desserts', sortOrder: 5, active: true },
      { name: 'Milkshakes', nameAr: 'ميلك شيك', nameFr: 'Milkshakes', sortOrder: 6, active: true },
    ];
    await prisma.menuCategory.createMany({ data: defaultCategories });
    console.log('[bootstrap] Default menu categories created');
  }
}
