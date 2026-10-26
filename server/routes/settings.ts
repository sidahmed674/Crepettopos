import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../auth.js';
import { logAction } from '../audit.js';
import prisma from '../db.js';

const router = Router();

const ALLOWED_SETTING_KEYS = new Set([
  'storeName',
  'storeNameAr',
  'logo',
  'currency',
  'taxRate',
  'receiptFooter',
  'receiptFooterAr',
  'storeAddress',
  'storePhone',
  'lowStockThreshold',
  'autoPrint',
  'paperSize',
  'nif',
  'nis',
  'rc',
  'nfl',
]);

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    const result: Record<string, any> = {};
    for (const s of settings) {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    }
    res.json(result);
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const entries = req.body;
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
      return res.status(400).json({ error: 'Body must be key-value pairs' });
    }

    const rejectedKeys = Object.keys(entries).filter((k) => !ALLOWED_SETTING_KEYS.has(k));
    if (rejectedKeys.length > 0) {
      return res.status(400).json({ error: `Unknown setting keys: ${rejectedKeys.join(', ')}` });
    }

    const updates = Object.entries(entries).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: typeof value === 'string' ? value : JSON.stringify(value) },
        update: { value: typeof value === 'string' ? value : JSON.stringify(value) },
      })
    );

    await Promise.all(updates);

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'update',
      entity: 'Setting',
      details: JSON.stringify({ keys: Object.keys(entries) }),
    });

    res.json({ message: 'Settings updated' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
