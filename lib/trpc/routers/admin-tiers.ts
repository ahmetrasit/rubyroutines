import { z } from 'zod';
import { router, adminProcedure } from '../init';
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
            parent: z.object({
              persons: z.number().int().min(0),
              maxCoParents: z.number().int().min(0),
              routines: z.number().int().min(0),
              smartRoutines: z.number().int().min(0),
              tasksPerRoutine: z.number().int().min(0),
              smartTasksPerRoutine: z.number().int().min(0),
              goals: z.number().int().min(0),
              kioskCodes: z.number().int().min(0),
            }),
            teacher: z.object({
              classrooms: z.number().int().min(0),
              studentsPerClassroom: z.number().int().min(0),
              maxCoTeachers: z.number().int().min(0),
              routines: z.number().int().min(0),
              smartRoutines: z.number().int().min(0),
              tasksPerRoutine: z.number().int().min(0),
              smartTasksPerRoutine: z.number().int().min(0),
              goals: z.number().int().min(0),
              kioskCodes: z.number().int().min(0),
            }),
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
        undefined,
        undefined
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
          BRONZE: z.object({
            parent: z.number().int().min(0),
            teacher: z.number().int().min(0),
          }),
          GOLD: z.object({
            parent: z.number().int().min(0),
            teacher: z.number().int().min(0),
          }),
          PRO: z.object({
            parent: z.number().int().min(0),
            teacher: z.number().int().min(0),
          }),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      await updateTierPrices(
        input.prices,
        ctx.user.id,
        undefined,
        undefined
      );

      return { success: true };
    }),

  // Get effective tier limits for a role
  getEffective: adminProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
      })
    )
    .query(async ({ input }) => {
      return await getEffectiveTierLimits(input.roleId);
    }),
});
