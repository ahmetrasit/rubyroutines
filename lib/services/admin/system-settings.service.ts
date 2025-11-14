import { prisma } from '@/lib/prisma';
import { Tier } from '@/lib/types/prisma-enums';
import { createAuditLog, AdminAction } from './audit.service';
import { logger } from '@/lib/utils/logger';

export enum SettingCategory {
  GENERAL = 'general',
  TIERS = 'tiers',
  FEATURES = 'features',
  SECURITY = 'security',
  BILLING = 'billing',
  MARKETPLACE = 'marketplace',
}

export interface SystemSetting {
  key: string;
  value: any;
  category: SettingCategory;
  description?: string;
}

/**
 * Get a system setting by key
 */
export async function getSetting(key: string): Promise<any | null> {
  const setting = await prisma.systemSettings.findUnique({
    where: { key },
  });

  if (!setting) {
    return null;
  }

  return setting.value;
}

/**
 * Get all settings by category
 */
export async function getSettingsByCategory(category: SettingCategory) {
  const settings = await prisma.systemSettings.findMany({
    where: { category },
    orderBy: { key: 'asc' },
  });

  return settings;
}

/**
 * Get all system settings
 */
export async function getAllSettings() {
  const settings = await prisma.systemSettings.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  });

  // Group by category
  const grouped: Record<string, any[]> = {};
  settings.forEach((setting) => {
    if (!grouped[setting.category]) {
      grouped[setting.category] = [];
    }
    grouped[setting.category].push({
      key: setting.key,
      value: setting.value,
      description: setting.description,
    });
  });

  return grouped;
}

/**
 * Set a system setting
 */
export async function setSetting(
  setting: SystemSetting,
  setByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const existing = await prisma.systemSettings.findUnique({
    where: { key: setting.key },
  });

  const oldValue = existing?.value || null;

  const updated = await prisma.systemSettings.upsert({
    where: { key: setting.key },
    update: {
      value: setting.value,
      category: setting.category,
      description: setting.description || null,
    },
    create: {
      key: setting.key,
      value: setting.value,
      category: setting.category,
      description: setting.description || null,
    },
  });

  await createAuditLog({
    userId: setByAdminId,
    action: existing ? AdminAction.SETTINGS_CHANGED : AdminAction.SETTINGS_CREATED,
    entityType: 'SystemSettings',
    entityId: updated.id,
    changes: {
      key: setting.key,
      value: { before: oldValue, after: setting.value },
      category: setting.category,
    },
    ipAddress,
    userAgent,
  });

  logger.info(`System setting ${setting.key} updated by admin ${setByAdminId}`);

  return updated;
}

/**
 * Delete a system setting
 */
export async function deleteSetting(
  key: string,
  deletedByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const setting = await prisma.systemSettings.findUnique({
    where: { key },
  });

  if (!setting) {
    throw new Error('Setting not found');
  }

  await prisma.systemSettings.delete({
    where: { key },
  });

  await createAuditLog({
    userId: deletedByAdminId,
    action: AdminAction.SETTINGS_DELETED,
    entityType: 'SystemSettings',
    entityId: setting.id,
    changes: {
      key,
      value: setting.value,
      category: setting.category,
    },
    ipAddress,
    userAgent,
  });

  logger.info(`System setting ${key} deleted by admin ${deletedByAdminId}`);
}

/**
 * Get tier limits (system-level)
 */
export async function getTierLimits() {
  const defaultLimits = {
    [Tier.FREE]: {
      parent: {
        persons: 3,
        maxCoParents: 0,
        routines: 10,
        tasksPerRoutine: 10,
        goals: 3,
        kioskCodes: 1,
      },
      teacher: {
        classrooms: 1,
        studentsPerClassroom: 5,
        maxCoTeachers: 0,
        routines: 10,
        tasksPerRoutine: 10,
        goals: 3,
        kioskCodes: 1,
      },
    },
    [Tier.BRONZE]: {
      parent: {
        persons: 10,
        maxCoParents: 1,
        routines: 50,
        tasksPerRoutine: 20,
        goals: 10,
        kioskCodes: 5,
      },
      teacher: {
        classrooms: 3,
        studentsPerClassroom: 20,
        maxCoTeachers: 2,
        routines: 50,
        tasksPerRoutine: 20,
        goals: 10,
        kioskCodes: 5,
      },
    },
    [Tier.GOLD]: {
      parent: {
        persons: 50,
        maxCoParents: 3,
        routines: 200,
        tasksPerRoutine: 50,
        goals: 50,
        kioskCodes: 20,
      },
      teacher: {
        classrooms: 10,
        studentsPerClassroom: 50,
        maxCoTeachers: 5,
        routines: 200,
        tasksPerRoutine: 50,
        goals: 50,
        kioskCodes: 20,
      },
    },
    [Tier.PRO]: {
      parent: {
        persons: 100,
        maxCoParents: 5,
        routines: 500,
        tasksPerRoutine: 100,
        goals: 200,
        kioskCodes: 50,
      },
      teacher: {
        classrooms: 50,
        studentsPerClassroom: 100,
        maxCoTeachers: 10,
        routines: 1000,
        tasksPerRoutine: 100,
        goals: 200,
        kioskCodes: 100,
      },
    },
  };

  try {
    const setting = await getSetting('tier_limits');

    if (!setting) {
      // Return default limits with separate parent and teacher sections
      return defaultLimits;
    }

    // Migrate old tier names to new ones if present (mapping only, no database write)
    const tierNameMap: Record<string, Tier> = {
      'BASIC': Tier.BRONZE,
      'PREMIUM': Tier.GOLD,
      'SCHOOL': Tier.PRO,
    };

    const migratedSetting: any = {};

    for (const [oldKey, value] of Object.entries(setting)) {
      if (tierNameMap[oldKey]) {
        // Old tier name found, map to new name
        migratedSetting[tierNameMap[oldKey]] = value;
      } else {
        // Already using new name or is FREE tier
        migratedSetting[oldKey] = value;
      }
    }

    return migratedSetting;
  } catch (error) {
    // If there's any database error, log it and return defaults
    logger.error('Error fetching tier limits from database:', error);
    return defaultLimits;
  }
}

/**
 * Update tier limits (system-level)
 */
export async function updateTierLimits(
  limits: Record<Tier, Record<string, number>>,
  updatedByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const oldLimits = await getTierLimits();

  await setSetting(
    {
      key: 'tier_limits',
      value: limits,
      category: SettingCategory.TIERS,
      description: 'System-wide tier limits',
    },
    updatedByAdminId,
    ipAddress,
    userAgent
  );

  await createAuditLog({
    userId: updatedByAdminId,
    action: AdminAction.SYSTEM_TIER_LIMITS_UPDATED,
    entityType: 'SystemSettings',
    entityId: 'tier_limits',
    changes: {
      limits: { before: oldLimits, after: limits },
    },
    ipAddress,
    userAgent,
  });

  logger.info(`Tier limits updated by admin ${updatedByAdminId}`);
}

/**
 * Get tier prices (system-level)
 */
export async function getTierPrices() {
  const defaultPrices = {
    [Tier.BRONZE]: {
      parent: 199, // $1.99
      teacher: 499, // $4.99
    },
    [Tier.GOLD]: {
      parent: 399, // $3.99
      teacher: 999, // $9.99
    },
    [Tier.PRO]: {
      parent: 1299, // $12.99
      teacher: 2999, // $29.99
    },
  };

  try {
    const setting = await getSetting('tier_prices');

    if (!setting) {
      // Return default prices (in cents)
      return defaultPrices;
    }

    // Migrate old tier names to new ones if present (mapping only, no database write)
    const tierNameMap: Record<string, Tier> = {
      'BASIC': Tier.BRONZE,
      'PREMIUM': Tier.GOLD,
      'SCHOOL': Tier.PRO,
    };

    const migratedSetting: any = {};

    for (const [oldKey, value] of Object.entries(setting)) {
      if (tierNameMap[oldKey]) {
        // Old tier name found, map to new name
        migratedSetting[tierNameMap[oldKey]] = value;
      } else {
        // Already using new name
        migratedSetting[oldKey] = value;
      }
    }

    // Migrate old flat structure to nested parent/teacher structure
    for (const [tier, value] of Object.entries(migratedSetting)) {
      if (typeof value === 'number') {
        // Old flat structure, convert to nested
        migratedSetting[tier] = {
          parent: value,
          teacher: value,
        };
      }
    }

    return migratedSetting;
  } catch (error) {
    // If there's any database error, log it and return defaults
    logger.error('Error fetching tier prices from database:', error);
    return defaultPrices;
  }
}

/**
 * Update tier prices (system-level)
 */
export async function updateTierPrices(
  prices: Record<string, number>,
  updatedByAdminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const oldPrices = await getTierPrices();

  await setSetting(
    {
      key: 'tier_prices',
      value: prices,
      category: SettingCategory.TIERS,
      description: 'System-wide tier prices (in cents)',
    },
    updatedByAdminId,
    ipAddress,
    userAgent
  );

  await createAuditLog({
    userId: updatedByAdminId,
    action: AdminAction.SYSTEM_TIER_PRICES_UPDATED,
    entityType: 'SystemSettings',
    entityId: 'tier_prices',
    changes: {
      prices: { before: oldPrices, after: prices },
    },
    ipAddress,
    userAgent,
  });

  logger.info(`Tier prices updated by admin ${updatedByAdminId}`);
}

/**
 * Get effective tier limits for a role (considers overrides)
 */
export async function getEffectiveTierLimits(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      tier: true,
      tierOverride: true,
    },
  });

  if (!role) {
    throw new Error('Role not found');
  }

  // If role has custom override, return that
  if (role.tierOverride) {
    return role.tierOverride;
  }

  // Otherwise, get system-level limits for the tier
  const systemLimits = await getTierLimits();
  return systemLimits[role.tier];
}

/**
 * Initialize default system settings
 */
export async function initializeDefaultSettings() {
  const defaults: SystemSetting[] = [
    {
      key: 'tier_limits',
      value: await getTierLimits(),
      category: SettingCategory.TIERS,
      description: 'System-wide tier limits',
    },
    {
      key: 'tier_prices',
      value: await getTierPrices(),
      category: SettingCategory.TIERS,
      description: 'System-wide tier prices (in cents)',
    },
    {
      key: 'maintenance_mode',
      value: false,
      category: SettingCategory.GENERAL,
      description: 'Enable maintenance mode',
    },
    {
      key: 'registration_enabled',
      value: true,
      category: SettingCategory.GENERAL,
      description: 'Allow new user registrations',
    },
    {
      key: 'marketplace_enabled',
      value: true,
      category: SettingCategory.FEATURES,
      description: 'Enable marketplace feature',
    },
    {
      key: 'max_login_attempts',
      value: 5,
      category: SettingCategory.SECURITY,
      description: 'Maximum login attempts before lockout',
    },
    {
      key: 'session_timeout',
      value: 86400, // 24 hours in seconds
      category: SettingCategory.SECURITY,
      description: 'Session timeout in seconds',
    },
  ];

  for (const setting of defaults) {
    const existing = await prisma.systemSettings.findUnique({
      where: { key: setting.key },
    });

    if (!existing) {
      await prisma.systemSettings.create({
        data: setting,
      });
      logger.info(`Initialized default setting: ${setting.key}`);
    }
  }
}
