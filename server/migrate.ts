import prisma from './db.js';

const REQUIRED_TABLES = [
  'User',
  'MenuCategory',
  'MenuItem',
  'Ingredient',
  'Table',
  'Order',
  'OrderItem',
  'StockMovement',
  'DailyReport',
  'AuditLog',
  'Setting',
  'Expense',
];

export async function ensureSchema(): Promise<void> {
  const result = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma_%'"
  );
  const existing = new Set(result.map((r) => r.name));
  const missing = REQUIRED_TABLES.filter((t) => !existing.has(t));

  if (missing.length > 0) {
    console.log(`[migrate] Missing tables detected: ${missing.join(', ')}`);
    console.log('[migrate] Running prisma db push...');
    const { execSync } = await import('node:child_process');
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    console.log('[migrate] Schema synchronized');
  } else {
    console.log('[migrate] All tables present');
  }
}
