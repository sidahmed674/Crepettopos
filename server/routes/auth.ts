import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, requireAdmin, signToken, checkRateLimit, resetRateLimit, verifyPassword } from '../auth.js';
import { logAction } from '../audit.js';
import prisma from '../db.js';

const router = Router();

const VALID_ROLES = ['admin', 'manager', 'cashier'];

router.post('/login', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    resetRateLimit(ip);

    const token = signToken({ id: user.id, username: user.username, name: user.name, role: user.role });

    await logAction({ userId: user.id, username: user.username, action: 'login' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, username: true, name: true, role: true, mustChangePassword: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: 'New password required' });
    }

    const pwdCheck = verifyPassword(newPassword);
    if (!pwdCheck.valid) {
      return res.status(400).json({ error: pwdCheck.error });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, mustChangePassword: false },
    });

    await logAction({ userId: user.id, username: user.username, action: 'change_password' });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, mustChangePassword: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name required' });
    }

    const validRole = VALID_ROLES.includes(role) ? role : 'cashier';

    const pwdCheck = verifyPassword(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({ error: pwdCheck.error });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashed, name, role: validRole },
      select: { id: true, username: true, name: true, role: true, mustChangePassword: true, createdAt: true },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'create_user',
      entity: 'User',
      entityId: user.id,
      details: JSON.stringify({ username: user.username }),
    });

    res.status(201).json(user);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password, name, role, mustChangePassword } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const data: Record<string, unknown> = {};
    if (username !== undefined) data.username = username;
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = VALID_ROLES.includes(role) ? role : existing.role;
    if (mustChangePassword !== undefined) data.mustChangePassword = mustChangePassword;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, role: true, mustChangePassword: true, createdAt: true },
    });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'update_user',
      entity: 'User',
      entityId: id,
    });

    res.json(user);
  } catch (err) {
    console.error('Update user error:', err);
    if ((err as any).code === 'P2002') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    if (existing.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    if (existing.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    await prisma.user.delete({ where: { id } });

    await logAction({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'delete_user',
      entity: 'User',
      entityId: id,
      details: JSON.stringify({ username: existing.username }),
    });

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
