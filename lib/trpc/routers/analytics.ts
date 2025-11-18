import { router, authorizedProcedure } from '../init';
import { z } from 'zod';
import {
  getCompletionTrend,
  getGoalProgress,
  getTaskHeatmap,
  exportAnalyticsCSV,
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
        personId: z.string().cuid().nullable().optional(),
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
        personId: z.string().cuid().nullable().optional(),
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
        personId: z.string().cuid().nullable().optional(),
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
        personId: z.string().cuid().nullable().optional(),
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
});
