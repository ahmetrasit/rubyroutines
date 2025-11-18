import { z } from 'zod';
import { router, authorizedProcedure, verifiedProcedure } from '../init';
import {
  sendInvitation,
  InvitationType,
  revokeCoParentAccess
} from '@/lib/services/invitation.service';
import { prisma } from '@/lib/prisma';

export const coParentRouter = router({
  // Send co-parent invitation
  // Requires email verification
  invite: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
        email: z.string().email(),
        permissions: z.enum(['READ_ONLY', 'TASK_COMPLETION', 'FULL_EDIT']),
        personIds: z.array(z.string().cuid())
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await sendInvitation({
        inviterUserId: ctx.user.id,
        inviterRoleId: input.roleId,
        inviteeEmail: input.email,
        type: InvitationType.CO_PARENT,
        permissions: input.permissions,
        personIds: input.personIds
      });

      return result;
    }),

  // List co-parents
  list: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid() // Role IDs are UUIDs, not CUIDs
      })
    )
    .query(async ({ ctx, input }) => {
      const coParents = await prisma.coParent.findMany({
        where: {
          primaryRoleId: input.roleId,
          status: 'ACTIVE'
        },
        include: {
          coParentRole: {
            include: { user: true }
          }
        }
      });

      return coParents.map((cp: any) => ({
        id: cp.id,
        coParentUser: cp.coParentRole.user,
        permissions: cp.permissions,
        personIds: cp.personIds,
        createdAt: cp.createdAt
      }));
    }),

  // Update co-parent permissions
  updatePermissions: authorizedProcedure
    .input(
      z.object({
        coParentId: z.string().cuid(),
        permissions: z.enum(['READ_ONLY', 'TASK_COMPLETION', 'FULL_EDIT']),
        personIds: z.array(z.string().cuid()).optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const coParent = await prisma.coParent.findUnique({
        where: { id: input.coParentId },
        include: { primaryRole: true }
      });

      if (coParent?.primaryRole.userId !== ctx.user.id) {
        throw new Error('Permission denied');
      }

      await prisma.coParent.update({
        where: { id: input.coParentId },
        data: {
          permissions: input.permissions,
          ...(input.personIds && { personIds: input.personIds })
        }
      });

      return { success: true };
    }),

  // Revoke co-parent access
  revoke: authorizedProcedure
    .input(
      z.object({
        coParentId: z.string().cuid()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await revokeCoParentAccess(input.coParentId, ctx.user.id);
      return { success: true };
    })
});
