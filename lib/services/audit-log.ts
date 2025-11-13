import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

export interface AuditLogData {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: object;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Audit event types
 */
export const AUDIT_ACTIONS = {
  // Authentication events
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_SIGNUP: 'auth.signup',
  AUTH_FAILED_LOGIN: 'auth.failed_login',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_2FA_ENABLED: 'auth.2fa_enabled',
  AUTH_2FA_DISABLED: 'auth.2fa_disabled',
  AUTH_2FA_VERIFIED: 'auth.2fa_verified',
  AUTH_2FA_VERIFY_FAILED: 'auth.2fa_verify_failed',

  // Email verification
  EMAIL_VERIFY: 'email.verify',
  EMAIL_RESEND_CODE: 'email.resend_code',

  // User operations
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_EMAIL_CHANGE: 'user.email_change',

  // Role operations
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  ROLE_SWITCH: 'role.switch',

  // Person operations
  PERSON_CREATE: 'person.create',
  PERSON_UPDATE: 'person.update',
  PERSON_DELETE: 'person.delete',

  // Routine operations
  ROUTINE_CREATE: 'routine.create',
  ROUTINE_UPDATE: 'routine.update',
  ROUTINE_DELETE: 'routine.delete',
  ROUTINE_PUBLISH: 'routine.publish',
  ROUTINE_FORK: 'routine.fork',

  // Task operations
  TASK_CREATE: 'task.create',
  TASK_UPDATE: 'task.update',
  TASK_DELETE: 'task.delete',
  TASK_COMPLETE: 'task.complete',
  TASK_UNDO: 'task.undo',

  // Goal operations
  GOAL_CREATE: 'goal.create',
  GOAL_UPDATE: 'goal.update',
  GOAL_DELETE: 'goal.delete',

  // Co-parent operations
  COPARENT_INVITE: 'coparent.invite',
  COPARENT_ACCEPT: 'coparent.accept',
  COPARENT_REVOKE: 'coparent.revoke',

  // Kiosk operations
  KIOSK_CODE_GENERATE: 'kiosk.code_generate',
  KIOSK_CODE_VALIDATE: 'kiosk.code_validate',
  KIOSK_CODE_REVOKE: 'kiosk.code_revoke',

  // Billing operations
  BILLING_SUBSCRIBE: 'billing.subscribe',
  BILLING_CANCEL: 'billing.cancel',
  BILLING_UPDATE: 'billing.update',
  BILLING_PAYMENT_SUCCESS: 'billing.payment_success',
  BILLING_PAYMENT_FAILED: 'billing.payment_failed',

  // Marketplace operations
  MARKETPLACE_PUBLISH: 'marketplace.publish',
  MARKETPLACE_UNPUBLISH: 'marketplace.unpublish',
  MARKETPLACE_RATE: 'marketplace.rate',
  MARKETPLACE_COMMENT: 'marketplace.comment',

  // Admin operations
  ADMIN_USER_UPDATE: 'admin.user_update',
  ADMIN_TIER_OVERRIDE: 'admin.tier_override',
  ADMIN_SETTINGS_CHANGE: 'admin.settings_change',

  // Security events
  SECURITY_UNAUTHORIZED_ACCESS: 'security.unauthorized_access',
  SECURITY_RATE_LIMIT: 'security.rate_limit',
  SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  SECURITY_2FA_CODES_REGENERATED: 'security.2fa_codes_regenerated',

  // Data export/deletion (GDPR)
  DATA_EXPORT: 'data.export',
  DATA_DELETE: 'data.delete',
  DATA_CONSENT_GIVEN: 'data.consent_given',
  DATA_CONSENT_WITHDRAWN: 'data.consent_withdrawn',
} as const;

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    logger.info('Audit log created', {
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
    });
  } catch (error) {
    // Never fail the main operation due to audit logging
    logger.error('Failed to create audit log', { error, data });
  }
}

/**
 * Create audit log for authentication events
 */
export async function logAuthEvent(
  action: string,
  userId: string,
  success: boolean,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    email?: string;
    errorMessage?: string;
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType: 'User',
    entityId: userId,
    changes: {
      success,
      email: metadata?.email,
      errorMessage: metadata?.errorMessage,
    },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });
}

/**
 * Create audit log for data modification
 */
export async function logDataChange(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes: { before?: any; after?: any },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    changes,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });
}

/**
 * Create audit log for security events
 */
export async function logSecurityEvent(
  userId: string | 'anonymous',
  action: string,
  details: {
    entityType?: string;
    entityId?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  // For anonymous users, use a special ID
  const auditUserId = userId === 'anonymous' ? 'system' : userId;

  await createAuditLog({
    userId: auditUserId,
    action,
    entityType: details.entityType,
    entityId: details.entityId,
    changes: {
      reason: details.reason,
    },
    ipAddress: details.ipAddress,
    userAgent: details.userAgent,
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: string;
    entityType?: string;
  }
) {
  return prisma.auditLog.findMany({
    where: {
      userId,
      ...(options?.action && { action: options.action }),
      ...(options?.entityType && { entityType: options.entityType }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  });
}

/**
 * Get recent security events
 */
export async function getSecurityEvents(options?: {
  limit?: number;
  userId?: string;
}) {
  return prisma.auditLog.findMany({
    where: {
      action: {
        startsWith: 'security.',
      },
      ...(options?.userId && { userId: options.userId }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 100,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Clean up old audit logs (retention policy)
 * Default: 90 days
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  logger.info('Cleaned up old audit logs', {
    deletedCount: result.count,
    retentionDays,
    cutoffDate,
  });

  return result.count;
}
