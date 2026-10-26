import fs from 'fs';
import path from 'path';
import prisma from './db.js';

const MAX_BACKUPS = 30;

export function startAutoBackup(): void {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
  const resolvedDb = path.resolve(dbPath);
  const backupDir = path.join(path.dirname(resolvedDb), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  async function createBackup(): Promise<void> {
    try {
      if (!fs.existsSync(resolvedDb)) return;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupFile = path.join(backupDir, `auto-${timestamp}.db`);

      await prisma.$queryRaw`PRAGMA wal_checkpoint(TRUNCATE)`;

      fs.copyFileSync(resolvedDb, backupFile);
      console.log(`[backup] Auto-backup created: ${backupFile}`);

      const files = fs.readdirSync(backupDir)
        .filter((f) => f.startsWith('auto-') && f.endsWith('.db'))
        .sort();

      while (files.length > MAX_BACKUPS) {
        const oldest = files.shift()!;
        try {
          fs.unlinkSync(path.join(backupDir, oldest));
          console.log(`[backup] Cleaned old backup: ${oldest}`);
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('[backup] Auto-backup failed:', err);
    }
  }

  function getMillisecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  }

  setTimeout(() => {
    createBackup();
    setInterval(createBackup, 24 * 60 * 60 * 1000);
  }, getMillisecondsUntilMidnight());

  console.log('[backup] Auto-backup scheduler started (daily at midnight)');
}
