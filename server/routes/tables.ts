import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../auth.js';
import { logAction } from '../audit.js';
import { publish } from '../realtime.js';
import prisma from '../db.js';

const router = Router();

const VALID_TABLE_STATUSES = ['available', 'occupied', 'reserved', 'cleaning'];

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
    res.json(tables);
  } catch (err) {
    console.error('List tables error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { number, name, capacity, zone } = req.body;
    if (number === undefined) return res.status(400).json({ error: 'Table number required' });

    const table = await prisma.table.create({
      data: {
        number,
        name: name || null,
        capacity: capacity ?? 4,
        zone: zone || null,
      },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'create',
      entity: 'Table',
      entityId: table.id,
      details: JSON.stringify({ number }),
    });

    publish('tables', { action: 'create', tableId: table.id });

    res.status(201).json(table);
  } catch (err) {
    console.error('Create table error:', err);
    if ((err as any).code === 'P2002') {
      return res.status(409).json({ error: 'Table number already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.table.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Table not found' });

    const { number, name, capacity, zone } = req.body;
    const table = await prisma.table.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(name !== undefined && { name }),
        ...(capacity !== undefined && { capacity }),
        ...(zone !== undefined && { zone }),
      },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'update',
      entity: 'Table',
      entityId: id,
    });

    publish('tables', { action: 'update', tableId: id });

    res.json(table);
  } catch (err) {
    console.error('Update table error:', err);
    if ((err as any).code === 'P2002') {
      return res.status(409).json({ error: 'Table number already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.table.findUnique({
      where: { id },
      include: { orders: { where: { status: { notIn: ['paid', 'cancelled'] } } } },
    });
    if (!existing) return res.status(404).json({ error: 'Table not found' });

    if (existing.orders.length > 0) {
      return res.status(400).json({ error: 'Cannot delete table with active orders' });
    }

    await prisma.table.delete({ where: { id } });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'delete',
      entity: 'Table',
      entityId: id,
    });

    publish('tables', { action: 'delete', tableId: id });

    res.json({ message: 'Table deleted' });
  } catch (err) {
    console.error('Delete table error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });

    if (!VALID_TABLE_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_TABLE_STATUSES.join(', ')}` });
    }

    const existing = await prisma.table.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Table not found' });

    const table = await prisma.table.update({
      where: { id },
      data: { status },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'update_status',
      entity: 'Table',
      entityId: id,
      details: JSON.stringify({ from: existing.status, to: status }),
    });

    publish('tables', { action: 'status', tableId: id, status });

    res.json(table);
  } catch (err) {
    console.error('Update table status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
