import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

export enum AdminAction {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_PERMANENTLY_DELETED = 'USER_PERMANENTLY_DELETED',
  USER_ADMIN_GRANTED = 'USER_ADMIN_GRANTED',
  USER_ADMIN_REVOKED = 'USER_ADMIN_REVOKED',
  USER_EMAIL_VERIFIED = 'USER_EMAIL_VERIFIED',
  TIER_CHANGED = 'TIER_CHANGED',
  TIER_OVERRIDE_SET = 'TIER_OVERRIDE_SET',
  TIER_OVERRIDE_REMOVED = 'TIER_OVERRIDE_REMOVED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  SETTINGS_CREATED = 'SETTINGS_CREATED',
  SETTINGS_DELETED = 'SETTINGS_DELETED',
  SYSTEM_TIER_LIMITS_UPDATED = 'SYSTEM_TIER_LIMITS_UPDATED',
  SYSTEM_TIER_PRICES_UPDATED = 'SYSTEM_TIER_PRICES_UPDATED',
}

export interface AuditLogEntry {
  userId: string;
  action: AdminAction;
  entityType?: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType || null,
        entityId: entry.entityId || null,
        changes: entry.changes || Prisma.JsonNull,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });

    logger.audit(entry.action, {
      userId: entry.userId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      changes: entry.changes,
    });
  } catch (error) {
    logger.error('Failed to create audit log', error as Error, entry);
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: AdminAction;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditHistory(
  entityType: string,
  entityId: string
) {
  const logs = await prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return logs;
}

/**
 * Get recent admin activity
 */
export async function getRecentAdminActivity(limit = 20) {
  const logs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return logs;
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(startDate: Date, endDate: Date) {
  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      action: true,
      userId: true,
    },
  });

  // Count by action
  const actionCounts: Record<string, number> = {};
  logs.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });

  // Count unique admins
  const uniqueAdmins = new Set(logs.map((log) => log.userId)).size;

  return {
    totalActions: logs.length,
    uniqueAdmins,
    actionCounts,
  };
}
