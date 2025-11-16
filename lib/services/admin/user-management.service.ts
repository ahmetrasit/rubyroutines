import { prisma } from '@/lib/prisma';
import { Tier } from '@prisma/client';
import { createAuditLog, AdminAction } from './audit.service';
import { logger } from '@/lib/utils/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { softDelete } from '@/lib/soft-delete';

export interface UserSearchFilters {
  email?: string;
  isAdmin?: boolean;
  tier?: Tier;
  limit?: number;
  offset?: number;
}

export interface UserWithStats {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  roles: Array<{
    id: string;
    type: string;
    tier: Tier;
    subscriptionStatus: string | null;
  }>;
  _count: {
    roles: number;
  };
}

/**
 * Search and list users with admin filters
 */
export async function searchUsers(filters: UserSearchFilters) {
  const where: any = {
    deletedAt: null, // Exclude soft-deleted users
  };

  if (filters.email) {
    where.email = {
      contains: filters.email,
      mode: 'insensitive',
    };
  }

  if (filters.isAdmin !== undefined) {
    where.isAdmin = filters.isAdmin;
  }

  if (filters.tier) {
    where.roles = {
      some: {
        tier: filters.tier,
        deletedAt: null, // Exclude soft-deleted roles
      },
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        roles: {
          where: {
            deletedAt: null, // Only include active roles
          },
          select: {
            id: true,
            type: true,
            tier: true,
            subscriptionStatus: true,
          },
        },
        _count: {
          select: {
            roles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Get detailed user information
 */
export async function getUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          persons: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          groups: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          routines: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              id: true,
              name: true,
            },
          },
          goals: {
            where: {
              status: 'ACTIVE',
            },
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              persons: true,
              groups: true,
              routines: true,
              goals: true,
            },
          },
        },
      },
      _count: {
        select: {
          roles: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

/**
 * Grant admin privileges to a user
 */
export async function grantAdminAccess(
  userId: string,
  grantedByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, isAdmin: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isAdmin) {
    throw new Error('User is already an admin');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: true },
  });

  await createAuditLog({
    userId: grantedByAdminId,
    action: AdminAction.USER_ADMIN_GRANTED,
    entityType: 'User',
    entityId: userId,
    changes: {
      isAdmin: { before: false, after: true },
      email: user.email,
    },
    ipAddress,
    userAgent,
  });

  logger.info(`Admin access granted to user ${userId} by ${grantedByAdminId}`);
}

/**
 * Revoke admin privileges from a user
 */
export async function revokeAdminAccess(
  userId: string,
  revokedByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, isAdmin: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isAdmin) {
    throw new Error('User is not an admin');
  }

  // Prevent self-revocation
  if (userId === revokedByAdminId) {
    throw new Error('Cannot revoke your own admin access');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: false },
  });

  await createAuditLog({
    userId: revokedByAdminId,
    action: AdminAction.USER_ADMIN_REVOKED,
    entityType: 'User',
    entityId: userId,
    changes: {
      isAdmin: { before: true, after: false },
      email: user.email,
    },
    ipAddress,
    userAgent,
  });

  logger.info(`Admin access revoked from user ${userId} by ${revokedByAdminId}`);
}

/**
 * Change user tier (admin override)
 */
export async function changeUserTier(
  roleId: string,
  newTier: Tier,
  changedByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  if (!role) {
    throw new Error('Role not found');
  }

  const oldTier = role.tier;

  await prisma.role.update({
    where: { id: roleId },
    data: { tier: newTier },
  });

  await createAuditLog({
    userId: changedByAdminId,
    action: AdminAction.TIER_CHANGED,
    entityType: 'Role',
    entityId: roleId,
    changes: {
      tier: { before: oldTier, after: newTier },
      userEmail: role.user.email,
      roleType: role.type,
    },
    ipAddress,
    userAgent,
  });

  logger.info(`Tier changed for role ${roleId} from ${oldTier} to ${newTier} by admin ${changedByAdminId}`);
}

/**
 * Set tier override for a specific role (custom limits)
 */
export async function setTierOverride(
  roleId: string,
  overrideLimits: Record<string, number>,
  setByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  if (!role) {
    throw new Error('Role not found');
  }

  const oldOverride = role.tierOverride;

  await prisma.role.update({
    where: { id: roleId },
    data: { tierOverride: overrideLimits },
  });

  await createAuditLog({
    userId: setByAdminId,
    action: AdminAction.TIER_OVERRIDE_SET,
    entityType: 'Role',
    entityId: roleId,
    changes: {
      tierOverride: { before: oldOverride, after: overrideLimits },
      userEmail: role.user.email,
      roleType: role.type,
    },
    ipAddress,
    userAgent,
  });

  logger.info(`Tier override set for role ${roleId} by admin ${setByAdminId}`);
}

/**
 * Remove tier override
 */
export async function removeTierOverride(
  roleId: string,
  removedByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  if (!role) {
    throw new Error('Role not found');
  }

  const oldOverride = role.tierOverride;

  await prisma.role.update({
    where: { id: roleId },
    data: { tierOverride: null },
  });

  await createAuditLog({
    userId: removedByAdminId,
    action: AdminAction.TIER_OVERRIDE_REMOVED,
    entityType: 'Role',
    entityId: roleId,
    changes: {
      tierOverride: { before: oldOverride, after: null },
      userEmail: role.user.email,
      roleType: role.type,
    },
    ipAddress,
    userAgent,
  });

  logger.info(`Tier override removed for role ${roleId} by admin ${removedByAdminId}`);
}

/**
 * Get system statistics
 */
export async function getSystemStatistics() {
  const [
    totalUsers,
    totalAdmins,
    verifiedUsers,
    totalRoles,
    tierCounts,
    tierCountsByType,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { isAdmin: true, deletedAt: null } }),
    prisma.user.count({ where: { emailVerified: { not: null }, deletedAt: null } }),
    prisma.role.count({ where: { deletedAt: null } }),
    prisma.role.groupBy({
      by: ['tier'],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.role.groupBy({
      by: ['type', 'tier'],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
  ]);

  const tierDistribution: Record<string, number> = {};
  tierCounts.forEach((item) => {
    tierDistribution[item.tier] = item._count;
  });

  // Group tier distribution by role type
  const tierDistributionByType: Record<string, Record<string, number>> = {
    PARENT: {},
    TEACHER: {},
  };
  tierCountsByType.forEach((item) => {
    if (item.type === 'PARENT' || item.type === 'TEACHER') {
      tierDistributionByType[item.type][item.tier] = item._count;
    }
  });

  return {
    totalUsers,
    totalAdmins,
    verifiedUsers,
    unverifiedUsers: totalUsers - verifiedUsers,
    totalRoles,
    tierDistribution,
    tierDistributionByType,
    recentUsers,
  };
}

/**
 * Delete user account (admin only, use with caution)
 * Uses soft delete - marks user as deleted instead of removing from database
 */
export async function deleteUserAccount(
  userId: string,
  deletedByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, isAdmin: true, roles: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Prevent deleting admin users
  if (user.isAdmin) {
    throw new Error('Cannot delete admin users. Revoke admin access first.');
  }

  // Prevent self-deletion
  if (userId === deletedByAdminId) {
    throw new Error('Cannot delete your own account');
  }

  await createAuditLog({
    userId: deletedByAdminId,
    action: AdminAction.USER_DELETED,
    entityType: 'User',
    entityId: userId,
    changes: {
      email: user.email,
      deletedAt: new Date().toISOString(),
    },
    ipAddress,
    userAgent,
  });

  /**
   * SOFT DELETE: Mark as deleted instead of hard delete
   * This preserves audit trail and allows potential recovery
   */
  const roleIds = user.roles.map((role) => role.id);

  await prisma.$transaction(async (tx) => {
    // Soft delete all roles first
    for (const roleId of roleIds) {
      await softDelete(tx as any, 'role', roleId);
    }

    // Soft delete the user
    await softDelete(tx as any, 'user', userId);

    // Revoke active codes
    await tx.code.updateMany({
      where: {
        roleId: { in: roleIds },
        status: 'ACTIVE',
      },
      data: {
        status: 'REVOKED',
      },
    });
  });

  // Note: We do NOT delete from Supabase Auth to allow potential account recovery
  // If permanent deletion is needed, admin can do it manually from Supabase dashboard

  logger.info(`User ${userId} soft-deleted by admin ${deletedByAdminId}`);
}
