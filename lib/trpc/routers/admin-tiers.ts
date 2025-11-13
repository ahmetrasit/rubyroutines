import { z } from 'zod';
import { router } from '../init';
import { adminProcedure } from '../middleware/auth';
import {
  getTierLimits,
  updateTierLimits,
  getTierPrices,
  updateTierPrices,
  getEffectiveTierLimits,
} from '@/lib/services/admin/system-settings.service';
import { Tier } from '@/lib/types/prisma-enums';

export const adminTiersRouter = router({
  // Get system tier limits
  getLimits: adminProcedure.query(async () => {
    return await getTierLimits();
  }),

  // Update system tier limits
  updateLimits: adminProcedure
    .input(
      z.object({
        limits: z.record(
          z.nativeEnum(Tier),
          z.object({
            persons: z.number().int().min(0),
            groups: z.number().int().min(0),
            routines: z.number().int().min(0),
            tasksPerRoutine: z.number().int().min(0),
            goals: z.number().int().min(0),
            kioskCodes: z.number().int().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      await updateTierLimits(
        input.limits as any,
        ctx.user.id,
        ipAddress,
        userAgent
      );

      return { success: true };
    }),

  // Get tier prices
  getPrices: adminProcedure.query(async () => {
    return await getTierPrices();
  }),

  // Update tier prices
  updatePrices: adminProcedure
    .input(
      z.object({
        prices: z.object({
          BASIC: z.number().int().min(0),
          PREMIUM: z.number().int().min(0),
          SCHOOL: z.number().int().min(0),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      await updateTierPrices(
        input.prices,
        ctx.user.id,
        ipAddress,
        userAgent
      );

      return { success: true };
    }),

  // Get effective tier limits for a role
  getEffective: adminProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
      })
    )
    .query(async ({ input }) => {
      return await getEffectiveTierLimits(input.roleId);
    }),
});
