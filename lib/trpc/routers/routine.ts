import { router, authorizedProcedure, verifyRoutineOwnership } from '../init';
import { TRPCError } from '@trpc/server';
import { EntityStatus } from '@/lib/types/prisma-enums';
import { checkTierLimit, mapDatabaseLimitsToComponentFormat } from '@/lib/services/tier-limits';
import { z } from 'zod';
import { getEffectiveTierLimits } from '@/lib/services/admin/system-settings.service';
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
import { generateRoutineShareCode } from '@/lib/services/routine-share-code';

export const routineRouter = router({
  list: authorizedProcedure.input(listRoutinesSchema).query(async ({ ctx, input }) => {
    // REQUIREMENT #4: Get requesting user's role to determine if they should see teacher-only routines
    const requestingRole = await ctx.prisma.role.findFirst({
      where: { userId: ctx.user.id },
      select: { type: true },
    });

    const isTeacher = requestingRole?.type === 'TEACHER';

    const where: any = {
      status: input.includeInactive ? undefined : EntityStatus.ACTIVE,
      // Hide teacher-only routines from non-teachers
      ...(isTeacher ? {} : { isTeacherOnly: false }),
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
        // Remove full task fetching - just use count for list view
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
    });

    if (!role) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
    }

    // Get effective tier limits from database
    const dbLimits = await getEffectiveTierLimits(role.id);
    const effectiveLimits = mapDatabaseLimitsToComponentFormat(dbLimits as any, role.type);

    // Check tier limit for routines per person (only counting ACTIVE routines)
    // Use a single batch query instead of N+1 pattern
    const routineCounts = await ctx.prisma.routineAssignment.groupBy({
      by: ['personId'],
      where: {
        personId: { in: personIds },
        routine: {
          status: EntityStatus.ACTIVE,
        },
      },
      _count: true,
    });

    // Create a map of personId to routine count
    const routineCountMap = new Map<string, number>();
    routineCounts.forEach((rc) => {
      routineCountMap.set(rc.personId, rc._count);
    });

    // Check tier limit for each person
    for (const personId of personIds) {
      const personRoutineCount = routineCountMap.get(personId) || 0;
      checkTierLimit(effectiveLimits, 'routines_per_person', personRoutineCount);
    }

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

    if (existingRoutine?.name?.includes('Daily Routine') && data.name && !data.name.includes('Daily Routine')) {
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

    if (existingRoutine?.name?.includes('Daily Routine')) {
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

    // Get role and tier limits
    const role = await ctx.prisma.role.findUnique({
      where: { id: source.roleId },
    });

    if (!role) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Role not found' });
    }

    const dbLimits = await getEffectiveTierLimits(role.id);
    const effectiveLimits = mapDatabaseLimitsToComponentFormat(dbLimits as any, role.type);

    // Check if this is a Daily Routine (should be merged instead of duplicated)
    const isDailyRoutine = source.name.includes('Daily Routine');

    // Batch query to get routine counts for all target persons
    const routineCounts = await ctx.prisma.routineAssignment.groupBy({
      by: ['personId'],
      where: {
        personId: { in: input.targetPersonIds },
        routine: {
          status: EntityStatus.ACTIVE,
        },
      },
      _count: true,
    });

    // Create a map of personId to routine count
    const routineCountMap = new Map<string, number>();
    routineCounts.forEach((rc) => {
      routineCountMap.set(rc.personId, rc._count);
    });

    // If Daily Routine, batch query to find existing Daily Routines for all persons
    let existingDailyRoutinesMap = new Map<string, any>();
    if (isDailyRoutine) {
      const existingDailyRoutines = await ctx.prisma.routine.findMany({
        where: {
          roleId: source.roleId,
          name: { contains: 'Daily Routine' },
          status: EntityStatus.ACTIVE,
          assignments: {
            some: {
              personId: { in: input.targetPersonIds },
            },
          },
        },
        include: {
          assignments: {
            where: {
              personId: { in: input.targetPersonIds },
            },
          },
        },
      });

      // Map each existing Daily Routine to its person
      existingDailyRoutines.forEach((routine) => {
        routine.assignments.forEach((assignment: any) => {
          existingDailyRoutinesMap.set(assignment.personId, routine);
        });
      });
    }

    // Check tier limits for each target person before copying
    for (const personId of input.targetPersonIds) {
      // If Daily Routine and person already has one, merging won't create a new routine
      if (isDailyRoutine && existingDailyRoutinesMap.has(personId)) {
        continue; // Skip limit check if merging into existing Daily Routine
      }

      // Check routine limit for this person using the pre-fetched count
      const personRoutineCount = routineCountMap.get(personId) || 0;
      checkTierLimit(effectiveLimits, 'routines_per_person', personRoutineCount);
    }

    // Fetch last task order for existing Daily Routines that need merging
    let lastTaskOrderMap = new Map<string, number>();
    if (isDailyRoutine && existingDailyRoutinesMap.size > 0) {
      const routineIds = Array.from(existingDailyRoutinesMap.values()).map((r) => r.id);
      const lastTasks = await ctx.prisma.task.findMany({
        where: {
          routineId: { in: routineIds },
          status: EntityStatus.ACTIVE,
        },
        orderBy: { order: 'desc' },
        distinct: ['routineId'],
      });

      lastTasks.forEach(task => {
        lastTaskOrderMap.set(task.routineId, task.order);
      });
    }

    // Create copies or merge for each target person
    const results = await Promise.all(
      input.targetPersonIds.map(async (personId) => {
        // If Daily Routine, check if we already have the existing routine from our batch query
        if (isDailyRoutine) {
          const existingDailyRoutine = existingDailyRoutinesMap.get(personId);

          if (existingDailyRoutine) {
            // Merge: Add tasks to existing Daily Routine
            const lastTaskOrder = lastTaskOrderMap.get(existingDailyRoutine.id) || 0;

            await Promise.all(
              source.tasks.map((task: any, index: number) =>
                ctx.prisma.task.create({
                  data: {
                    routineId: existingDailyRoutine.id,
                    name: task.name,
                    description: task.description,
                    type: task.type,
                    order: lastTaskOrder + index + 1,
                    targetValue: task.targetValue,
                    unit: task.unit,
                  },
                })
              )
            );

            return { merged: true, routine: existingDailyRoutine, taskCount: source.tasks.length };
          }
        }

        // Create new routine (either not Daily Routine, or no existing Daily Routine found)
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

        return { merged: false, routine, taskCount: source.tasks.length };
      })
    );

    return results;
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

  generateShareCode: authorizedProcedure
    .input(
      z.object({
        routineId: z.string().cuid(),
        maxUses: z.number().int().positive().optional(),
        expiresInDays: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify routine ownership
      await verifyRoutineOwnership(ctx.user.id, input.routineId, ctx.prisma);

      const routine = await ctx.prisma.routine.findUnique({
        where: { id: input.routineId },
      });

      if (!routine) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
      }

      // Generate share code
      const code = await generateRoutineShareCode(
        input.routineId,
        ctx.user.id,
        input.maxUses,
        input.expiresInDays
      );

      return { code };
    }),
});
