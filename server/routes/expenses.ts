import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../auth.js';
import { logAction } from '../audit.js';
import prisma from '../db.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const where: any = {};

    if (date) {
      where.date = date as string;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(expenses);
  } catch (err) {
    console.error('List expenses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { description, amount, notes, date } = req.body;

    if (!description || amount === undefined) {
      return res.status(400).json({ error: 'Description and amount required' });
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: Number(amount),
        notes: notes || null,
        date: date || new Date().toISOString().split('T')[0],
        createdBy: req.user!.name,
      },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'create',
      entity: 'Expense',
      entityId: expense.id,
      details: JSON.stringify({ description, amount }),
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    const { description, amount, notes } = req.body;
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(notes !== undefined && { notes }),
      },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'update',
      entity: 'Expense',
      entityId: id,
    });

    res.json(expense);
  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    await prisma.expense.delete({ where: { id } });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'delete',
      entity: 'Expense',
      entityId: id,
    });

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
