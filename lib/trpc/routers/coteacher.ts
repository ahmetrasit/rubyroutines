import { z } from 'zod';
import { router, authorizedProcedure, verifiedProcedure } from '../init';
import {
  sendInvitation,
  InvitationType,
  revokeCoTeacherAccess
} from '@/lib/services/invitation.service';
import { prisma } from '@/lib/prisma';

export const coTeacherRouter = router({
  // Share classroom with co-teacher
  // Requires email verification
  share: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().cuid(),
        groupId: z.string().cuid(),
        email: z.string().email(),
        permissions: z.enum(['VIEW', 'EDIT_TASKS', 'FULL_EDIT'])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await sendInvitation({
        inviterUserId: ctx.user.id,
        inviterRoleId: input.roleId,
        inviteeEmail: input.email,
        type: InvitationType.CO_TEACHER,
        permissions: input.permissions,
        groupIds: [input.groupId]
      });

      return result;
    }),

  // List co-teachers for group
  list: authorizedProcedure
    .input(
      z.object({
        groupId: z.string().cuid()
      })
    )
    .query(async ({ ctx, input }) => {
      const coTeachers = await prisma.coTeacher.findMany({
        where: {
          groupId: input.groupId,
          status: 'ACTIVE'
        },
        include: {
          coTeacherRole: {
            include: { user: true }
          }
        }
      });

      return coTeachers;
    }),

  // Update co-teacher permissions
  updatePermissions: authorizedProcedure
    .input(
      z.object({
        coTeacherId: z.string().cuid(),
        permissions: z.enum(['VIEW', 'EDIT_TASKS', 'FULL_EDIT'])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const coTeacher = await prisma.coTeacher.findUnique({
        where: { id: input.coTeacherId },
        include: { primaryTeacherRole: true }
      });

      if (coTeacher?.primaryTeacherRole.userId !== ctx.user.id) {
        throw new Error('Permission denied');
      }

      await prisma.coTeacher.update({
        where: { id: input.coTeacherId },
        data: {
          permissions: input.permissions
        }
      });

      return { success: true };
    }),

  // Revoke co-teacher access
  revoke: authorizedProcedure
    .input(
      z.object({
        coTeacherId: z.string().cuid()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await revokeCoTeacherAccess(input.coTeacherId, ctx.user.id);
      return { success: true };
    })
});
