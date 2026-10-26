import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'node:path';
import prisma from './db.js';
import { ensureSchema } from './migrate.js';
import { bootstrap } from './bootstrap.js';
import { startAutoBackup } from './backup-scheduler.js';

import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import ordersRoutes from './routes/orders.js';
import tablesRoutes from './routes/tables.js';
import ingredientsRoutes from './routes/ingredients.js';
import settingsRoutes from './routes/settings.js';
import statsRoutes from './routes/stats.js';
import auditRoutes from './routes/audit.js';
import backupRoutes from './routes/backup.js';
import expensesRoutes from './routes/expenses.js';
import eventsRoutes from './realtime.js';
import { IMAGES_DIR, ensureImagesDir } from './images.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);

// Locally stored product images (offline-friendly, no external URLs needed)
ensureImagesDir();
app.use('/images/products', express.static(IMAGES_DIR, { maxAge: '30d' }));
app.use('/api/orders', ordersRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/events', eventsRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[server] Unhandled error [${req.method} ${req.url}]:`, err);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

async function start() {
  try {
    await ensureSchema();
    await bootstrap();
    startAutoBackup();
    const server = app.listen(PORT, 'localhost', () => {
      console.log(`[server] CrepettooPOS server running at http://localhost:${PORT}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[server] Port ${PORT} is already in use. Please close the other application or change the PORT in .env`);
        return;
      }
      console.error('[server] Server error:', err);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[server] ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('[server] Closed all connections.');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('[server] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();
