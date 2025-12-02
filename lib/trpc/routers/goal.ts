import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { ResetPeriod, EntityStatus, GoalType } from '@/lib/types/prisma-enums';
import { calculateGoalProgress, calculateGoalProgressBatch } from '@/lib/services/goal-progress';
import { calculateGoalProgressEnhanced, calculateGoalProgressBatchEnhanced } from '@/lib/services/goal-progress-enhanced';
import { checkTierLimit, mapDatabaseLimitsToComponentFormat } from '@/lib/services/tier-limits';
import { TRPCError } from '@trpc/server';
import { getEffectiveTierLimits } from '@/lib/services/admin/system-settings.service';
import {
  createGoalSchema,
  updateGoalSchema,
  listGoalsSchema,
  getGoalSchema,
  archiveGoalSchema,
  getGoalProgressSchema,
  linkTaskToGoalSchema,
  linkRoutineToGoalSchema,
  unlinkTaskFromGoalSchema,
  unlinkRoutineFromGoalSchema,
} from '@/lib/validation/goal';

export const goalRouter = router({
  /**
   * List all active goals for a role
   */
  list: protectedProcedure
    .input(listGoalsSchema)
    .query(async ({ ctx, input }) => {
      // Verify user owns this role
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId }
      });

      if (!role || role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const where: any = {
        roleId: input.roleId,
        status: input.includeInactive ? undefined : EntityStatus.ACTIVE
      };

      // Add filters if provided
      if (input.personId) {
        where.personIds = { has: input.personId };
      }
      if (input.groupId) {
        where.groupIds = { has: input.groupId };
      }
      if (input.type) {
        where.type = input.type;
      }

      const goals = await ctx.prisma.goal.findMany({
        where,
        include: {
          taskLinks: {
            include: {
              task: {
                include: {
                  routine: true
                }
              }
            }
          },
          routineLinks: {
            include: {
              routine: true
            }
          },
          progress: true // Include progress records
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate progress for all goals in one batch (avoids N+1 query problem)
      // Use enhanced calculation for simple goals
      const goalIds = goals.map((g) => g.id);
      const progressMap = await calculateGoalProgressBatchEnhanced(goalIds);

      const goalsWithProgress = goals.map((goal) => ({
        ...goal,
        progress: progressMap.get(goal.id) || { current: 0, target: goal.target, percentage: 0, achieved: false },
      }));

      return goalsWithProgress;
    }),

  /**
   * Get single goal by ID with progress
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.id },
        include: {
          role: true,
          taskLinks: {
            include: {
              task: {
                include: {
                  routine: true
                }
              }
            }
          },
          routineLinks: {
            include: {
              routine: true
            }
          }
        }
      });

      if (!goal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }

      // Verify user owns this goal's role
      if (goal.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const progress = await calculateGoalProgressEnhanced(goal.id);

      return {
        ...goal,
        progress
      };
    }),

  /**
   * Create a new goal
   */
  create: protectedProcedure
    .input(createGoalSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this role
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        include: {
          goals: { where: { status: 'ACTIVE' } }
        }
      });

      if (!role || role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Get effective tier limits from database
      const dbLimits = await getEffectiveTierLimits(role.id);
      const effectiveLimits = mapDatabaseLimitsToComponentFormat(dbLimits as any, role.type);

      // Check tier limit for goals (only counting ACTIVE goals)
      checkTierLimit(effectiveLimits, 'goals', role.goals.length);

      const goal = await ctx.prisma.goal.create({
        data: {
          roleId: input.roleId,
          name: input.name,
          description: input.description,
          icon: input.icon,
          color: input.color,
          type: input.type || GoalType.COMPLETION_COUNT,
          target: input.target,
          unit: input.unit,
          period: input.period,
          resetDay: input.resetDay,
          personIds: input.personIds,
          groupIds: input.groupIds,
          simpleCondition: input.simpleCondition,
          comparisonOperator: input.comparisonOperator,
          comparisonValue: input.comparisonValue
        }
      });

      // Handle task links if provided
      if (input.taskIds && input.taskIds.length > 0) {
        await ctx.prisma.goalTaskLink.createMany({
          data: input.taskIds.map((taskId) => ({
            goalId: goal.id,
            taskId,
            weight: 1.0
          }))
        });
      }

      return goal;
    }),

  /**
   * Update existing goal
   */
  update: protectedProcedure
    .input(updateGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.id },
        include: { role: true }
      });

      if (!goal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }

      if (goal.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const { id, taskIds, ...updateData } = input;

      const updated = await ctx.prisma.goal.update({
        where: { id },
        data: updateData
      });

      // Handle task links if provided
      if (taskIds !== undefined) {
        // Delete existing task links
        await ctx.prisma.goalTaskLink.deleteMany({
          where: { goalId: id }
        });

        // Create new task links
        if (taskIds.length > 0) {
          await ctx.prisma.goalTaskLink.createMany({
            data: taskIds.map((taskId) => ({
              goalId: id,
              taskId,
              weight: 1.0
            }))
          });
        }
      }

      return updated;
    }),

  /**
   * Get goal progress for a specific person and time range
   */
  getProgress: protectedProcedure
    .input(getGoalProgressSchema)
    .query(async ({ ctx, input }) => {
      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.goalId },
        include: { role: true }
      });

      if (!goal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }

      if (goal.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Get current period boundaries if no date range specified
      let startDate: Date, endDate: Date;
      if (input.dateRange) {
        startDate = input.dateRange.start;
        endDate = input.dateRange.end;
      } else {
        const now = new Date();
        if (goal.period === ResetPeriod.DAILY) {
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
        } else if (goal.period === ResetPeriod.WEEKLY) {
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          startDate = new Date(now);
          startDate.setDate(now.getDate() + daysToMonday);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
      }

      // Get or create progress record for the person
      const progress = await ctx.prisma.goalProgress.findFirst({
        where: {
          goalId: input.goalId,
          personId: input.personId,
          periodStart: {
            gte: startDate
          },
          periodEnd: {
            lte: endDate
          }
        }
      });

      if (!progress) {
        // Create new progress record
        return await ctx.prisma.goalProgress.create({
          data: {
            goalId: input.goalId,
            personId: input.personId || '',
            currentValue: 0,
            achieved: false,
            periodStart: startDate,
            periodEnd: endDate
          }
        });
      }

      return progress;
    }),

  /**
   * Archive goal (soft delete)
   */
  archive: protectedProcedure
    .input(archiveGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.id },
        include: { role: true }
      });

      if (!goal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }

      if (goal.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.prisma.goal.update({
        where: { id: input.id },
        data: {
          status: EntityStatus.ARCHIVED,
          archivedAt: new Date()
        }
      });

      return { success: true };
    }),

  /**
   * Link tasks to goal
   */
  linkTasks: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      taskIds: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.goalId },
        include: {
          role: true,
          taskLinks: true,
          routineLinks: true
        }
      });

      if (!goal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }

      if (goal.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Get effective tier limits from database
      const dbLimits = await getEffectiveTierLimits(goal.role.id);
      const effectiveLimits = mapDatabaseLimitsToComponentFormat(dbLimits as any, goal.role.type);

      // Check tier limit for items per goal
      const totalItems = goal.taskLinks.length + goal.routineLinks.length + input.taskIds.length;
      checkTierLimit(effectiveLimits, 'items_per_goal', totalItems);

      // Create links
      await ctx.prisma.goalTaskLink.createMany({
        data: input.taskIds.map(taskId => ({
          goalId: input.goalId,
          taskId
        })),
        skipDuplicates: true
      });

      return { success: true };
    }),

  /**
   * Link routines to goal
   */
  linkRoutines: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      routineIds: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.goalId },
        include: {
          role: true,
          taskLinks: true,
          routineLinks: true
        }
      });

      if (!goal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }

      if (goal.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Get effective tier limits from database
      const dbLimits = await getEffectiveTierLimits(goal.role.id);
      const effectiveLimits = mapDatabaseLimitsToComponentFormat(dbLimits as any, goal.role.type);

      // Check tier limit for items per goal
      const totalItems = goal.taskLinks.length + goal.routineLinks.length + input.routineIds.length;
      checkTierLimit(effectiveLimits, 'items_per_goal', totalItems);

      // Create links
      await ctx.prisma.goalRoutineLink.createMany({
        data: input.routineIds.map(routineId => ({
          goalId: input.goalId,
          routineId
        })),
        skipDuplicates: true
      });

      return { success: true };
    }),

  /**
   * Unlink task from goal
   */
  unlinkTask: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      taskId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.goalId },
        include: {
          role: true,
          taskLinks: true,
          routineLinks: true
        }
      });

      if (!goal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }

      if (goal.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Check if this is the only item in goal
      const totalItems = goal.taskLinks.length + goal.routineLinks.length;
      if (totalItems === 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove last item from goal. Archive goal instead.'
        });
      }

      await ctx.prisma.goalTaskLink.deleteMany({
        where: {
          goalId: input.goalId,
          taskId: input.taskId
        }
      });

      return { success: true };
    }),

  /**
   * Unlink routine from goal
   */
  unlinkRoutine: protectedProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      routineId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.prisma.goal.findUnique({
        where: { id: input.goalId },
        include: {
          role: true,
          taskLinks: true,
          routineLinks: true
        }
      });

      if (!goal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
      }

      if (goal.role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Check if this is the only item in goal
      const totalItems = goal.taskLinks.length + goal.routineLinks.length;
      if (totalItems === 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove last item from goal. Archive goal instead.'
        });
      }

      await ctx.prisma.goalRoutineLink.deleteMany({
        where: {
          goalId: input.goalId,
          routineId: input.routineId
        }
      });

      return { success: true };
    }),

  /**
   * Get goals for a specific task
   */
  getGoalsForTask: protectedProcedure
    .input(z.object({
      taskId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const goalLinks = await ctx.prisma.goalTaskLink.findMany({
        where: { taskId: input.taskId },
        include: {
          goal: {
            include: {
              role: true,
              // Include minimal data - progress calculation will fetch what it needs
              taskLinks: {
                include: {
                  task: {
                    include: {
                      routine: true,
                      // Only include count for efficiency
                      _count: {
                        select: { completions: true }
                      }
                    }
                  }
                }
              },
              routineLinks: {
                include: {
                  routine: {
                    include: {
                      tasks: {
                        where: { status: 'ACTIVE' },
                        include: {
                          // Only include count for efficiency
                          _count: {
                            select: { completions: true }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Filter out null goals, check for ACTIVE status, and verify user access
      const goals = goalLinks
        .filter((link: any) =>
          link.goal &&
          link.goal.status === 'ACTIVE' &&
          link.goal.role.userId === ctx.user.id
        )
        .map((link: any) => link.goal);

      // Calculate progress for all goals in one batch (avoids N+1 query problem)
      // Use enhanced calculation for simple goals
      const goalIds = goals.map((g: any) => g.id);
      const progressMap = await calculateGoalProgressBatchEnhanced(goalIds);

      const goalsWithProgress = goals.map((goal: any) => ({
        ...goal,
        progress: progressMap.get(goal.id) || { current: 0, target: goal.target, percentage: 0, achieved: false },
      }));

      return goalsWithProgress;
    }),

  /**
   * Get goals for a specific routine
   */
  getGoalsForRoutine: protectedProcedure
    .input(z.object({
      routineId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const goalLinks = await ctx.prisma.goalRoutineLink.findMany({
        where: { routineId: input.routineId },
        include: {
          goal: {
            include: {
              role: true,
              // Include minimal data - progress calculation will fetch what it needs
              taskLinks: {
                include: {
                  task: {
                    include: {
                      routine: true,
                      // Only include count for efficiency
                      _count: {
                        select: { completions: true }
                      }
                    }
                  }
                }
              },
              routineLinks: {
                include: {
                  routine: {
                    include: {
                      tasks: {
                        where: { status: 'ACTIVE' },
                        include: {
                          // Only include count for efficiency
                          _count: {
                            select: { completions: true }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Filter out null goals, check for ACTIVE status, and verify user access
      const goals = goalLinks
        .filter((link: any) =>
          link.goal &&
          link.goal.status === 'ACTIVE' &&
          link.goal.role.userId === ctx.user.id
        )
        .map((link: any) => link.goal);

      // Calculate progress for all goals in one batch (avoids N+1 query problem)
      // Use enhanced calculation for simple goals
      const goalIds = goals.map((g: any) => g.id);
      const progressMap = await calculateGoalProgressBatchEnhanced(goalIds);

      const goalsWithProgress = goals.map((goal: any) => ({
        ...goal,
        progress: progressMap.get(goal.id) || { current: 0, target: goal.target, percentage: 0, achieved: false },
      }));

      return goalsWithProgress;
    }),

  /**
   * Batch create goals (for teacher assignment to multiple students)
   */
  batchCreate: protectedProcedure
    .input(z.object({
      roleId: z.string().uuid(),
      goals: z.array(createGoalSchema.omit({ roleId: true }))
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this role
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId },
        include: {
          goals: { where: { status: 'ACTIVE' } }
        }
      });

      if (!role || role.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create goals for this role'
        });
      }

      // Check tier limits
      const tierLimits = await getEffectiveTierLimits(ctx.user.id);
      const limits = mapDatabaseLimitsToComponentFormat(tierLimits, role.type);

      if (limits && role.goals.length + input.goals.length > limits.goals) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Goal limit (${limits.goals}) would be exceeded`
        });
      }

      // Create all goals in a transaction
      const createdGoals = await ctx.prisma.$transaction(
        input.goals.map(goalData =>
          ctx.prisma.goal.create({
            data: {
              roleId: input.roleId,
              ...goalData,
              status: EntityStatus.ACTIVE,
              currentStreak: 0,
              longestStreak: 0
            }
          })
        )
      );

      return createdGoals;
    })
});
