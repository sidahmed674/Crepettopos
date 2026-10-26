import { Router, Request, Response } from 'express';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { logAction } from '../audit.js';
import prisma from '../db.js';
import { IMAGES_DIR, ensureImagesDir, extForMime, isValidImageBuffer } from '../images.js';

const router = Router();

// Upload a product image (raw binary body). Returns { url } to store in MenuItem.image.
router.post(
  '/images',
  requireAdmin,
  express.raw({ type: () => true, limit: '8mb' }),
  async (req: Request, res: Response) => {
    try {
      const mime = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      const ext = extForMime(mime);
      if (!ext) {
        return res.status(415).json({ error: 'Unsupported image type (use JPG, PNG or WebP)' });
      }
      const body = req.body as Buffer;
      if (!body || !Buffer.isBuffer(body) || body.length === 0) {
        return res.status(400).json({ error: 'Empty image body' });
      }
      if (!isValidImageBuffer(body, ext)) {
        return res.status(400).json({ error: 'Invalid image content' });
      }
      ensureImagesDir();
      const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(IMAGES_DIR, name), body);
      res.status(201).json({ url: `/images/products/${name}` });
    } catch (err) {
      console.error('Upload image error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/categories', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, nameAr, nameFr, sortOrder, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const category = await prisma.menuCategory.create({
      data: {
        name,
        nameAr: nameAr || '',
        nameFr: nameFr || '',
        sortOrder: sortOrder ?? 0,
        active: active ?? true,
      },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'create',
      entity: 'MenuCategory',
      entityId: category.id,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error('Create category error:', err);
    if ((err as any).code === 'P2002') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/categories/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.menuCategory.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });

    const { name, nameAr, nameFr, sortOrder, active } = req.body;
    const category = await prisma.menuCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(nameFr !== undefined && { nameFr }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'update',
      entity: 'MenuCategory',
      entityId: id,
    });

    res.json(category);
  } catch (err) {
    console.error('Update category error:', err);
    if ((err as any).code === 'P2002') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/categories/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.menuCategory.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Category not found' });

    if (existing._count.items > 0) {
      return res.status(400).json({ error: 'Cannot delete category with items. Remove items first.' });
    }

    await prisma.menuCategory.delete({ where: { id } });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'delete',
      entity: 'MenuCategory',
      entityId: id,
    });

    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/items', async (_req: Request, res: Response) => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch (err) {
    console.error('List items error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/items', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, nameAr, nameFr, description, descriptionAr, descriptionFr, price, costPrice, image, barcode, categoryId, available, prepTimeMin, tags } = req.body;
    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ error: 'Name, categoryId, and price required' });
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        nameAr: nameAr || '',
        nameFr: nameFr || '',
        description: description || null,
        descriptionAr: descriptionAr || null,
        descriptionFr: descriptionFr || null,
        price,
        costPrice: costPrice ?? 0,
        image: image || null,
        barcode: barcode || null,
        categoryId,
        available: available ?? true,
        prepTimeMin: prepTimeMin ?? null,
        tags: tags || null,
      },
      include: { category: true },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'create',
      entity: 'MenuItem',
      entityId: item.id,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error('Create item error:', err);
    if ((err as any).code === 'P2002') {
      return res.status(409).json({ error: 'Barcode already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/items/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const { name, nameAr, nameFr, description, descriptionAr, descriptionFr, price, costPrice, image, barcode, categoryId, available, prepTimeMin, tags } = req.body;

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(nameFr !== undefined && { nameFr }),
        ...(description !== undefined && { description }),
        ...(descriptionAr !== undefined && { descriptionAr }),
        ...(descriptionFr !== undefined && { descriptionFr }),
        ...(price !== undefined && { price }),
        ...(costPrice !== undefined && { costPrice }),
        ...(image !== undefined && { image }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(categoryId !== undefined && { categoryId }),
        ...(available !== undefined && { available }),
        ...(prepTimeMin !== undefined && { prepTimeMin }),
        ...(tags !== undefined && { tags }),
      },
      include: { category: true },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'update',
      entity: 'MenuItem',
      entityId: id,
    });

    res.json(item);
  } catch (err) {
    console.error('Update item error:', err);
    if ((err as any).code === 'P2002') {
      return res.status(409).json({ error: 'Barcode already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/items/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    try {
      await prisma.menuItem.delete({ where: { id } });
    } catch (err) {
      if ((err as any).code === 'P2003') {
        // Item is referenced by past orders — keep history intact,
        // deactivate the item instead of hard-deleting it.
        await prisma.menuItem.update({ where: { id }, data: { available: false } });
        await logAction({
          userId: req.user!.id,
          username: req.user!.username,
          action: 'deactivate',
          entity: 'MenuItem',
          entityId: id,
          details: JSON.stringify({ reason: 'has_order_history' }),
        });
        return res.json({ message: 'Item deactivated (referenced by orders)', deactivated: true });
      }
      throw err;
    }

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'delete',
      entity: 'MenuItem',
      entityId: id,
    });

    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/items/barcode/:barcode', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const item = await prisma.menuItem.findUnique({
      where: { barcode },
      include: { category: true },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error('Find by barcode error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
