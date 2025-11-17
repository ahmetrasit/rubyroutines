import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { Prisma } from '@prisma/client';

// Moderation actions enum
export enum ModerationAction {
  // Marketplace item actions
  HIDE_ITEM = 'HIDE_ITEM',
  UNHIDE_ITEM = 'UNHIDE_ITEM',
  DELETE_ITEM = 'DELETE_ITEM',
  BULK_HIDE_ITEMS = 'BULK_HIDE_ITEMS',
  BULK_UNHIDE_ITEMS = 'BULK_UNHIDE_ITEMS',

  // Comment actions
  HIDE_COMMENT = 'HIDE_COMMENT',
  UNHIDE_COMMENT = 'UNHIDE_COMMENT',
  DELETE_COMMENT = 'DELETE_COMMENT',
  BULK_HIDE_COMMENTS = 'BULK_HIDE_COMMENTS',
  BULK_UNHIDE_COMMENTS = 'BULK_UNHIDE_COMMENTS',

  // User actions
  SUSPEND_USER = 'SUSPEND_USER',
  UNSUSPEND_USER = 'UNSUSPEND_USER',
  DELETE_USER = 'DELETE_USER',
  GRANT_ADMIN = 'GRANT_ADMIN',
  REVOKE_ADMIN = 'REVOKE_ADMIN',

  // Role actions
  CHANGE_TIER = 'CHANGE_TIER',
  SET_TIER_OVERRIDE = 'SET_TIER_OVERRIDE',
  REMOVE_TIER_OVERRIDE = 'REMOVE_TIER_OVERRIDE',
}

export enum EntityType {
  MARKETPLACE_ITEM = 'MARKETPLACE_ITEM',
  COMMENT = 'COMMENT',
  USER = 'USER',
  ROLE = 'ROLE',
}

interface ModerationLogEntry {
  adminUserId: string;
  entityType: EntityType;
  entityId: string;
  action: ModerationAction;
  reason?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

interface BulkModerationLogEntry extends Omit<ModerationLogEntry, 'entityId'> {
  entityIds: string[];
}

/**
 * Log a single moderation action
 */
export async function logModerationAction(entry: ModerationLogEntry): Promise<void> {
  try {
    await prisma.moderationLog.create({
      data: {
        adminUserId: entry.adminUserId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        reason: entry.reason || null,
        metadata: entry.metadata || null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });

    logger.info(`Moderation action logged: ${entry.action}`, {
      adminUserId: entry.adminUserId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
    });
  } catch (error) {
    // Log error but don't throw - we don't want logging failures to break main operations
    logger.error('Failed to log moderation action', error as Error, entry);
  }
}

/**
 * Log bulk moderation actions
 */
export async function logBulkModerationAction(entry: BulkModerationLogEntry): Promise<void> {
  try {
    const logs = entry.entityIds.map(entityId => ({
      adminUserId: entry.adminUserId,
      entityType: entry.entityType,
      entityId,
      action: entry.action,
      reason: entry.reason || null,
      metadata: {
        ...entry.metadata,
        bulkOperation: true,
        totalCount: entry.entityIds.length,
      },
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
    }));

    await prisma.moderationLog.createMany({
      data: logs,
    });

    logger.info(`Bulk moderation action logged: ${entry.action}`, {
      adminUserId: entry.adminUserId,
      entityType: entry.entityType,
      action: entry.action,
      count: entry.entityIds.length,
    });
  } catch (error) {
    logger.error('Failed to log bulk moderation action', error as Error, entry);
  }
}

/**
 * Get moderation logs with filters
 */
export async function getModerationLogs(filters: {
  adminUserId?: string;
  entityType?: EntityType;
  entityId?: string;
  action?: ModerationAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.ModerationLogWhereInput = {};

  if (filters.adminUserId) {
    where.adminUserId = filters.adminUserId;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.timestamp.lte = filters.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.moderationLog.findMany({
      where,
      include: {
        adminUser: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.moderationLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Get audit history for a specific entity
 */
export async function getEntityAuditHistory(
  entityType: EntityType,
  entityId: string
) {
  const logs = await prisma.moderationLog.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      adminUser: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  return logs;
}

/**
 * Get all moderation actions by a specific admin
 */
export async function getUserModerationHistory(
  adminUserId: string,
  limit = 50,
  offset = 0
) {
  const [logs, total] = await Promise.all([
    prisma.moderationLog.findMany({
      where: {
        adminUserId,
      },
      include: {
        adminUser: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.moderationLog.count({
      where: {
        adminUserId,
      },
    }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
  };
}

/**
 * Get moderation statistics for a date range
 */
export async function getModerationStatistics(startDate: Date, endDate: Date) {
  const logs = await prisma.moderationLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      action: true,
      adminUserId: true,
      entityType: true,
    },
  });

  // Count by action
  const actionCounts: Record<string, number> = {};
  logs.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });

  // Count by entity type
  const entityTypeCounts: Record<string, number> = {};
  logs.forEach((log) => {
    entityTypeCounts[log.entityType] = (entityTypeCounts[log.entityType] || 0) + 1;
  });

  // Count unique moderators
  const uniqueModerators = new Set(logs.map((log) => log.adminUserId)).size;

  // Get top moderators
  const moderatorActions: Record<string, number> = {};
  logs.forEach((log) => {
    moderatorActions[log.adminUserId] = (moderatorActions[log.adminUserId] || 0) + 1;
  });

  const topModerators = await Promise.all(
    Object.entries(moderatorActions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(async ([userId, count]) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        });
        return {
          user,
          actionCount: count,
        };
      })
  );

  return {
    totalActions: logs.length,
    uniqueModerators,
    actionCounts,
    entityTypeCounts,
    topModerators,
  };
}

/**
 * Export moderation logs to CSV format
 */
export async function exportModerationLogs(filters: {
  startDate?: Date;
  endDate?: Date;
  adminUserId?: string;
  entityType?: EntityType;
  action?: ModerationAction;
}) {
  const where: Prisma.ModerationLogWhereInput = {};

  if (filters.adminUserId) {
    where.adminUserId = filters.adminUserId;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) {
      where.timestamp.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.timestamp.lte = filters.endDate;
    }
  }

  const logs = await prisma.moderationLog.findMany({
    where,
    include: {
      adminUser: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Convert to CSV format
  const headers = [
    'Timestamp',
    'Admin Email',
    'Admin Name',
    'Action',
    'Entity Type',
    'Entity ID',
    'Reason',
    'IP Address',
    'User Agent',
  ];

  const rows = logs.map(log => [
    log.timestamp.toISOString(),
    log.adminUser.email,
    log.adminUser.name || '',
    log.action,
    log.entityType,
    log.entityId,
    log.reason || '',
    log.ipAddress || '',
    log.userAgent || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Clean up old moderation logs (retention policy)
 * Default: Keep logs for 365 days
 */
export async function cleanupOldModerationLogs(retentionDays = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    const result = await prisma.moderationLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} old moderation logs`, {
      retentionDays,
      cutoffDate,
    });

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup old moderation logs', error as Error);
    throw error;
  }
}