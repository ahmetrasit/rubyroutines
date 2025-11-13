import { z } from 'zod';
import { router } from '../init';
import { adminProcedure } from '../middleware/auth';
import {
  searchUsers,
  getUserDetails,
  grantAdminAccess,
  revokeAdminAccess,
  changeUserTier,
  setTierOverride,
  removeTierOverride,
  getSystemStatistics,
  deleteUserAccount,
} from '@/lib/services/admin/user-management.service';
import { Tier } from '@/lib/types/prisma-enums';

export const adminUsersRouter = router({
  // Get system statistics
  statistics: adminProcedure.query(async () => {
    return await getSystemStatistics();
  }),

  // Search users
  search: adminProcedure
    .input(
      z.object({
        email: z.string().optional(),
        isAdmin: z.boolean().optional(),
        tier: z.nativeEnum(Tier).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return await searchUsers(input);
    }),

  // Get user details
  details: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
      })
    )
    .query(async ({ input }) => {
      return await getUserDetails(input.userId);
    }),

  // Grant admin access
  grantAdmin: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      await grantAdminAccess(
        input.userId,
        ctx.user.id,
        ipAddress,
        userAgent
      );

      return { success: true };
    }),

  // Revoke admin access
  revokeAdmin: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      await revokeAdminAccess(
        input.userId,
        ctx.user.id,
        ipAddress,
        userAgent
      );

      return { success: true };
    }),

  // Change user tier
  changeTier: adminProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
        tier: z.nativeEnum(Tier),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      await changeUserTier(
        input.roleId,
        input.tier,
        ctx.user.id,
        ipAddress,
        userAgent
      );

      return { success: true };
    }),

  // Set tier override (custom limits)
  setTierOverride: adminProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
        limits: z.object({
          persons: z.number().int().min(0).optional(),
          groups: z.number().int().min(0).optional(),
          routines: z.number().int().min(0).optional(),
          tasksPerRoutine: z.number().int().min(0).optional(),
          goals: z.number().int().min(0).optional(),
          kioskCodes: z.number().int().min(0).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      await setTierOverride(
        input.roleId,
        input.limits,
        ctx.user.id,
        ipAddress,
        userAgent
      );

      return { success: true };
    }),

  // Remove tier override
  removeTierOverride: adminProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      await removeTierOverride(
        input.roleId,
        ctx.user.id,
        ipAddress,
        userAgent
      );

      return { success: true };
    }),

  // Delete user account
  deleteUser: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // IP logging disabled - requires Next.js headers
      // User agent logging disabled - requires Next.js headers

      await deleteUserAccount(
        input.userId,
        ctx.user.id,
        ipAddress,
        userAgent
      );

      return { success: true };
    }),
});
