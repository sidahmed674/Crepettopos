import { Router, Request, Response } from 'express';
import { requireManager } from '../auth.js';
import { logAction } from '../audit.js';
import prisma from '../db.js';
import fs from 'fs';
import path from 'path';

const ALLOWED_BACKUP_EXTENSIONS = ['.db', '.sqlite', '.sqlite3'];

const router = Router();

router.get('/export', requireManager, async (req: Request, res: Response) => {
  try {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
    const resolvedPath = path.resolve(dbPath);

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'Database file not found' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `crepettoo-backup-${timestamp}.db`);

    // VACUUM INTO runs inside SQLite itself: no external sqlite3 CLI needed.
    const safeTarget = backupFile.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`VACUUM INTO '${safeTarget}'`);

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'export',
      entity: 'Backup',
      details: JSON.stringify({ file: backupFile }),
    });

    res.download(backupFile, `crepettoo-backup-${timestamp}.db`, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      setTimeout(() => {
        try {
          if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
        } catch { /* ignore */ }
      }, 60000);
    });
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

router.post('/restore', requireManager, async (req: Request, res: Response) => {
  try {
    if (!req.body || !req.body.backupPath) {
      return res.status(400).json({ error: 'backupPath required' });
    }

    const backupPath = req.body.backupPath as string;

    const ext = path.extname(backupPath).toLowerCase();
    if (!ALLOWED_BACKUP_EXTENSIONS.includes(ext)) {
      return res.status(400).json({ error: 'Invalid backup file type' });
    }

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    const backupSize = fs.statSync(backupPath).size;
    if (backupSize > 100 * 1024 * 1024) {
      return res.status(400).json({ error: 'Backup file too large (max 100MB)' });
    }

    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
    const resolvedPath = path.resolve(dbPath);

    const dbDir = path.dirname(resolvedPath);
    const preRestoreBackup = path.join(dbDir, `pre-restore-${Date.now()}.db`);
    fs.copyFileSync(resolvedPath, preRestoreBackup);

    try {
      fs.copyFileSync(backupPath, resolvedPath);
    } catch (err) {
      if (fs.existsSync(preRestoreBackup)) fs.copyFileSync(preRestoreBackup, resolvedPath);
      throw err;
    } finally {
      setTimeout(() => {
        try { if (fs.existsSync(preRestoreBackup)) fs.unlinkSync(preRestoreBackup); } catch { /* ignore */ }
      }, 300000);
    }

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'restore',
      entity: 'Backup',
      details: JSON.stringify({ from: backupPath }),
    });

    res.json({ message: 'Database restored. Please restart the server.' });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ error: 'Failed to restore database' });
  }
});

export default router;
