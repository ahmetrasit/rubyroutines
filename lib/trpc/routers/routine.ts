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
  checkCopyConflictsSchema,
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
          OR: [
            { personId: input.personId },
            {
              group: {
                members: {
                  some: { personId: input.personId }
                }
              }
            }
          ]
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
        // Conditionally include tasks for goal form, otherwise just count
        ...(input.includeTasks
          ? {
              tasks: {
                where: { status: EntityStatus.ACTIVE },
                orderBy: { order: 'asc' },
              },
            }
          : {}),
        // Always include task count
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
      if (rc.personId) {
        routineCountMap.set(rc.personId, rc._count);
      }
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

    // Check if this is a protected routine
    const existingRoutine = await ctx.prisma.routine.findUnique({
      where: { id },
      select: { isProtected: true, name: true },
    });

    if (existingRoutine?.isProtected) {
      // Protected routines can only have color and description changed
      const allowedFields = ['color', 'description'];
      const attemptedFields = Object.keys(data);
      const disallowedFields = attemptedFields.filter(field => !allowedFields.includes(field));

      if (disallowedFields.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot modify protected routine "${existingRoutine.name}". Only color and description can be changed.`,
        });
      }
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

    // Check if this is a protected routine
    const existingRoutine = await ctx.prisma.routine.findUnique({
      where: { id: input.id },
      select: { isProtected: true, name: true },
    });

    if (existingRoutine?.isProtected) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot delete protected routine "${existingRoutine.name}". This routine is required for all persons.`,
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

  // Check for naming conflicts before copying
  checkCopyConflicts: authorizedProcedure.input(checkCopyConflictsSchema).query(async ({ ctx, input }) => {
    await verifyRoutineOwnership(ctx.user.id, input.routineId, ctx.prisma);

    const source = await ctx.prisma.routine.findUnique({
      where: { id: input.routineId },
      select: { name: true, roleId: true },
    });

    if (!source) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
    }

    // Find existing routines with the same name for each target person
    const existingRoutines = await ctx.prisma.routine.findMany({
      where: {
        roleId: source.roleId,
        name: source.name,
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
          include: {
            person: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Build conflict list: personId -> { personName, existingRoutineId }
    const conflicts: { personId: string; personName: string; existingRoutineId: string }[] = [];

    existingRoutines.forEach((routine) => {
      routine.assignments.forEach((assignment: any) => {
        if (assignment.person) {
          conflicts.push({
            personId: assignment.person.id,
            personName: assignment.person.name,
            existingRoutineId: routine.id,
          });
        }
      });
    });

    return {
      routineName: source.name,
      conflicts,
      hasConflicts: conflicts.length > 0,
    };
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
      if (rc.personId) {
        routineCountMap.set(rc.personId, rc._count);
      }
    });

    // Find existing routines with the same name for conflict detection
    const existingRoutinesWithSameName = await ctx.prisma.routine.findMany({
      where: {
        roleId: source.roleId,
        name: source.name,
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

    // Map personId to existing routine with same name
    const existingRoutineMap = new Map<string, any>();
    existingRoutinesWithSameName.forEach((routine) => {
      routine.assignments.forEach((assignment: any) => {
        existingRoutineMap.set(assignment.personId, routine);
      });
    });

    // Check tier limits for each target person before copying
    for (const personId of input.targetPersonIds) {
      const resolution = input.conflictResolutions?.[personId];
      const hasConflict = existingRoutineMap.has(personId);

      // If merging (either Daily Routine or explicit merge resolution), won't create a new routine
      if (hasConflict && (isDailyRoutine || resolution === 'merge')) {
        continue; // Skip limit check if merging into existing routine
      }

      // Check routine limit for this person using the pre-fetched count
      const personRoutineCount = routineCountMap.get(personId) || 0;
      checkTierLimit(effectiveLimits, 'routines_per_person', personRoutineCount);
    }

    // Validate renamed names don't conflict with existing routines
    const personsNeedingRename = input.targetPersonIds.filter(personId => {
      const resolution = input.conflictResolutions?.[personId];
      return resolution === 'rename';
    });

    if (personsNeedingRename.length > 0) {
      // Collect all unique renamed names to validate
      const namesToValidate = new Map<string, string[]>(); // name -> personIds needing that name
      const fallbackName = `${source.name} (Copy)`;

      for (const personId of personsNeedingRename) {
        const renamedName = input.renamedNames?.[personId] || fallbackName;
        const existing = namesToValidate.get(renamedName) || [];
        existing.push(personId);
        namesToValidate.set(renamedName, existing);
      }

      // Check each unique name for conflicts
      for (const [nameToCheck, personIdsForName] of namesToValidate) {
        const existingWithName = await ctx.prisma.routine.findFirst({
          where: {
            roleId: source.roleId,
            name: nameToCheck,
            status: EntityStatus.ACTIVE,
            assignments: {
              some: {
                personId: { in: personIdsForName },
              },
            },
          },
          include: {
            assignments: {
              where: {
                personId: { in: personIdsForName },
              },
              include: {
                person: {
                  select: { name: true },
                },
              },
            },
          },
        });

        if (existingWithName) {
          const personName = existingWithName.assignments[0]?.person?.name || 'a target person';
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `A routine named "${nameToCheck}" already exists for ${personName}. Please choose a different name.`,
          });
        }
      }
    }

    // Fetch last task order for existing routines that need merging
    const routineIdsToMerge = Array.from(existingRoutineMap.values())
      .filter((routine) => {
        const personId = routine.assignments[0]?.personId;
        const resolution = input.conflictResolutions?.[personId];
        return isDailyRoutine || resolution === 'merge';
      })
      .map((r) => r.id);

    let lastTaskOrderMap = new Map<string, number>();
    if (routineIdsToMerge.length > 0) {
      const lastTasks = await ctx.prisma.task.findMany({
        where: {
          routineId: { in: routineIdsToMerge },
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
        const existingRoutine = existingRoutineMap.get(personId);
        const resolution = input.conflictResolutions?.[personId];

        // Determine if we should merge
        const shouldMerge = existingRoutine && (isDailyRoutine || resolution === 'merge');

        if (shouldMerge) {
          // Merge: Add tasks to existing routine
          const lastTaskOrder = lastTaskOrderMap.get(existingRoutine.id) || 0;

          await Promise.all(
            source.tasks.map((task: any, index: number) =>
              ctx.prisma.task.create({
                data: {
                  routineId: existingRoutine.id,
                  name: task.name,
                  description: task.description,
                  type: task.type,
                  order: lastTaskOrder + index + 1,
                  unit: task.unit,
                },
              })
            )
          );

          return { merged: true, routine: existingRoutine, taskCount: source.tasks.length, personId };
        }

        // Determine the name for the new routine
        let routineName = source.name;
        if (existingRoutine && resolution === 'rename') {
          // Use the person-specific renamed name or fallback
          routineName = input.renamedNames?.[personId] || `${source.name} (Copy)`;
        }

        // Create new routine
        const routine = await ctx.prisma.routine.create({
          data: {
            roleId: source.roleId,
            name: routineName,
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

        return { merged: false, routine, taskCount: source.tasks.length, personId, renamed: !!existingRoutine && resolution === 'rename' };
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
