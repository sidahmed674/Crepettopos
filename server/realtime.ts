import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth.js';

export type RealtimeEventType = 'tables' | 'orders' | 'menu' | 'settings';

interface SseClient {
  res: Response;
}

const clients = new Set<SseClient>();

export function publish(type: RealtimeEventType, payload?: Record<string, unknown>): void {
  if (clients.size === 0) return;
  const data = `data: ${JSON.stringify({ type, payload, at: Date.now() })}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(data);
    } catch {
      clients.delete(client);
    }
  }
}

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Authorization required' });
    return;
  }
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');

  const client: SseClient = { res };
  clients.add(client);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      /* connection already closed */
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
});

export default router;
