import { router, protectedProcedure } from '../init';
import { TRPCError } from '@trpc/server';
import { EntityStatus, TaskType } from '@/lib/types/prisma-enums';
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  restoreTaskSchema,
  reorderTasksSchema,
  listTasksSchema,
  getTaskByIdSchema,
  completeTaskSchema,
  undoCompletionSchema,
  getTaskCompletionsSchema,
} from '@/lib/validation/task';
import { checkTierLimit } from '@/lib/services/tier-limits';
import { canUndoCompletion, getTaskAggregation } from '@/lib/services/task-completion';
import { calculateNextReset } from '@/lib/services/reset-period';

export const taskRouter = router({
  // List tasks for a routine
  list: protectedProcedure
    .input(listTasksSchema)
    .query(async ({ ctx, input }) => {
      const whereClause = {
        routineId: input.routineId,
        ...(input.includeInactive ? {} : { status: EntityStatus.ACTIVE }),
      };

      const tasks = await ctx.prisma.task.findMany({
        where: whereClause,
        orderBy: { order: 'asc' },
        include: {
          completions: {
            orderBy: { completedAt: 'desc' },
            take: 50, // Limit to recent completions
          },
          routine: {
            select: {
              resetPeriod: true,
              resetDay: true,
            },
          },
        },
      });

      // Add aggregation data for each task
      return tasks.map((task) => {
        const resetDate = calculateNextReset(
          task.routine.resetPeriod,
          task.routine.resetDay
        );

        const aggregation = getTaskAggregation(task, task.completions, resetDate);

        return {
          ...task,
          ...aggregation,
        };
      });
    }),

  // Get task by ID with completions
  getById: protectedProcedure
    .input(getTaskByIdSchema)
    .query(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.id },
        include: {
          routine: {
            select: {
              id: true,
              name: true,
              resetPeriod: true,
              resetDay: true,
            },
          },
          completions: {
            include: {
              person: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            orderBy: { completedAt: 'desc' },
          },
        },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      return task;
    }),

  // Create new task
  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      // Get routine with role to check tier limits
      const routine = await ctx.prisma.routine.findUnique({
        where: { id: input.routineId },
        include: {
          role: true,
          tasks: { where: { status: EntityStatus.ACTIVE } },
        },
      });

      if (!routine) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Routine not found',
        });
      }

      // Check tier limit
      checkTierLimit(routine.role.tier, 'tasks_per_routine', routine.tasks.length);

      // If order not specified, put at end
      const order = input.order || routine.tasks.length;

      const task = await ctx.prisma.task.create({
        data: {
          ...input,
          order,
        },
      });

      return task;
    }),

  // Update task
  update: protectedProcedure
    .input(updateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const task = await ctx.prisma.task.findUnique({
        where: { id },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Validate type-specific requirements
      if (updateData.type === TaskType.PROGRESS) {
        const targetValue = updateData.targetValue ?? task.targetValue;
        const unit = updateData.unit ?? task.unit;

        if (!targetValue || !unit) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Progress tasks must have targetValue and unit',
          });
        }
      }

      const updatedTask = await ctx.prisma.task.update({
        where: { id },
        data: updateData,
      });

      return updatedTask;
    }),

  // Delete task (soft delete)
  delete: protectedProcedure
    .input(deleteTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.id },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      await ctx.prisma.task.update({
        where: { id: input.id },
        data: {
          status: EntityStatus.ARCHIVED,
          archivedAt: new Date(),
        },
      });

      return { success: true };
    }),

  // Restore archived task
  restore: protectedProcedure
    .input(restoreTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.id },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      await ctx.prisma.task.update({
        where: { id: input.id },
        data: {
          status: EntityStatus.ACTIVE,
          archivedAt: null,
        },
      });

      return { success: true };
    }),

  // Reorder tasks
  reorder: protectedProcedure
    .input(reorderTasksSchema)
    .mutation(async ({ ctx, input }) => {
      // Update order for each task
      await Promise.all(
        input.taskIds.map((taskId, index) =>
          ctx.prisma.task.update({
            where: { id: taskId },
            data: { order: index },
          })
        )
      );

      return { success: true };
    }),

  // Complete a task
  complete: protectedProcedure
    .input(completeTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.taskId },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Validate value for PROGRESS tasks
      if (task.type === TaskType.PROGRESS && !input.value) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Progress tasks require a value',
        });
      }

      const completion = await ctx.prisma.taskCompletion.create({
        data: {
          taskId: input.taskId,
          personId: input.personId,
          value: input.value,
          notes: input.notes,
        },
        include: {
          task: true,
          person: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return completion;
    }),

  // Undo task completion
  undoCompletion: protectedProcedure
    .input(undoCompletionSchema)
    .mutation(async ({ ctx, input }) => {
      const completion = await ctx.prisma.taskCompletion.findUnique({
        where: { id: input.completionId },
        include: {
          task: true,
        },
      });

      if (!completion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Completion not found',
        });
      }

      // Check if undo is allowed
      if (!canUndoCompletion(completion.completedAt, completion.task.type)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Undo window has expired',
        });
      }

      await ctx.prisma.taskCompletion.delete({
        where: { id: input.completionId },
      });

      return { success: true };
    }),

  // Get completions for a task
  getCompletions: protectedProcedure
    .input(getTaskCompletionsSchema)
    .query(async ({ ctx, input }) => {
      const whereClause: any = {
        taskId: input.taskId,
      };

      if (input.personId) {
        whereClause.personId = input.personId;
      }

      if (input.startDate || input.endDate) {
        whereClause.completedAt = {};
        if (input.startDate) {
          whereClause.completedAt.gte = input.startDate;
        }
        if (input.endDate) {
          whereClause.completedAt.lte = input.endDate;
        }
      }

      const completions = await ctx.prisma.taskCompletion.findMany({
        where: whereClause,
        include: {
          person: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      });

      return completions;
    }),
});
