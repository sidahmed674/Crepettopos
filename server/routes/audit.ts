import { Router, Request, Response } from 'express';
import { requireAuth, requireManager } from '../auth.js';
import prisma from '../db.js';

const router = Router();

router.get('/', requireManager, async (req: Request, res: Response) => {
  try {
    const { entity, action, limit } = req.query;
    const where: any = {};

    if (entity) where.entity = entity as string;
    if (action) where.action = action as string;

    const take = limit ? parseInt(limit as string, 10) : 100;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 500),
    });

    res.json(logs);
  } catch (err) {
    console.error('List audit logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
