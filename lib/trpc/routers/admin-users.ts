import { z } from 'zod';
import { Tier } from '@prisma/client';
import { router, adminProcedure } from '../init';
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

// Flexible ID validator that accepts both UUID and CUID formats
const idValidator = z.string().min(1).transform((val) => val.trim()).refine(
  (id) => {
    // Accept UUID format (with hyphens)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Accept CUID format (starts with 'c' followed by alphanumeric)
    const cuidRegex = /^c[a-z0-9]{24,}$/i;
    // Accept plain alphanumeric IDs
    const plainIdRegex = /^[a-z0-9_-]{10,}$/i;

    return uuidRegex.test(id) || cuidRegex.test(id) || plainIdRegex.test(id);
  },
  { message: 'Invalid ID format' }
);

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
        userId: idValidator,
      })
    )
    .query(async ({ input }) => {
      return await getUserDetails(input.userId);
    }),

  // Grant admin access
  grantAdmin: adminProcedure
    .input(
      z.object({
        userId: idValidator,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await grantAdminAccess(
        input.userId,
        ctx.user.id,
        ctx.ipAddress,
        ctx.userAgent
      );

      return { success: true };
    }),

  // Revoke admin access
  revokeAdmin: adminProcedure
    .input(
      z.object({
        userId: idValidator,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await revokeAdminAccess(
        input.userId,
        ctx.user.id,
        ctx.ipAddress,
        ctx.userAgent
      );

      return { success: true };
    }),

  // Change user tier
  changeTier: adminProcedure
    .input(
      z.object({
        roleId: idValidator,
        tier: z.nativeEnum(Tier),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await changeUserTier(
        input.roleId,
        input.tier,
        ctx.user.id,
        ctx.ipAddress,
        ctx.userAgent
      );

      return { success: true };
    }),

  // Set tier override (custom limits)
  setTierOverride: adminProcedure
    .input(
      z.object({
        roleId: idValidator,
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
      await setTierOverride(
        input.roleId,
        input.limits,
        ctx.user.id,
        ctx.ipAddress,
        ctx.userAgent
      );

      return { success: true };
    }),

  // Remove tier override
  removeTierOverride: adminProcedure
    .input(
      z.object({
        roleId: idValidator,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await removeTierOverride(
        input.roleId,
        ctx.user.id,
        ctx.ipAddress,
        ctx.userAgent
      );

      return { success: true };
    }),

  // Delete user account
  deleteUser: adminProcedure
    .input(
      z.object({
        userId: idValidator,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await deleteUserAccount(
        input.userId,
        ctx.user.id,
        ctx.ipAddress,
        ctx.userAgent
      );

      return { success: true };
    }),
});
