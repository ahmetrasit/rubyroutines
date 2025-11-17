import { z } from 'zod';
import { router, adminProcedure } from '../init';
import {
  getModerationLogs,
  getEntityAuditHistory,
  getUserModerationHistory,
  getModerationStatistics,
  exportModerationLogs,
  ModerationAction,
  EntityType,
} from '@/lib/services/audit-log.service';

export const adminModerationRouter = router({
  // Get moderation logs with filters
  getLogs: adminProcedure
    .input(
      z.object({
        adminUserId: z.string().optional(),
        entityType: z.nativeEnum(EntityType).optional(),
        entityId: z.string().optional(),
        action: z.nativeEnum(ModerationAction).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return await getModerationLogs(input);
    }),

  // Get audit history for a specific entity
  getEntityHistory: adminProcedure
    .input(
      z.object({
        entityType: z.nativeEnum(EntityType),
        entityId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getEntityAuditHistory(input.entityType, input.entityId);
    }),

  // Get moderation history for a specific admin
  getUserHistory: adminProcedure
    .input(
      z.object({
        adminUserId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return await getUserModerationHistory(
        input.adminUserId,
        input.limit,
        input.offset
      );
    }),

  // Get moderation statistics
  getStatistics: adminProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return await getModerationStatistics(input.startDate, input.endDate);
    }),

  // Export logs to CSV
  exportLogs: adminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        adminUserId: z.string().optional(),
        entityType: z.nativeEnum(EntityType).optional(),
        action: z.nativeEnum(ModerationAction).optional(),
      })
    )
    .query(async ({ input }) => {
      const csv = await exportModerationLogs(input);
      return { csv };
    }),
});