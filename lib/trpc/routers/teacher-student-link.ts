import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, authorizedProcedure } from '../init';
import { prisma } from '@/lib/prisma';

/**
 * Teacher Student Link Router
 * Allows teachers to link students across their own classrooms
 * for merged kiosk view (Level 1 linking)
 */
export const teacherStudentLinkRouter = router({
  /**
   * Create a link between two students owned by the same teacher
   */
  create: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        primaryStudentId: z.string().cuid(),
        linkedStudentId: z.string().cuid(),
        routineIds: z.array(z.string().cuid()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify teacher owns both students and they are actual students (not teachers/owners)
      const [primary, linked] = await Promise.all([
        prisma.person.findFirst({
          where: { id: input.primaryStudentId, roleId: input.roleId, status: 'ACTIVE' },
        }),
        prisma.person.findFirst({
          where: { id: input.linkedStudentId, roleId: input.roleId, status: 'ACTIVE' },
        }),
      ]);

      if (!primary || !linked) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Both students must belong to your account',
        });
      }

      // Prevent linking teachers or account owners
      if (primary.isTeacher || primary.isAccountOwner || linked.isTeacher || linked.isAccountOwner) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot link teachers or account owners - only students can be linked',
        });
      }

      // Prevent linking same student to itself
      if (input.primaryStudentId === input.linkedStudentId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot link a student to itself',
        });
      }

      // Check if link already exists (in either direction)
      const existingLink = await prisma.teacherStudentLink.findFirst({
        where: {
          roleId: input.roleId,
          status: 'ACTIVE',
          OR: [
            {
              primaryStudentId: input.primaryStudentId,
              linkedStudentId: input.linkedStudentId,
            },
            {
              primaryStudentId: input.linkedStudentId,
              linkedStudentId: input.primaryStudentId,
            },
          ],
        },
      });

      if (existingLink) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'These students are already linked',
        });
      }

      // Create the link
      return prisma.teacherStudentLink.create({
        data: {
          roleId: input.roleId,
          primaryStudentId: input.primaryStudentId,
          linkedStudentId: input.linkedStudentId,
          routineIds: input.routineIds ?? [],
          status: 'ACTIVE',
        },
        include: {
          primaryStudent: { select: { id: true, name: true, avatar: true } },
          linkedStudent: { select: { id: true, name: true, avatar: true } },
        },
      });
    }),

  /**
   * Remove (revoke) a link between students
   */
  remove: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        linkId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      const link = await prisma.teacherStudentLink.findUnique({
        where: { id: input.linkId },
      });

      if (!link || link.roleId !== input.roleId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      return prisma.teacherStudentLink.update({
        where: { id: input.linkId },
        data: { status: 'REVOKED' },
      });
    }),

  /**
   * List all active links for the teacher
   */
  list: authorizedProcedure
    .input(z.object({ roleId: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.teacherStudentLink.findMany({
        where: { roleId: input.roleId, status: 'ACTIVE' },
        include: {
          primaryStudent: { select: { id: true, name: true, avatar: true } },
          linkedStudent: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  /**
   * Get all links for a specific student
   */
  getForStudent: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        personId: z.string().cuid(),
      })
    )
    .query(async ({ input }) => {
      return prisma.teacherStudentLink.findMany({
        where: {
          roleId: input.roleId,
          status: 'ACTIVE',
          OR: [{ primaryStudentId: input.personId }, { linkedStudentId: input.personId }],
        },
        include: {
          primaryStudent: { select: { id: true, name: true, avatar: true } },
          linkedStudent: { select: { id: true, name: true, avatar: true } },
        },
      });
    }),

  /**
   * Update routine IDs for a link (limit which routines are shared)
   */
  updateRoutines: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        linkId: z.string().cuid(),
        routineIds: z.array(z.string().cuid()),
      })
    )
    .mutation(async ({ input }) => {
      const link = await prisma.teacherStudentLink.findUnique({
        where: { id: input.linkId },
      });

      if (!link || link.roleId !== input.roleId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Link not found',
        });
      }

      return prisma.teacherStudentLink.update({
        where: { id: input.linkId },
        data: { routineIds: input.routineIds },
      });
    }),
});
