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
import { sendPersonSharingInvite } from '@/lib/email/email.service';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';

export const personSharingRouter = router({
  /**
   * Generate person sharing invite
   */
  generateInvite: authorizedProcedure
    .input(
      z.object({
        ownerRoleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
        ownerPersonId: z.string().cuid().optional(),
        shareType: z.enum(['PERSON', 'ROUTINE_ACCESS', 'FULL_ROLE']),
        permissions: z.enum(['VIEW', 'EDIT', 'MANAGE']),
        contextData: z.any().optional(),
        expiresInDays: z.number().min(1).max(365).default(90),
        maxUses: z.number().min(1).optional(),
        recipientEmail: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found' });
      }

      const code = await generatePersonSharingInvite(input);

      // Send email if recipient email is provided
      if (input.recipientEmail) {
        // Get inviter name
        const inviterName = ctx.user.name || ctx.user.email;

        // Get person name if applicable
        let personName: string | undefined;
        if (input.ownerPersonId) {
          const person = await prisma.person.findUnique({
            where: { id: input.ownerPersonId },
            select: { name: true },
          });
          personName = person?.name;
        }

        // Calculate expiry date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

        // Send invitation email
        await sendPersonSharingInvite({
          to: input.recipientEmail,
          inviterName,
          personName,
          shareType: input.shareType,
          permissions: input.permissions,
          inviteCode: code,
          expiresAt,
        });
      }

      return { code, emailSent: !!input.recipientEmail };
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
        claimingRoleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
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
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
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
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
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
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
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

  /**
   * Get person shares for a specific person (who has access to this person)
   */
  getPersonShares: authorizedProcedure
    .input(
      z.object({
        personId: z.string().cuid(),
      })
    )
    .query(async ({ input }) => {
      const connections = await prisma.personSharingConnection.findMany({
        where: {
          ownerPersonId: input.personId,
          status: 'ACTIVE',
        },
        include: {
          sharedWithRole: {
            include: {
              user: {
                select: { name: true, email: true, image: true },
              },
            },
          },
        },
      });

      return connections;
    }),
});
