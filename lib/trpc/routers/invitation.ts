import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../init';
import { acceptInvitation, rejectInvitation } from '@/lib/services/invitation.service';
import { prisma } from '@/lib/prisma';

export const invitationRouter = router({
  // Get invitation details by token (public so user can view before accepting)
  getByToken: publicProcedure
    .input(
      z.object({
        token: z.string()
      })
    )
    .query(async ({ input }) => {
      const invitation = await prisma.invitation.findUnique({
        where: { token: input.token },
        include: {
          inviterRole: {
            include: { user: true }
          }
        }
      });

      if (!invitation) {
        throw new Error('Invalid invitation');
      }

      if (invitation.status !== 'PENDING') {
        throw new Error('Invitation already processed');
      }

      if (new Date() > invitation.expiresAt) {
        throw new Error('Invitation expired');
      }

      return {
        id: invitation.id,
        type: invitation.type,
        inviterName: invitation.inviterRole.user.name,
        inviterEmail: invitation.inviterRole.user.email,
        inviteeEmail: invitation.inviteeEmail,
        permissions: invitation.permissions,
        expiresAt: invitation.expiresAt
      };
    }),

  // Accept invitation
  accept: protectedProcedure
    .input(
      z.object({
        token: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await acceptInvitation(input.token, ctx.user.id);
      return { success: true };
    }),

  // Reject invitation
  reject: protectedProcedure
    .input(
      z.object({
        token: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await rejectInvitation(input.token);
      return { success: true };
    })
});
