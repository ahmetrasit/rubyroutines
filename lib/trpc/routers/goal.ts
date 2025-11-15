import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { ResetPeriod, EntityStatus } from '@/lib/types/prisma-enums';
import { calculateGoalProgress } from '@/lib/services/goal-progress';
import { checkTierLimit, mapDatabaseLimitsToComponentFormat } from '@/lib/services/tier-limits';
import { TRPCError } from '@trpc/server';
import { getEffectiveTierLimits } from '@/lib/services/admin/system-settings.service';

export const goalRouter = router({
  /**
   * List all active goals for a role
   */
  list: protectedProcedure
    .input(z.object({
      roleId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      // Verify user owns this role
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.roleId }
      });

      if (!role || role.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const goals = await ctx.prisma.goal.findMany({
        where: {
          roleId: input.roleId,
          status: EntityStatus.ACTIVE
        },
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
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate progress for each goal
      const goalsWithProgress = await Promise.all(
        goals.map(async (goal: any) => {
          const progress = await calculateGoalProgress(goal.id);
          return {
            ...goal,
            progress
          };
        })
      );

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

      const progress = await calculateGoalProgress(goal.id);

      return {
        ...goal,
        progress
      };
    }),

  /**
   * Create a new goal
   */
  create: protectedProcedure
    .input(z.object({
      roleId: z.string().uuid(),
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      target: z.number().positive(),
      period: z.nativeEnum(ResetPeriod),
      resetDay: z.number().min(0).max(99).optional(),
      personIds: z.array(z.string().cuid()).default([]),
      groupIds: z.array(z.string().cuid()).default([])
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
          target: input.target,
          period: input.period,
          resetDay: input.resetDay,
          personIds: input.personIds,
          groupIds: input.groupIds
        }
      });

      return goal;
    }),

  /**
   * Update existing goal
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      target: z.number().positive().optional(),
      period: z.nativeEnum(ResetPeriod).optional(),
      resetDay: z.number().min(0).max(99).optional(),
      personIds: z.array(z.string().cuid()).optional(),
      groupIds: z.array(z.string().cuid()).optional()
    }))
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

      const { id, ...updateData } = input;

      const updated = await ctx.prisma.goal.update({
        where: { id },
        data: updateData
      });

      return updated;
    }),

  /**
   * Archive goal (soft delete)
   */
  archive: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
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
      taskIds: z.array(z.string().cuid())
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
      routineIds: z.array(z.string().cuid())
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
      taskId: z.string().cuid()
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
      routineId: z.string().cuid()
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
      taskId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      const goalLinks = await ctx.prisma.goalTaskLink.findMany({
        where: { taskId: input.taskId },
        include: {
          goal: {
            where: { status: 'ACTIVE' },
            include: {
              role: true
            }
          }
        }
      });

      // Filter out null goals and verify user access
      const goals = goalLinks
        .filter((link: any) => link.goal && link.goal.role.userId === ctx.user.id)
        .map((link: any) => link.goal);

      // Calculate progress for each goal
      const goalsWithProgress = await Promise.all(
        goals.map(async (goal: any) => {
          const progress = await calculateGoalProgress(goal.id);
          return {
            ...goal,
            progress
          };
        })
      );

      return goalsWithProgress;
    }),

  /**
   * Get goals for a specific routine
   */
  getGoalsForRoutine: protectedProcedure
    .input(z.object({
      routineId: z.string().cuid()
    }))
    .query(async ({ ctx, input }) => {
      const goalLinks = await ctx.prisma.goalRoutineLink.findMany({
        where: { routineId: input.routineId },
        include: {
          goal: {
            where: { status: 'ACTIVE' },
            include: {
              role: true
            }
          }
        }
      });

      // Filter out null goals and verify user access
      const goals = goalLinks
        .filter((link: any) => link.goal && link.goal.role.userId === ctx.user.id)
        .map((link: any) => link.goal);

      // Calculate progress for each goal
      const goalsWithProgress = await Promise.all(
        goals.map(async (goal: any) => {
          const progress = await calculateGoalProgress(goal.id);
          return {
            ...goal,
            progress
          };
        })
      );

      return goalsWithProgress;
    })
});
