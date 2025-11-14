import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { ConditionType, ConditionOperator, RoutineType } from '@/lib/types/prisma-enums';
import { TRPCError } from '@trpc/server';
import {
  detectCircularDependency,
  getCyclePathString
} from '@/lib/services/circular-dependency';
import { evaluateRoutineConditions } from '@/lib/services/condition-eval';

export const conditionRouter = router({
  /**
   * List all conditions for a routine
   */
  list: protectedProcedure
    .input(z.object({
      routineId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      const routine = await ctx.prisma.routine.findUnique({
        where: { id: input.routineId },
        include: { role: true }
      });

      if (!routine) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
      }

      if (routine.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const conditions = await ctx.prisma.condition.findMany({
        where: { routineId: input.routineId },
        include: {
          targetTask: {
            include: { routine: true }
          },
          targetRoutine: true
        },
        orderBy: { createdAt: 'asc' }
      });

      return conditions;
    }),

  /**
   * Create a new condition
   */
  create: protectedProcedure
    .input(z.object({
      routineId: z.string().cuid(),
      type: z.nativeEnum(ConditionType),
      operator: z.nativeEnum(ConditionOperator),
      value: z.string().optional(),
      targetTaskId: z.string().cuid().optional(),
      targetRoutineId: z.string().cuid().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const routine = await ctx.prisma.routine.findUnique({
        where: { id: input.routineId },
        include: { role: true }
      });

      if (!routine) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
      }

      if (routine.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Verify routine is SMART type
      if (routine.type !== RoutineType.SMART) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Conditions can only be added to SMART routines'
        });
      }

      // Check for circular dependencies if targeting a routine
      if (input.targetRoutineId) {
        const depCheck = await detectCircularDependency(
          input.routineId,
          [input.targetRoutineId]
        );

        if (depCheck.hasCycle) {
          const pathStr = await getCyclePathString(depCheck.cyclePath || []);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Circular dependency detected: ${pathStr}`
          });
        }
      }

      // Check for circular dependencies if targeting a task
      if (input.targetTaskId) {
        const task = await ctx.prisma.task.findUnique({
          where: { id: input.targetTaskId }
        });

        if (task) {
          const depCheck = await detectCircularDependency(
            input.routineId,
            [task.routineId]
          );

          if (depCheck.hasCycle) {
            const pathStr = await getCyclePathString(depCheck.cyclePath || []);
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Circular dependency detected: ${pathStr}`
            });
          }
        }
      }

      const condition = await ctx.prisma.condition.create({
        data: {
          routineId: input.routineId,
          type: input.type,
          operator: input.operator,
          value: input.value,
          targetTaskId: input.targetTaskId,
          targetRoutineId: input.targetRoutineId
        }
      });

      return condition;
    }),

  /**
   * Update a condition
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      type: z.nativeEnum(ConditionType).optional(),
      operator: z.nativeEnum(ConditionOperator).optional(),
      value: z.string().optional(),
      targetTaskId: z.string().cuid().optional(),
      targetRoutineId: z.string().cuid().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const condition = await ctx.prisma.condition.findUnique({
        where: { id: input.id },
        include: {
          routine: { include: { role: true } }
        }
      });

      if (!condition) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Condition not found' });
      }

      if (condition.routine.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Check for circular dependencies if changing target
      const newTargetRoutineId = input.targetRoutineId ?? condition.targetRoutineId;
      const newTargetTaskId = input.targetTaskId ?? condition.targetTaskId;

      const targetRoutineIds: string[] = [];

      if (newTargetRoutineId) {
        targetRoutineIds.push(newTargetRoutineId);
      }

      if (newTargetTaskId) {
        const task = await ctx.prisma.task.findUnique({
          where: { id: newTargetTaskId }
        });
        if (task) {
          targetRoutineIds.push(task.routineId);
        }
      }

      if (targetRoutineIds.length > 0) {
        const depCheck = await detectCircularDependency(
          condition.routineId,
          targetRoutineIds
        );

        if (depCheck.hasCycle) {
          const pathStr = await getCyclePathString(depCheck.cyclePath || []);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Circular dependency detected: ${pathStr}`
          });
        }
      }

      const { id, ...updateData } = input;

      const updated = await ctx.prisma.condition.update({
        where: { id },
        data: updateData
      });

      return updated;
    }),

  /**
   * Delete a condition
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const condition = await ctx.prisma.condition.findUnique({
        where: { id: input.id },
        include: {
          routine: { include: { role: true } }
        }
      });

      if (!condition) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Condition not found' });
      }

      if (condition.routine.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.prisma.condition.delete({
        where: { id: input.id }
      });

      return { success: true };
    }),

  /**
   * Evaluate conditions for a routine (check if it should be visible)
   */
  evaluate: protectedProcedure
    .input(z.object({
      routineId: z.string().cuid(),
      personId: z.string().cuid().optional()
    }))
    .query(async ({ ctx, input }) => {
      const routine = await ctx.prisma.routine.findUnique({
        where: { id: input.routineId },
        include: { role: true }
      });

      if (!routine) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
      }

      if (routine.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const isVisible = await evaluateRoutineConditions(
        input.routineId,
        input.personId
      );

      return { isVisible };
    }),

  /**
   * Upgrade routine to SMART type
   */
  upgradeRoutineToSmart: protectedProcedure
    .input(z.object({
      routineId: z.string().cuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const routine = await ctx.prisma.routine.findUnique({
        where: { id: input.routineId },
        include: { role: true }
      });

      if (!routine) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Routine not found' });
      }

      if (routine.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      if (routine.type === RoutineType.SMART) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Routine is already a SMART routine'
        });
      }

      // Check if user tier allows smart routines
      const role = await ctx.prisma.role.findUnique({
        where: { id: routine.roleId }
      });

      if (role && (role.tier === 'FREE' || role.tier === 'BRONZE')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Smart routines require PREMIUM tier or higher'
        });
      }

      // Upgrade routine to SMART
      const updated = await ctx.prisma.routine.update({
        where: { id: input.routineId },
        data: { type: RoutineType.SMART }
      });

      return updated;
    })
});
