import { router, authorizedProcedure } from '../init';
import { z } from 'zod';
import {
  getCompletionTrend,
  getGoalProgress,
  getTaskHeatmap,
  exportAnalyticsCSV,
  getGoalAchievementRate,
  getGoalTypeDistribution,
  getStreakLeaderboard,
  getGoalTrends,
} from '@/lib/services/analytics.service';
import { subDays } from 'date-fns';

export const analyticsRouter = router({
  /**
   * Get completion trend for a date range
   */
  completionTrend: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
        personId: z.string().nullable().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const endDate = input.endDate || new Date();
      const startDate = input.startDate || subDays(endDate, input.days);

      const data = await getCompletionTrend(
        input.roleId,
        input.personId || null,
        startDate,
        endDate
      );

      return data;
    }),

  /**
   * Get goal progress for all active goals
   */
  goalProgress: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
        personId: z.string().nullable().optional(),
      })
    )
    .query(async ({ input }) => {
      const data = await getGoalProgress(input.roleId, input.personId || null);

      return data;
    }),

  /**
   * Get task heatmap (completion frequency by task)
   */
  taskHeatmap: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
        personId: z.string().nullable().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const endDate = input.endDate || new Date();
      const startDate = input.startDate || subDays(endDate, input.days);

      const data = await getTaskHeatmap(
        input.roleId,
        input.personId || null,
        startDate,
        endDate
      );

      return data;
    }),

  /**
   * Export analytics data as CSV
   */
  exportCSV: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(), // Role IDs are UUIDs, not CUIDs
        personId: z.string().nullable().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const endDate = input.endDate || new Date();
      const startDate = input.startDate || subDays(endDate, input.days);

      const csv = await exportAnalyticsCSV(
        input.roleId,
        input.personId || null,
        startDate,
        endDate
      );

      return { csv };
    }),

  /**
   * Get goal achievement rate and statistics
   */
  goalAchievementRate: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        personId: z.string().nullable().optional(),
        groupId: z.string().nullable().optional(),
        period: z.enum(['WEEK', 'MONTH', 'QUARTER', 'YEAR']).default('MONTH'),
      })
    )
    .query(async ({ input }) => {
      const data = await getGoalAchievementRate(
        input.roleId,
        input.personId || null,
        input.groupId || null,
        input.period
      );
      return data;
    }),

  /**
   * Get goal type distribution
   */
  goalTypeDistribution: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        personId: z.string().nullable().optional(),
        groupId: z.string().nullable().optional(),
      })
    )
    .query(async ({ input }) => {
      const data = await getGoalTypeDistribution(
        input.roleId,
        input.personId || null,
        input.groupId || null
      );
      return data;
    }),

  /**
   * Get streak leaderboard
   */
  streakLeaderboard: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const data = await getStreakLeaderboard(input.roleId, input.limit);
      return data;
    }),

  /**
   * Get goal trends over time
   */
  goalTrends: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        personId: z.string().nullable().optional(),
        groupId: z.string().nullable().optional(),
        period: z.enum(['WEEK', 'MONTH', 'QUARTER', 'YEAR']).default('MONTH'),
      })
    )
    .query(async ({ input }) => {
      const data = await getGoalTrends(
        input.roleId,
        input.personId || null,
        input.groupId || null,
        input.period
      );
      return data;
    }),
});
