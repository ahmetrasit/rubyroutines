import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, authorizedProcedure, verifiedProcedure } from '../init';
import {
  sendInvitation,
  InvitationType,
  revokeCoParentAccess
} from '@/lib/services/invitation.service';
import { prisma } from '@/lib/prisma';

// Schema for shared persons (per-kid routine selection)
const sharedPersonSchema = z.object({
  personId: z.string().cuid(),
  routineIds: z.array(z.string().cuid())
});

export const coParentRouter = router({
  // Send co-parent invitation
  // Requires email verification
  invite: verifiedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
        email: z.string().email(),
        permissions: z.enum(['READ_ONLY', 'TASK_COMPLETION', 'FULL_EDIT']),
        personIds: z.array(z.string().cuid()), // Kept for backward compatibility
        sharedPersons: z.array(sharedPersonSchema).optional() // New: per-kid routine selection
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await sendInvitation({
        inviterUserId: ctx.user.id,
        inviterRoleId: input.roleId,
        inviteeEmail: input.email,
        type: InvitationType.CO_PARENT,
        permissions: input.permissions,
        personIds: input.personIds,
        sharedPersons: input.sharedPersons // Pass new field
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
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Permission denied' });
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
    }),

  // Get shared routine status for dashboard visibility
  // Returns completion status of co-parent's shared routines for a linked person
  getSharedRoutineStatus: authorizedProcedure
    .input(
      z.object({
        personId: z.string().cuid() // The current user's kid (linkedPerson)
      })
    )
    .query(async ({ ctx, input }) => {
      // Find CoParentPersonLinks where this person is the linked person (co-parent's kid)
      // This means we're looking at routines shared TO this person FROM the primary parent
      const links = await prisma.coParentPersonLink.findMany({
        where: {
          linkedPersonId: input.personId,
          status: 'ACTIVE'
        },
        include: {
          primaryPerson: true,
          coParent: {
            include: {
              primaryRole: {
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
                    where: { personId: link.primaryPersonId },
                    orderBy: { completedAt: 'desc' },
                    take: 1
                  }
                }
              }
            }
          });

          return {
            coParentName: link.coParent.primaryRole.user.name || 'Co-Parent',
            primaryPersonName: link.primaryPerson.name,
            primaryPersonId: link.primaryPersonId,
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
