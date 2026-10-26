import { Router, Request, Response } from 'express';
import { requireAuth, requireManager } from '../auth.js';
import { logAction } from '../audit.js';
import prisma from '../db.js';

const router = Router();

router.get('/dashboard', requireAuth, async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 1);

    const [todayOrders, monthOrders, weekOrders, pendingCount, topItemsRaw] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: 'paid',
          paidAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.order.findMany({
        where: {
          status: 'paid',
          paidAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      prisma.order.findMany({
        where: {
          status: 'paid',
          paidAt: { gte: weekStart, lt: weekEnd },
        },
      }),
      prisma.order.count({
        where: { status: { in: ['pending', 'preparing', 'ready'] } },
      }),
      prisma.orderItem.groupBy({
        by: ['menuItemId', 'name'],
        where: {
          order: {
            status: 'paid',
            paidAt: { gte: monthStart, lt: monthEnd },
          },
        },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const todayOrderCount = todayOrders.length;
    const todayCash = todayOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const todayCard = todayOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0);

    const weekSales = weekOrders.reduce((sum, o) => sum + o.total, 0);
    const weekOrderCount = weekOrders.length;
    const weekCash = weekOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const weekCard = weekOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0);
    const weekTransfer = weekOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0);

    const monthSales = monthOrders.reduce((sum, o) => sum + o.total, 0);
    const monthOrderCount = monthOrders.length;
    const monthCash = monthOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const monthCard = monthOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0);
    const monthTax = monthOrders.reduce((sum, o) => sum + o.taxAmount, 0);
    const monthDiscount = monthOrders.reduce((sum, o) => sum + o.discountTotal, 0);

    const topItems = topItemsRaw.map(item => ({
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item._sum.quantity,
      orders: item._count.id,
    }));

    res.json({
      today: {
        sales: todaySales,
        orders: todayOrderCount,
        cash: todayCash,
        card: todayCard,
      },
      week: {
        sales: weekSales,
        orders: weekOrderCount,
        cash: weekCash,
        card: weekCard,
        transfer: weekTransfer,
      },
      month: {
        sales: monthSales,
        orders: monthOrderCount,
        cash: monthCash,
        card: monthCard,
        tax: monthTax,
        discount: monthDiscount,
      },
      pendingOrders: pendingCount,
      topItems,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/daily-report', requireAuth, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const dateStr = (date as string) || new Date().toISOString().split('T')[0];

    const start = new Date(dateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [orders, cancelledCount, expenses, itemsSold] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: 'paid',
          paidAt: { gte: start, lt: end },
        },
      }),
      prisma.order.count({
        where: {
          status: 'cancelled',
          createdAt: { gte: start, lt: end },
        },
      }),
      prisma.expense.findMany({
        where: { date: dateStr },
      }),
      prisma.orderItem.aggregate({
        where: { order: { status: 'paid', paidAt: { gte: start, lt: end } } },
        _sum: { quantity: true },
      }),
    ]);

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const cashTotal = orders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const cardTotal = orders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0);
    const taxTotal = orders.reduce((sum, o) => sum + o.taxAmount, 0);
    const discountTotal = orders.reduce((sum, o) => sum + o.discountTotal, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = totalSales - totalExpenses;

    const topItemsRaw = await prisma.orderItem.groupBy({
      by: ['menuItemId', 'name'],
      where: { order: { status: 'paid', paidAt: { gte: start, lt: end } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const report = await prisma.dailyReport.upsert({
      where: { date: dateStr },
      create: {
        date: dateStr,
        totalSales,
        totalOrders,
        cashTotal,
        cardTotal,
        taxTotal,
        discountTotal,
        cancelledOrders: cancelledCount,
        itemsSold: itemsSold._sum.quantity || 0,
        topItems: JSON.stringify(topItemsRaw.map(i => ({ name: i.name, quantity: i._sum.quantity }))),
      },
      update: {
        totalSales,
        totalOrders,
        cashTotal,
        cardTotal,
        taxTotal,
        discountTotal,
        cancelledOrders: cancelledCount,
        itemsSold: itemsSold._sum.quantity || 0,
        topItems: JSON.stringify(topItemsRaw.map(i => ({ name: i.name, quantity: i._sum.quantity }))),
      },
    });

    res.json({
      ...report,
      totalExpenses,
      profit,
      expensesList: expenses,
    });
  } catch (err) {
    console.error('Daily report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/weekly-sales', requireAuth, async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: { status: 'paid', paidAt: { gte: weekStart, lt: weekEnd } },
    });

    const total = orders.reduce((s, o) => s + o.total, 0);
    const cash = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const card = orders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    const transfer = orders.filter(o => o.paymentMethod === 'transfer').reduce((s, o) => s + o.total, 0);

    res.json({ sales: total, orders: orders.length, cash, card, transfer });
  } catch (err) {
    console.error('Weekly sales error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/sales-by-period', requireAuth, async (req: Request, res: Response) => {
  try {
    const { period } = req.query;
    const now = new Date();
    let start: Date;

    if (period === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      const day = now.getDay();
      const offset = day === 0 ? 6 : day - 1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start = new Date(2020, 0, 1);
    }

    const end = new Date(now);
    end.setDate(end.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: { status: 'paid', paidAt: { gte: start, lt: end } },
    });

    const total = orders.reduce((s, o) => s + o.total, 0);
    const cash = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const card = orders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    const transfer = orders.filter(o => o.paymentMethod === 'transfer').reduce((s, o) => s + o.total, 0);

    res.json({ total, count: orders.length, cash, card, transfer });
  } catch (err) {
    console.error('Sales by period error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/close-day', requireManager, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const dateStr = (req.body.date as string) || now.toISOString().split('T')[0];

    const start = new Date(dateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [orders, cancelledCount, expenses, itemsSold] = await Promise.all([
      prisma.order.findMany({
        where: { status: 'paid', paidAt: { gte: start, lt: end } },
      }),
      prisma.order.count({
        where: { status: 'cancelled', createdAt: { gte: start, lt: end } },
      }),
      prisma.expense.findMany({ where: { date: dateStr } }),
      prisma.orderItem.aggregate({
        where: { order: { status: 'paid', paidAt: { gte: start, lt: end } } },
        _sum: { quantity: true },
      }),
    ]);

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const cashTotal = orders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const cardTotal = orders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0);
    const taxTotal = orders.reduce((sum, o) => sum + o.taxAmount, 0);
    const discountTotal = orders.reduce((sum, o) => sum + o.discountTotal, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const topItemsRaw = await prisma.orderItem.groupBy({
      by: ['menuItemId', 'name'],
      where: { order: { status: 'paid', paidAt: { gte: start, lt: end } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const report = await prisma.dailyReport.upsert({
      where: { date: dateStr },
      create: {
        date: dateStr,
        totalSales,
        totalOrders,
        cashTotal,
        cardTotal,
        taxTotal,
        discountTotal,
        cancelledOrders: cancelledCount,
        itemsSold: itemsSold._sum.quantity || 0,
        topItems: JSON.stringify(topItemsRaw.map(i => ({ name: i.name, quantity: i._sum.quantity }))),
        closedBy: req.user!.username,
        closedAt: now,
      },
      update: {
        totalSales,
        totalOrders,
        cashTotal,
        cardTotal,
        taxTotal,
        discountTotal,
        cancelledOrders: cancelledCount,
        itemsSold: itemsSold._sum.quantity || 0,
        topItems: JSON.stringify(topItemsRaw.map(i => ({ name: i.name, quantity: i._sum.quantity }))),
        closedBy: req.user!.username,
        closedAt: now,
      },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'close_day',
      entity: 'DailyReport',
      entityId: report.id,
      details: JSON.stringify({ date: dateStr, totalSales, totalOrders, totalExpenses }),
    });

    res.json({ ...report, totalExpenses, profit: totalSales - totalExpenses });
  } catch (err) {
    console.error('Close day error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
