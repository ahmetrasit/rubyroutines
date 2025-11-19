import { router, authorizedProcedure } from '../init';
import { z } from 'zod';
import {
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  createNotification,
  notifyGoalAchievement,
  notifyStreakMilestone,
  notifyGoalReminder,
  notifyConditionTriggered,
  notifyDailySummary,
} from '@/lib/services/notification.service';
import { NotificationType } from '@prisma/client';

export const notificationRouter = router({
  /**
   * List notifications for a role
   */
  list: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.unreadOnly) {
        return await getUnreadNotifications(ctx.user.id, input.roleId);
      }

      return await getNotifications(
        ctx.user.id,
        input.roleId,
        input.limit,
        input.offset
      );
    }),

  /**
   * Mark a notification as read
   */
  markAsRead: authorizedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await markNotificationAsRead(input.notificationId, ctx.user.id);
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await markAllNotificationsAsRead(ctx.user.id, input.roleId);
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getUnreadCount(ctx.user.id, input.roleId);
    }),

  /**
   * Create a custom notification (for testing or manual triggers)
   */
  create: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        type: z.nativeEnum(NotificationType),
        title: z.string().min(1).max(100),
        message: z.string().min(1).max(500),
        data: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createNotification(
        ctx.user.id,
        input.roleId,
        input.type,
        input.title,
        input.message,
        input.data
      );
    }),

  /**
   * Send test notifications (development only)
   */
  sendTestNotification: authorizedProcedure
    .input(
      z.object({
        roleId: z.string().uuid(),
        type: z.enum([
          'goal_achievement',
          'streak_milestone',
          'goal_reminder',
          'condition_triggered',
          'daily_summary',
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const roleId = input.roleId;

      switch (input.type) {
        case 'goal_achievement':
          return await notifyGoalAchievement(
            userId,
            roleId,
            'test-goal-id',
            'Test Goal',
            'test-person-id',
            'Test Person'
          );

        case 'streak_milestone':
          return await notifyStreakMilestone(
            userId,
            roleId,
            'test-goal-id',
            'Test Streak Goal',
            7,
            'test-person-id',
            'Test Person'
          );

        case 'goal_reminder':
          return await notifyGoalReminder(
            userId,
            roleId,
            'test-goal-id',
            'Test Goal',
            15,
            20,
            3,
            'test-person-id',
            'Test Person'
          );

        case 'condition_triggered':
          return await notifyConditionTriggered(
            userId,
            roleId,
            'test-routine-id',
            'Test Routine',
            'Time is after 3 PM',
            true
          );

        case 'daily_summary':
          return await notifyDailySummary(userId, roleId, {
            tasksCompleted: 12,
            goalsProgressed: 3,
            streaksMaintained: 2,
            achievements: ['Completed Morning Routine', '7-Day Streak'],
            persons: [
              { name: 'Alice', completionRate: 85 },
              { name: 'Bob', completionRate: 92 },
            ],
          });

        default:
          throw new Error('Invalid test notification type');
      }
    }),
});