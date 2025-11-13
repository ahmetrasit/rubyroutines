import { z } from 'zod';
import { router } from '../init';
import { adminProcedure } from '../middleware/auth';
import {
  getAuditLogs,
  getEntityAuditHistory,
  getRecentAdminActivity,
  getAuditStatistics,
  AdminAction,
} from '@/lib/services/admin/audit.service';

export const adminAuditRouter = router({
  // Get audit logs with filters
  getLogs: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid().optional(),
        action: z.nativeEnum(AdminAction).optional(),
        entityType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return await getAuditLogs(input);
    }),

  // Get audit history for a specific entity
  getEntityHistory: adminProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getEntityAuditHistory(input.entityType, input.entityId);
    }),

  // Get recent admin activity
  getRecentActivity: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      return await getRecentAdminActivity(input.limit);
    }),

  // Get audit statistics
  getStatistics: adminProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return await getAuditStatistics(input.startDate, input.endDate);
    }),
});
