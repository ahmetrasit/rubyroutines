import { router, authorizedProcedure, verifyRoutineOwnership, verifyTaskOwnership } from '../init';
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
import { checkTierLimit, mapDatabaseLimitsToComponentFormat } from '@/lib/services/tier-limits';
import {
  canUndoCompletion,
  getTaskAggregation,
  calculateEntryNumber,
  isWithinEntryLimit,
  calculateSummedValue,
  validateProgressValue
} from '@/lib/services/task-completion';
import { getResetPeriodStart } from '@/lib/services/reset-period';
import { getEffectiveTierLimits } from '@/lib/services/admin/system-settings.service';

export const taskRouter = router({
  // List tasks for a routine
  list: authorizedProcedure
    .input(listTasksSchema)
    .query(async ({ ctx, input }) => {
      // Verify routine ownership
      await verifyRoutineOwnership(ctx.user.id, input.routineId, ctx.prisma);
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
      return tasks.map((task: any) => {
        const resetDate = getResetPeriodStart(
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
  getById: authorizedProcedure
    .input(getTaskByIdSchema)
    .query(async ({ ctx, input }) => {
      // Verify task ownership
      await verifyTaskOwnership(ctx.user.id, input.id, ctx.prisma);
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
  create: authorizedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify routine ownership
      await verifyRoutineOwnership(ctx.user.id, input.routineId, ctx.prisma);
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

      // Get effective tier limits from database
      const dbLimits = await getEffectiveTierLimits(routine.role.id);
      const effectiveLimits = mapDatabaseLimitsToComponentFormat(dbLimits as any, routine.role.type);

      // Check tier limit for total tasks (only counting ACTIVE tasks)
      checkTierLimit(effectiveLimits, 'tasks_per_routine', routine.tasks.length);

      // Check tier limit for smart tasks if creating a smart task
      if (input.isSmart) {
        const smartTasksCount = routine.tasks.filter((t) => t.isSmart).length;
        checkTierLimit(effectiveLimits, 'smart_tasks_per_routine', smartTasksCount);
      }

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
  update: authorizedProcedure
    .input(updateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify task ownership
      await verifyTaskOwnership(ctx.user.id, id, ctx.prisma);

      const task = await ctx.prisma.task.findUnique({
        where: { id },
        include: {
          routine: {
            include: {
              role: true,
              tasks: { where: { status: EntityStatus.ACTIVE } },
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // If changing to smart task, check tier limit
      if (updateData.isSmart === true && !task.isSmart) {
        // Get effective tier limits from database
        const dbLimits = await getEffectiveTierLimits(task.routine.role.id);
        const effectiveLimits = mapDatabaseLimitsToComponentFormat(dbLimits as any, task.routine.role.type);

        const smartTasksCount = task.routine.tasks.filter((t) => t.isSmart).length;
        checkTierLimit(effectiveLimits, 'smart_tasks_per_routine', smartTasksCount);
      }

      // Validate type-specific requirements
      if (updateData.type === TaskType.PROGRESS) {
        const unit = updateData.unit ?? task.unit;

        if (!unit) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Progress tasks must have a unit (e.g., "pages", "minutes")',
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
  delete: authorizedProcedure
    .input(deleteTaskSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify task ownership
      await verifyTaskOwnership(ctx.user.id, input.id, ctx.prisma);
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
  restore: authorizedProcedure
    .input(restoreTaskSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify task ownership
      await verifyTaskOwnership(ctx.user.id, input.id, ctx.prisma);
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
  reorder: authorizedProcedure
    .input(reorderTasksSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership of first task (all tasks should be in same routine)
      const firstTaskId = input.taskIds[0];
      if (firstTaskId) {
        await verifyTaskOwnership(ctx.user.id, firstTaskId, ctx.prisma);
      }

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
  complete: authorizedProcedure
    .input(completeTaskSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify task ownership
      await verifyTaskOwnership(ctx.user.id, input.taskId, ctx.prisma);
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.taskId },
        include: {
          routine: {
            select: {
              resetPeriod: true,
              resetDay: true
            }
          },
          completions: {
            where: { personId: input.personId },
            orderBy: { completedAt: 'desc' }
          }
        }
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Validate value for PROGRESS tasks
      if (task.type === TaskType.PROGRESS) {
        if (!input.value) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Progress tasks require a value',
          });
        }

        const validation = validateProgressValue(input.value);
        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: validation.error || 'Invalid progress value'
          });
        }
      }

      // Calculate reset date for current period
      const resetDate = getResetPeriodStart(task.routine.resetPeriod, task.routine.resetDay);

      // Calculate entry number for this completion
      const entryNumber = calculateEntryNumber(task.completions, resetDate, task.type);

      // Check entry limits
      if (!isWithinEntryLimit(entryNumber, task.type)) {
        const maxEntries = task.type === TaskType.MULTIPLE_CHECKIN ? 9 : 99;
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Maximum ${maxEntries} check-ins reached for this period`
        });
      }

      // Calculate summed value for PROGRESS tasks
      let summedValue: number | undefined = undefined;
      if (task.type === TaskType.PROGRESS && input.value) {
        summedValue = calculateSummedValue(task.completions, resetDate, input.value);
      }

      const completion = await ctx.prisma.taskCompletion.create({
        data: {
          taskId: input.taskId,
          personId: input.personId,
          value: input.value,
          notes: input.notes,
          entryNumber,
          summedValue
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
  undoCompletion: authorizedProcedure
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

      // Verify task ownership
      await verifyTaskOwnership(ctx.user.id, completion.taskId, ctx.prisma);

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
  getCompletions: authorizedProcedure
    .input(getTaskCompletionsSchema)
    .query(async ({ ctx, input }) => {
      // Verify task ownership
      await verifyTaskOwnership(ctx.user.id, input.taskId, ctx.prisma);
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
