import { router, authorizedProcedure } from '../init';
import { z } from 'zod';
import {
  generatePersonSharingInvite,
  validatePersonSharingInvite,
  claimPersonSharingInvite,
  revokePersonSharingConnection,
  getPersonSharingConnections,
} from '@/lib/services/person-sharing-code';
import {
  hasAccessToPerson,
  getAccessiblePersons,
} from '@/lib/services/person-sharing-access';

export const personSharingRouter = router({
  /**
   * Generate person sharing invite
   */
  generateInvite: authorizedProcedure
    .input(
      z.object({
        ownerRoleId: z.string().cuid(),
        ownerPersonId: z.string().cuid().optional(),
        shareType: z.enum(['PERSON', 'ROUTINE_ACCESS', 'FULL_ROLE']),
        permissions: z.enum(['VIEW', 'EDIT', 'MANAGE']),
        contextData: z.any().optional(),
        expiresInDays: z.number().min(1).max(365).default(90),
        maxUses: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const code = await generatePersonSharingInvite(input);
      return { code };
    }),

  /**
   * Validate person sharing invite
   */
  validateInvite: authorizedProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return await validatePersonSharingInvite(input);
    }),

  /**
   * Claim person sharing invite
   */
  claimInvite: authorizedProcedure
    .input(
      z.object({
        inviteCode: z.string(),
        claimingRoleId: z.string().cuid(),
        claimingUserId: z.string(),
        contextData: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await claimPersonSharingInvite(input);
    }),

  /**
   * Revoke connection
   */
  revokeConnection: authorizedProcedure
    .input(
      z.object({
        connectionId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not found');
      }

      return await revokePersonSharingConnection(
        input.connectionId,
        ctx.user.id
      );
    }),

  /**
   * Get my connections (owned or shared with me)
   */
  getConnections: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
        type: z.enum(['owned', 'shared_with_me']),
      })
    )
    .query(async ({ input }) => {
      return await getPersonSharingConnections(input.roleId, input.type);
    }),

  /**
   * Get accessible persons for a role
   */
  getAccessiblePersons: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not found');
      }

      return await getAccessiblePersons(input.roleId, ctx.user.id);
    }),

  /**
   * Check access to person
   */
  checkAccess: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
        personId: z.string().cuid(),
        requiredPermission: z.enum(['VIEW', 'EDIT', 'MANAGE']).default('VIEW'),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not found');
      }

      const hasAccess = await hasAccessToPerson(
        ctx.user.id,
        input.roleId,
        input.personId,
        input.requiredPermission
      );

      return { hasAccess };
    }),
});
