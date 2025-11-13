import { z } from 'zod';
import { router } from '../init';
import { adminProcedure } from '../middleware/auth';
import {
  getAllSettings,
  getSettingsByCategory,
  getSetting,
  setSetting,
  deleteSetting,
  SettingCategory,
} from '@/lib/services/admin/system-settings.service';

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
        ipAddress,
        userAgent
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
        ipAddress,
        userAgent
      );

      return { success: true };
    }),
});
