import { z } from 'zod';
import { router, authorizedProcedure, verifiedProcedure } from '../init';
import {
  sendInvitation,
  InvitationType,
  revokeCoTeacherAccess
} from '@/lib/services/invitation.service';
import { prisma } from '@/lib/prisma';

// Schema for shared persons (per-student routine selection) - same as coparent.ts
const sharedPersonSchema = z.object({
  personId: z.string().cuid(),
  routineIds: z.array(z.string().cuid())
});

export const coTeacherRouter = router({
  // Share classroom with co-teacher
  // Requires email verification
  share: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
        groupId: z.string().cuid(),
        email: z.string().email(),
        permissions: z.enum(['VIEW', 'EDIT_TASKS', 'FULL_EDIT']),
        sharedPersons: z.array(sharedPersonSchema).optional() // New: per-student routine selection
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await sendInvitation({
        inviterUserId: ctx.user.id,
        inviterRoleId: input.roleId,
        inviteeEmail: input.email,
        type: InvitationType.CO_TEACHER,
        permissions: input.permissions,
        groupIds: [input.groupId],
        sharedPersons: input.sharedPersons // Pass new field
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
    }),

  // Get shared routine status for dashboard visibility
  // Returns completion status of co-teacher's shared routines for a linked student
  getSharedRoutineStatus: authorizedProcedure
    .input(
      z.object({
        personId: z.string().cuid() // The current user's student (linkedStudent)
      })
    )
    .query(async ({ ctx, input }) => {
      // Find CoTeacherStudentLinks where this student is the linked student (co-teacher's student)
      // This means we're looking at routines shared TO this student FROM the primary teacher
      const links = await prisma.coTeacherStudentLink.findMany({
        where: {
          linkedStudentId: input.personId,
          status: 'ACTIVE'
        },
        include: {
          primaryStudent: true,
          coTeacher: {
            include: {
              primaryTeacherRole: {
                include: {
                  user: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      });

      if (links.length === 0) {
        return [];
      }

      // For each link, get the shared routines and their completion status
      const sharedRoutines = await Promise.all(
        links.map(async (link) => {
          // Skip if no routines are shared
          if (!link.routineIds || link.routineIds.length === 0) {
            return null;
          }

          const routines = await prisma.routine.findMany({
            where: {
              id: { in: link.routineIds },
              status: 'ACTIVE'
            },
            include: {
              tasks: {
                where: { status: 'ACTIVE' },
                orderBy: { order: 'asc' },
                include: {
                  completions: {
                    where: { personId: link.primaryStudentId },
                    orderBy: { completedAt: 'desc' },
                    take: 1
                  }
                }
              }
            }
          });

          return {
            coTeacherName: link.coTeacher.primaryTeacherRole.user.name || 'Teacher',
            primaryStudentName: link.primaryStudent.name,
            primaryStudentId: link.primaryStudentId,
            routines: routines.map((r) => ({
              id: r.id,
              name: r.name,
              color: r.color,
              resetPeriod: r.resetPeriod,
              tasks: r.tasks.map((t) => ({
                id: t.id,
                name: t.name,
                emoji: t.emoji,
                type: t.type,
                isComplete: t.completions.length > 0,
                lastCompletedAt: t.completions[0]?.completedAt || null
              })),
              // Calculate overall routine completion
              completedTasksCount: r.tasks.filter((t) => t.completions.length > 0).length,
              totalTasksCount: r.tasks.length
            }))
          };
        })
      );

      // Filter out null entries (links with no shared routines)
      return sharedRoutines.filter(Boolean);
    })
});
