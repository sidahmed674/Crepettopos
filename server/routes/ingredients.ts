import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../auth.js';
import { logAction } from '../audit.js';
import prisma from '../db.js';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const ingredients = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
    res.json(ingredients);
  } catch (err) {
    console.error('List ingredients error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, nameAr, unit, stock, minStock, costPerUnit } = req.body;
    if (!name || !unit) return res.status(400).json({ error: 'Name and unit required' });

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        nameAr: nameAr || '',
        unit,
        stock: stock ?? 0,
        minStock: minStock ?? 1,
        costPerUnit: costPerUnit ?? 0,
      },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'create',
      entity: 'Ingredient',
      entityId: ingredient.id,
    });

    res.status(201).json(ingredient);
  } catch (err) {
    console.error('Create ingredient error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Ingredient not found' });

    const { name, nameAr, unit, stock, minStock, costPerUnit } = req.body;
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(unit !== undefined && { unit }),
        ...(stock !== undefined && { stock }),
        ...(minStock !== undefined && { minStock }),
        ...(costPerUnit !== undefined && { costPerUnit }),
      },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'update',
      entity: 'Ingredient',
      entityId: id,
    });

    res.json(ingredient);
  } catch (err) {
    console.error('Update ingredient error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Ingredient not found' });

    await prisma.ingredient.delete({ where: { id } });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'delete',
      entity: 'Ingredient',
      entityId: id,
    });

    res.json({ message: 'Ingredient deleted' });
  } catch (err) {
    console.error('Delete ingredient error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/movement', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, change, note, refType, refId } = req.body;

    if (!type || change === undefined) {
      return res.status(400).json({ error: 'Type and change amount required' });
    }

    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });

    const qtyBefore = ingredient.stock;
    const qtyAfter = qtyBefore + change;

    if (qtyAfter < 0) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const [updatedIngredient, movement] = await prisma.$transaction([
      prisma.ingredient.update({
        where: { id },
        data: { stock: qtyAfter },
      }),
      prisma.stockMovement.create({
        data: {
          ingredientId: id,
          type,
          qtyBefore,
          qtyAfter,
          change,
          refType: refType || null,
          refId: refId || null,
          username: req.user!.username,
          note: note || null,
        },
      }),
    ]);

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'stock_movement',
      entity: 'Ingredient',
      entityId: id,
      details: JSON.stringify({ type, change, qtyBefore, qtyAfter }),
    });

    res.json({ ingredient: updatedIngredient, movement });
  } catch (err) {
    console.error('Stock movement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
