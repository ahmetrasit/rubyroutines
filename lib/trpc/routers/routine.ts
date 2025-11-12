import { router, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import { EntityStatus } from '@prisma/client';
import { checkTierLimit } from '@/lib/services/tier-limits';
import {
  createRoutineSchema,
  updateRoutineSchema,
  deleteRoutineSchema,
  restoreRoutineSchema,
  listRoutinesSchema,
  getRoutineSchema,
  copyRoutineSchema,
} from '@/lib/validation/routine';

export const routineRouter = router({
  list: protectedProcedure.input(listRoutinesSchema).query(async ({ ctx, input }) => {
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

  getById: protectedProcedure.input(getRoutineSchema).query(async ({ ctx, input }) => {
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

  create: protectedProcedure.input(createRoutineSchema).mutation(async ({ ctx, input }) => {
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

  update: protectedProcedure.input(updateRoutineSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;

    const routine = await ctx.prisma.routine.update({
      where: { id },
      data,
    });

    return routine;
  }),

  delete: protectedProcedure.input(deleteRoutineSchema).mutation(async ({ ctx, input }) => {
    const routine = await ctx.prisma.routine.update({
      where: { id: input.id },
      data: {
        status: EntityStatus.INACTIVE,
        archivedAt: new Date(),
      },
    });

    return routine;
  }),

  restore: protectedProcedure
    .input(restoreRoutineSchema)
    .mutation(async ({ ctx, input }) => {
      const routine = await ctx.prisma.routine.update({
        where: { id: input.id },
        data: {
          status: EntityStatus.ACTIVE,
          archivedAt: null,
        },
      });

      return routine;
    }),

  copy: protectedProcedure.input(copyRoutineSchema).mutation(async ({ ctx, input }) => {
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
              create: source.tasks.map((task) => ({
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
});
