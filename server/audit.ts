import prisma from './db.js';

export async function logAction(params: {
  userId?: string;
  username?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        username: params.username ?? null,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        details: params.details ?? null,
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
