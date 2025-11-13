import { router, authorizedProcedure, verifyRoutineOwnership } from '../init';
import { TRPCError } from '@trpc/server';
import { EntityStatus } from '@/lib/types/prisma-enums';
import { checkTierLimit } from '@/lib/services/tier-limits';
import { z } from 'zod';
import {
  createRoutineSchema,
  updateRoutineSchema,
  deleteRoutineSchema,
  restoreRoutineSchema,
  listRoutinesSchema,
  getRoutineSchema,
  copyRoutineSchema,
  createVisibilityOverrideSchema,
  cancelVisibilityOverrideSchema,
} from '@/lib/validation/routine';

export const routineRouter = router({
  list: authorizedProcedure.input(listRoutinesSchema).query(async ({ ctx, input }) => {
    const where: any = {
      status: input.includeInactive ? undefined : EntityStatus.ACTIVE,
    };

    if (input.roleId) {
      where.roleId = input.roleId;
    }

    if (input.personId) {
      where.assignments = {
        some: {
          personId: input.personId,
        },
      };
    }

    const routines = await ctx.prisma.routine.findMany({
      where,
      include: {
        assignments: {
          include: {
            person: true,
          },
        },
        tasks: {
          where: { status: EntityStatus.ACTIVE },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            tasks: {
              where: { status: EntityStatus.ACTIVE },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return routines;
  }),

  getById: authorizedProcedure.input(getRoutineSchema).query(async ({ ctx, input }) => {
    // Verify routine ownership
    await verifyRoutineOwnership(ctx.user.id, input.id, ctx.prisma);
    const routine = await ctx.prisma.routine.findUnique({
      where: { id: input.id },
      include: {
        assignments: {
          include: {
            person: true,
          },
        },
        tasks: {
          where: { status: EntityStatus.ACTIVE },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!routine) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
    }

    return routine;
  }),

  create: authorizedProcedure.input(createRoutineSchema).mutation(async ({ ctx, input }) => {
    const { personIds, ...routineData } = input;

    // Check tier limit
    const role = await ctx.prisma.role.findUnique({
      where: { id: input.roleId },
      include: {
        routines: {
          where: { status: EntityStatus.ACTIVE },
        },
      },
    });

    if (!role) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
    }

    checkTierLimit(role.tier, 'routines_per_person', role.routines.length);

    // Create routine with assignments
    const routine = await ctx.prisma.routine.create({
      data: {
        ...routineData,
        assignments: {
          create: personIds.map((personId) => ({ personId })),
        },
      },
      include: {
        assignments: {
          include: {
            person: true,
          },
        },
      },
    });

    return routine;
  }),

  update: authorizedProcedure.input(updateRoutineSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;

    // Verify routine ownership
    await verifyRoutineOwnership(ctx.user.id, id, ctx.prisma);

    // Check if this is the "Daily Routine"
    const existingRoutine = await ctx.prisma.routine.findUnique({
      where: { id },
    });

    if (existingRoutine?.name === 'Daily Routine' && data.name && data.name !== 'Daily Routine') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot rename the Daily Routine',
      });
    }

    const routine = await ctx.prisma.routine.update({
      where: { id },
      data,
    });

    return routine;
  }),

  delete: authorizedProcedure.input(deleteRoutineSchema).mutation(async ({ ctx, input }) => {
    // Verify routine ownership
    await verifyRoutineOwnership(ctx.user.id, input.id, ctx.prisma);

    // Check if this is the "Daily Routine"
    const existingRoutine = await ctx.prisma.routine.findUnique({
      where: { id: input.id },
    });

    if (existingRoutine?.name === 'Daily Routine') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot delete the Daily Routine',
      });
    }

    const routine = await ctx.prisma.routine.update({
      where: { id: input.id },
      data: {
        status: EntityStatus.INACTIVE,
        archivedAt: new Date(),
      },
    });

    return routine;
  }),

  restore: authorizedProcedure
    .input(restoreRoutineSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify routine ownership
      await verifyRoutineOwnership(ctx.user.id, input.id, ctx.prisma);
      const routine = await ctx.prisma.routine.update({
        where: { id: input.id },
        data: {
          status: EntityStatus.ACTIVE,
          archivedAt: null,
        },
      });

      return routine;
    }),

  copy: authorizedProcedure.input(copyRoutineSchema).mutation(async ({ ctx, input }) => {
    // Verify routine ownership
    await verifyRoutineOwnership(ctx.user.id, input.routineId, ctx.prisma);
    // Get source routine
    const source = await ctx.prisma.routine.findUnique({
      where: { id: input.routineId },
      include: {
        tasks: {
          where: { status: EntityStatus.ACTIVE },
        },
      },
    });

    if (!source) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
    }

    // Create copies for each target person
    const copies = await Promise.all(
      input.targetPersonIds.map(async (personId) => {
        const routine = await ctx.prisma.routine.create({
          data: {
            roleId: source.roleId,
            name: source.name,
            description: source.description,
            type: source.type,
            resetPeriod: source.resetPeriod,
            resetDay: source.resetDay,
            visibility: source.visibility,
            visibleDays: source.visibleDays,
            startDate: source.startDate,
            endDate: source.endDate,
            assignments: {
              create: { personId },
            },
            tasks: {
              create: source.tasks.map((task: any) => ({
                name: task.name,
                description: task.description,
                type: task.type,
                order: task.order,
                targetValue: task.targetValue,
                unit: task.unit,
              })),
            },
          },
        });

        return routine;
      })
    );

    return copies;
  }),

  createVisibilityOverride: authorizedProcedure
    .input(createVisibilityOverrideSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify routine ownership
      await verifyRoutineOwnership(ctx.user.id, input.routineId, ctx.prisma);
      const routine = await ctx.prisma.routine.findUnique({
        where: { id: input.routineId },
      });

      if (!routine) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
      }

      // Cancel any existing override
      await ctx.prisma.visibilityOverride.deleteMany({
        where: {
          routineId: input.routineId,
        },
      });

      // Create new override
      const override = await ctx.prisma.visibilityOverride.create({
        data: {
          routineId: input.routineId,
          expiresAt: new Date(Date.now() + input.duration * 60 * 1000),
        },
      });

      return override;
    }),

  cancelVisibilityOverride: authorizedProcedure
    .input(cancelVisibilityOverrideSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify routine ownership
      await verifyRoutineOwnership(ctx.user.id, input.routineId, ctx.prisma);
      await ctx.prisma.visibilityOverride.deleteMany({
        where: {
          routineId: input.routineId,
        },
      });

      return { success: true };
    }),

  getVisibilityOverride: authorizedProcedure
    .input(z.object({ routineId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify routine ownership
      await verifyRoutineOwnership(ctx.user.id, input.routineId, ctx.prisma);
      const override = await ctx.prisma.visibilityOverride.findFirst({
        where: {
          routineId: input.routineId,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return override;
    }),
});
