import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { prisma } from '@/lib/prisma';
import {
  createConditionSchema,
  updateConditionSchema,
  deleteConditionSchema,
  getConditionByIdSchema,
  listConditionsSchema,
  evaluateConditionSchema,
} from '@/lib/validation/condition';
import { evaluateCondition } from '@/lib/services/condition-evaluator.service';
import { TRPCError } from '@trpc/server';

export const conditionRouter = router({
  /**
   * Create a new condition with checks
   */
  create: protectedProcedure
    .input(createConditionSchema)
    .mutation(async ({ ctx, input }) => {
      const { routineId, controlsRoutine, logic, checks } = input;

      // Verify routine ownership
      const routine = await prisma.routine.findUnique({
        where: { id: routineId },
        include: { role: true },
      });

      if (!routine || routine.role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to add conditions to this routine',
        });
      }

      // Check for circular dependencies before creating
      for (const check of checks) {
        if (check.targetRoutineId) {
          const hasCycle = await detectCircularDependency(
            routineId,
            check.targetRoutineId
          );
          if (hasCycle) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Circular dependency detected. This condition would create an infinite loop.',
            });
          }
        }
      }

      // Create condition with checks in a transaction
      const condition = await prisma.condition.create({
        data: {
          routineId,
          controlsRoutine,
          logic,
          checks: {
            create: checks.map((check) => ({
              negate: check.negate,
              operator: check.operator,
              value: check.value,
              targetTaskId: check.targetTaskId,
              targetRoutineId: check.targetRoutineId,
              targetGoalId: check.targetGoalId,
            })),
          },
        },
        include: {
          checks: true,
        },
      });

      return condition;
    }),

  /**
   * Update an existing condition
   */
  update: protectedProcedure
    .input(updateConditionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, logic, checks } = input;

      // Verify condition ownership
      const existingCondition = await prisma.condition.findUnique({
        where: { id },
        include: {
          routine: {
            include: { role: true },
          },
          checks: true,
        },
      });

      if (!existingCondition || existingCondition.routine.role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this condition',
        });
      }

      // Check for circular dependencies if checks are being updated
      if (checks) {
        for (const check of checks) {
          if (check.targetRoutineId) {
            const hasCycle = await detectCircularDependency(
              existingCondition.routineId,
              check.targetRoutineId
            );
            if (hasCycle) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Circular dependency detected. This condition would create an infinite loop.',
              });
            }
          }
        }
      }

      // Update condition and replace checks
      const updated = await prisma.$transaction(async (tx) => {
        // Delete existing checks if new checks provided
        if (checks) {
          await tx.conditionCheck.deleteMany({
            where: { conditionId: id },
          });
        }

        // Update condition
        return await tx.condition.update({
          where: { id },
          data: {
            logic: logic || existingCondition.logic,
            checks: checks
              ? {
                  create: checks.map((check) => ({
                    negate: check.negate,
                    operator: check.operator,
                    value: check.value,
                    targetTaskId: check.targetTaskId,
                    targetRoutineId: check.targetRoutineId,
                    targetGoalId: check.targetGoalId,
                  })),
                }
              : undefined,
          },
          include: {
            checks: true,
          },
        });
      });

      return updated;
    }),

  /**
   * Delete a condition
   */
  delete: protectedProcedure
    .input(deleteConditionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Verify condition ownership
      const condition = await prisma.condition.findUnique({
        where: { id },
        include: {
          routine: {
            include: { role: true },
          },
        },
      });

      if (!condition || condition.routine.role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this condition',
        });
      }

      // Delete condition (checks will cascade)
      await prisma.condition.delete({
        where: { id },
      });

      return { success: true };
    }),

  /**
   * Get condition by ID
   */
  getById: protectedProcedure
    .input(getConditionByIdSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const condition = await prisma.condition.findUnique({
        where: { id },
        include: {
          checks: {
            include: {
              targetTask: {
                select: { id: true, name: true },
              },
              targetRoutine: {
                select: { id: true, name: true },
              },
              targetGoal: {
                select: { id: true, name: true },
              },
            },
          },
          routine: {
            include: { role: true },
          },
        },
      });

      if (!condition || condition.routine.role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this condition',
        });
      }

      return condition;
    }),

  /**
   * List conditions for a routine
   */
  list: protectedProcedure
    .input(listConditionsSchema)
    .query(async ({ ctx, input }) => {
      const { routineId, controlsRoutine } = input;

      // Verify routine ownership
      const routine = await prisma.routine.findUnique({
        where: { id: routineId },
        include: { role: true },
      });

      if (!routine || routine.role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view conditions for this routine',
        });
      }

      const conditions = await prisma.condition.findMany({
        where: {
          routineId,
          ...(controlsRoutine !== undefined ? { controlsRoutine } : {}),
        },
        include: {
          checks: {
            include: {
              targetTask: {
                select: { id: true, name: true },
              },
              targetRoutine: {
                select: { id: true, name: true },
              },
              targetGoal: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return conditions;
    }),

  /**
   * Evaluate a condition for a person
   */
  evaluate: protectedProcedure
    .input(evaluateConditionSchema)
    .query(async ({ ctx, input }) => {
      const { conditionId, personId } = input;

      // Verify condition ownership
      const condition = await prisma.condition.findUnique({
        where: { id: conditionId },
        include: {
          routine: {
            include: { role: true },
          },
        },
      });

      if (!condition || condition.routine.role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to evaluate this condition',
        });
      }

      // Verify person ownership
      const person = await prisma.person.findUnique({
        where: { id: personId },
        include: { role: true },
      });

      if (!person || person.role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to evaluate for this person',
        });
      }

      // Evaluate the condition
      const evaluation = await evaluateCondition(prisma, conditionId, personId);

      return evaluation;
    }),

  /**
   * Get available targets for condition (tasks, routines, goals in same role)
   */
  getAvailableTargets: protectedProcedure
    .input(z.object({ routineId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { routineId } = input;

      // Get routine with role
      const routine = await prisma.routine.findUnique({
        where: { id: routineId },
        include: { role: true },
      });

      if (!routine || routine.role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this routine',
        });
      }

      // Get all active tasks in the same routine (for same-routine conditions)
      const tasks = await prisma.task.findMany({
        where: {
          routineId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
        orderBy: {
          order: 'asc',
        },
      });

      // Get all active routines in the same role (for cross-routine conditions)
      const routines = await prisma.routine.findMany({
        where: {
          roleId: routine.roleId,
          status: 'ACTIVE',
          id: {
            not: routineId, // Exclude current routine
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Get all active goals in the same role
      const goals = await prisma.goal.findMany({
        where: {
          roleId: routine.roleId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          target: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        tasks,
        routines,
        goals,
      };
    }),
});

/**
 * Detect circular dependency between routines
 * Uses DFS to check if targetRoutineId eventually depends on sourceRoutineId
 */
async function detectCircularDependency(
  sourceRoutineId: string,
  targetRoutineId: string
): Promise<boolean> {
  const visited = new Set<string>();
  const stack = [targetRoutineId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;

    if (currentId === sourceRoutineId) {
      return true; // Cycle detected
    }

    if (visited.has(currentId)) {
      continue;
    }

    visited.add(currentId);

    // Get all conditions that control this routine
    const conditions = await prisma.condition.findMany({
      where: {
        routineId: currentId,
        controlsRoutine: true,
      },
      include: {
        checks: {
          select: {
            targetRoutineId: true,
          },
        },
      },
    });

    // Add all target routines to stack
    for (const condition of conditions) {
      for (const check of condition.checks) {
        if (check.targetRoutineId && !visited.has(check.targetRoutineId)) {
          stack.push(check.targetRoutineId);
        }
      }
    }
  }

  return false; // No cycle detected
}
