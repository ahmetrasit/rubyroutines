import { z } from 'zod';
import { router, adminProcedure } from '../init';
import {
  getAllSettings,
  getSettingsByCategory,
  getSetting,
  setSetting,
  deleteSetting,
  SettingCategory,
  getKioskRateLimits,
  updateKioskRateLimits,
} from '@/lib/services/admin/system-settings.service';
import { RoleType } from '@/lib/types/prisma-enums';
import {
  getCacheStats,
  clearAllCache,
  CACHE_TTL,
  CACHE_CONFIG,
} from '@/lib/services/cache.service';

// Helper function to get default colors for role types
function getDefaultColor(roleType: string): string {
  const defaultColors: Record<string, string> = {
    PARENT: '#9333ea', // Purple
    TEACHER: '#3b82f6', // Blue
    PRINCIPAL: '#f59e0b', // Amber
    SUPPORT: '#10b981', // Green
  };
  return defaultColors[roleType] || '#6b7280'; // Gray as fallback
}

export const adminSettingsRouter = router({
  // Get all settings
  getAll: adminProcedure.query(async () => {
    return await getAllSettings();
  }),

  // Get settings by category
  getByCategory: adminProcedure
    .input(
      z.object({
        category: z.nativeEnum(SettingCategory),
      })
    )
    .query(async ({ input }) => {
      return await getSettingsByCategory(input.category);
    }),

  // Get specific setting
  get: adminProcedure
    .input(
      z.object({
        key: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getSetting(input.key);
    }),

  // Set setting
  set: adminProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.any(),
        category: z.nativeEnum(SettingCategory),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      return await setSetting(
        {
          key: input.key,
          value: input.value,
          category: input.category,
          description: input.description,
        },
        ctx.user.id,
        undefined,
        undefined
      );
    }),

  // Delete setting
  delete: adminProcedure
    .input(
      z.object({
        key: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      await deleteSetting(
        input.key,
        ctx.user.id,
        undefined,
        undefined
      );

      return { success: true };
    }),

  // Get role colors
  getRoleColors: adminProcedure.query(async ({ ctx }) => {
    const roles = await ctx.prisma.role.findMany({
      select: {
        type: true,
        color: true,
      },
      distinct: ['type'],
    });

    // Create a map of role types to their colors
    const roleColors = roles.reduce((acc, role) => {
      acc[role.type] = role.color || getDefaultColor(role.type);
      return acc;
    }, {} as Record<string, string>);

    // Ensure all role types are present
    Object.values(RoleType).forEach((type) => {
      if (!roleColors[type]) {
        roleColors[type] = getDefaultColor(type);
      }
    });

    return roleColors;
  }),

  // Update role color
  updateRoleColor: adminProcedure
    .input(
      z.object({
        roleType: z.nativeEnum(RoleType),
        color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update all roles of this type with the new color
      await ctx.prisma.role.updateMany({
        where: { type: input.roleType },
        data: { color: input.color },
      });

      return { success: true };
    }),

  // Get kiosk rate limits
  getKioskRateLimits: adminProcedure.query(async () => {
    return await getKioskRateLimits();
  }),

  // Update kiosk rate limits
  updateKioskRateLimits: adminProcedure
    .input(
      z.object({
        SESSION: z.object({
          limit: z.number().min(1).max(1000),
          windowMs: z.number().min(60000).max(86400000), // 1 min to 24 hours
          description: z.string(),
        }),
        CODE: z.object({
          limit: z.number().min(1).max(1000),
          windowMs: z.number().min(60000).max(86400000),
          description: z.string(),
        }),
        IP: z.object({
          limit: z.number().min(1).max(1000),
          windowMs: z.number().min(60000).max(86400000),
          description: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateKioskRateLimits(
        input,
        ctx.user.id,
        undefined,
        undefined
      );

      return { success: true };
    }),

  // Get cache statistics for monitoring
  getCacheStats: adminProcedure.query(async () => {
    const stats = getCacheStats();
    return {
      ...stats,
      hitRatePercent: (stats.hitRate * 100).toFixed(2) + '%',
      config: {
        ttl: CACHE_TTL,
        maxMemorySize: CACHE_CONFIG.MAX_MEMORY_SIZE,
        evictionPercent: CACHE_CONFIG.EVICTION_PERCENT,
        cleanupIntervalMs: CACHE_CONFIG.CLEANUP_INTERVAL_MS,
      },
    };
  }),

  // Clear all cache (use with caution)
  clearCache: adminProcedure.mutation(async () => {
    await clearAllCache();
    return { success: true, message: 'All cache cleared successfully' };
  }),
});
