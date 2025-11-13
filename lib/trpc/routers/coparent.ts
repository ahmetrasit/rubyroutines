import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  sendInvitation,
  InvitationType,
  revokeCoParentAccess
} from '@/lib/services/invitation.service';
import { prisma } from '@/lib/db';

export const coParentRouter = router({
  // Send co-parent invitation
  invite: protectedProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
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
  list: protectedProcedure
    .input(
      z.object({
        roleId: z.string().cuid()
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

      return coParents.map((cp) => ({
        id: cp.id,
        coParentUser: cp.coParentRole.user,
        permissions: cp.permissions,
        personIds: cp.personIds,
        createdAt: cp.createdAt
      }));
    }),

  // Update co-parent permissions
  updatePermissions: protectedProcedure
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
  revoke: protectedProcedure
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
