import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { requireAuth, requireManager } from '../auth.js';
import { logAction } from '../audit.js';
import { publish } from '../realtime.js';
import prisma from '../db.js';

const router = Router();

const VALID_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled', 'refunded'];
const VALID_ITEM_STATUSES = ['pending', 'preparing', 'ready', 'served', 'cancelled'];

function generateOrderNumber(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `CRP-${num}`;
}

async function recalcOrderTotals(orderId: string, tx?: Prisma.TransactionClient): Promise<void> {
  const db = tx ?? prisma;
  const items = await db.orderItem.findMany({ where: { orderId } });
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const total = subtotal - discountTotal;
  await db.order.update({
    where: { id: orderId },
    data: { subtotal, discountTotal, total },
  });
}

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { active, status, date } = req.query;
    const where: any = {};

    if (active === 'true') {
      where.status = { in: ['pending', 'preparing', 'ready', 'served'] };
    } else if (status) {
      where.status = status as string;
    }

    if (date) {
      const start = new Date(date as string);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true, table: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { tableId, items, note, isTakeaway, customerName, customerPhone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item required' });
    }

    const menuItemIds = items.map((item: any) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, available: true },
    });
    const menuItemMap = new Map(menuItems.map(m => [m.id, m]));

    for (const item of items) {
      const mi = menuItemMap.get(item.menuItemId);
      if (!mi) {
        return res.status(400).json({ error: `Menu item ${item.menuItemId} not found or unavailable` });
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }
    }

    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (attempts < 20) {
      const exists = await prisma.order.findUnique({ where: { orderNumber } });
      if (!exists) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    const computedItems = items.map((item: any) => {
      const mi = menuItemMap.get(item.menuItemId)!;
      const discount = Math.max(0, item.discount ?? 0);
      return {
        menuItemId: item.menuItemId,
        name: item.name || mi.nameAr || mi.name,
        quantity: item.quantity,
        unitPrice: mi.price,
        discount,
        note: item.note || null,
        status: 'pending',
      };
    });

    const subtotal = computedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const discountTotal = computedItems.reduce((s, i) => s + i.discount, 0);
    const total = subtotal - discountTotal;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          tableId: tableId || null,
          status: 'pending',
          subtotal,
          taxAmount: 0,
          discountTotal,
          total,
          note: note || null,
          cashierId: req.user!.id,
          cashierName: req.user!.name,
          isTakeaway: isTakeaway ?? false,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          items: { create: computedItems },
        },
        include: { items: true, table: true },
      });

      if (tableId) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: 'occupied' },
        });
      }

      return created;
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'create',
      entity: 'Order',
      entityId: order.id,
      details: JSON.stringify({ orderNumber, total }),
    });

    publish('orders', { action: 'create', orderId: order.id });
    if (tableId) publish('tables', { action: 'occupied', tableId });

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } }, table: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const { tableId, note, isTakeaway, customerName, customerPhone, status } = req.body;

    const allowedStatuses: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served'],
      served: ['paid', 'cancelled'],
    };

    const data: any = {};
    if (tableId !== undefined) data.tableId = tableId;
    if (note !== undefined) data.note = note;
    if (isTakeaway !== undefined) data.isTakeaway = isTakeaway;
    if (customerName !== undefined) data.customerName = customerName;
    if (customerPhone !== undefined) data.customerPhone = customerPhone;

    if (status !== undefined) {
      if (!VALID_ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const allowed = allowedStatuses[existing.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: `Cannot transition from '${existing.status}' to '${status}'` });
      }
      data.status = status;
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { items: true, table: true },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'update',
      entity: 'Order',
      entityId: id,
    });

    publish('orders', { action: 'update', orderId: id });
    if (data.tableId !== undefined) publish('tables', { action: 'update', tableId: data.tableId });

    res.json(order);
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/pay', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    if (!paymentMethod) return res.status(400).json({ error: 'Payment method required' });

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status === 'paid') return res.status(400).json({ error: 'Order already paid' });
    if (existing.status === 'cancelled') return res.status(400).json({ error: 'Order is cancelled' });

    const order = await prisma.$transaction(async (tx) => {
      await recalcOrderTotals(id, tx);

      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'paid',
          paymentMethod,
          paidAt: new Date(),
        },
        include: { items: true, table: true },
      });

      if (existing.tableId) {
        await tx.table.update({
          where: { id: existing.tableId },
          data: { status: 'available' },
        });
      }

      return updated;
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'pay',
      entity: 'Order',
      entityId: id,
      details: JSON.stringify({ paymentMethod, total: order.total }),
    });

    publish('orders', { action: 'paid', orderId: id });
    if (existing.tableId) publish('tables', { action: 'available', tableId: existing.tableId });

    res.json(order);
  } catch (err) {
    console.error('Pay order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/cancel', requireManager, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status === 'paid') return res.status(400).json({ error: 'Cannot cancel paid order. Use refund.' });
    if (existing.status === 'cancelled') return res.status(400).json({ error: 'Order already cancelled' });

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { items: true, table: true },
      });

      if (existing.tableId) {
        const hasActiveOrders = await tx.order.findFirst({
          where: {
            tableId: existing.tableId,
            status: { in: ['pending', 'preparing', 'ready', 'served'] },
            id: { not: id },
          },
        });
        if (!hasActiveOrders) {
          await tx.table.update({
            where: { id: existing.tableId },
            data: { status: 'available' },
          });
        }
      }

      return updated;
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'cancel',
      entity: 'Order',
      entityId: id,
    });

    publish('orders', { action: 'cancelled', orderId: id });
    if (existing.tableId) publish('tables', { action: 'available', tableId: existing.tableId });

    res.json(order);
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/refund', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status !== 'paid') return res.status(400).json({ error: 'Can only refund paid orders' });

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: 'refunded' },
        include: { items: true, table: true },
      });

      if (existing.tableId) {
        await tx.table.update({
          where: { id: existing.tableId },
          data: { status: 'available' },
        });
      }

      return updated;
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'refund',
      entity: 'Order',
      entityId: id,
      details: JSON.stringify({ reason: reason || null, total: existing.total }),
    });

    publish('orders', { action: 'refunded', orderId: id });
    if (existing.tableId) publish('tables', { action: 'available', tableId: existing.tableId });

    res.json(order);
  } catch (err) {
    console.error('Refund order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/items', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item required' });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status === 'paid' || existing.status === 'cancelled' || existing.status === 'refunded') {
      return res.status(400).json({ error: 'Cannot modify this order' });
    }

    const menuItemIds = items.map((item: any) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, available: true },
    });
    const menuItemMap = new Map(menuItems.map(m => [m.id, m]));

    for (const item of items) {
      const mi = menuItemMap.get(item.menuItemId);
      if (!mi) {
        return res.status(400).json({ error: `Menu item ${item.menuItemId} not found or unavailable` });
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }
    }

    for (const item of items) {
      const mi = menuItemMap.get(item.menuItemId)!;
      await prisma.orderItem.create({
        data: {
          orderId: id,
          menuItemId: item.menuItemId,
          name: item.name || mi.nameAr || mi.name,
          quantity: item.quantity,
          unitPrice: mi.price,
          discount: Math.max(0, item.discount ?? 0),
          note: item.note || null,
          status: 'pending',
        },
      });
    }

    await recalcOrderTotals(id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true },
    });

    publish('orders', { action: 'items_added', orderId: id });

    res.json(order);
  } catch (err) {
    console.error('Add items to order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/items/:itemId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status === 'paid' || existing.status === 'cancelled' || existing.status === 'refunded') {
      return res.status(400).json({ error: 'Cannot modify this order' });
    }

    const orderItem = await prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!orderItem || orderItem.orderId !== id) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    await prisma.orderItem.delete({ where: { id: itemId } });
    await recalcOrderTotals(id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true },
    });

    publish('orders', { action: 'item_removed', orderId: id });

    res.json(order);
  } catch (err) {
    console.error('Remove item from order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/items/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });
    if (!VALID_ITEM_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid item status' });
    }

    const existing = await prisma.orderItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Order item not found' });

    const orderItem = await prisma.orderItem.update({
      where: { id },
      data: { status },
      include: { menuItem: true },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'update_status',
      entity: 'OrderItem',
      entityId: id,
      details: JSON.stringify({ from: existing.status, to: status }),
    });

    publish('orders', { action: 'item_status', orderId: existing.orderId, itemId: id });

    res.json(orderItem);
  } catch (err) {
    console.error('Update order item status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
