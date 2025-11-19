import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export interface NotificationData {
  goalId?: string;
  goalName?: string;
  personId?: string;
  personName?: string;
  streakCount?: number;
  achievementValue?: number;
  targetValue?: number;
  completionRate?: number;
  milestoneName?: string;
  [key: string]: any;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  roleId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData
) {
  return await prisma.notification.create({
    data: {
      userId,
      roleId,
      type,
      title,
      message,
      data: data as any,
      read: false
    }
  });
}

/**
 * Send goal achievement notification
 */
export async function notifyGoalAchievement(
  userId: string,
  roleId: string,
  goalId: string,
  goalName: string,
  personId?: string,
  personName?: string
) {
  const title = personName
    ? `${personName} achieved a goal!`
    : 'Goal achieved!';

  const message = `Congratulations! The goal "${goalName}" has been achieved.`;

  return await createNotification(
    userId,
    roleId,
    'GOAL_ACHIEVED',
    title,
    message,
    {
      goalId,
      goalName,
      personId,
      personName
    }
  );
}

/**
 * Send streak milestone notification
 */
export async function notifyStreakMilestone(
  userId: string,
  roleId: string,
  goalId: string,
  goalName: string,
  streakCount: number,
  personId?: string,
  personName?: string
) {
  const milestones = [3, 5, 7, 10, 14, 21, 30, 50, 100];
  if (!milestones.includes(streakCount)) return null;

  const title = `${streakCount}-day streak milestone!`;
  const message = personName
    ? `${personName} has maintained a ${streakCount}-day streak on "${goalName}"!`
    : `You've maintained a ${streakCount}-day streak on "${goalName}"!`;

  return await createNotification(
    userId,
    roleId,
    'STREAK_MILESTONE',
    title,
    message,
    {
      goalId,
      goalName,
      streakCount,
      personId,
      personName
    }
  );
}

/**
 * Send goal reminder notification
 */
export async function notifyGoalReminder(
  userId: string,
  roleId: string,
  goalId: string,
  goalName: string,
  currentValue: number,
  targetValue: number,
  daysRemaining: number,
  personId?: string,
  personName?: string
) {
  const completionRate = Math.round((currentValue / targetValue) * 100);

  let urgency = 'Keep going!';
  if (daysRemaining <= 1) {
    urgency = 'Last day!';
  } else if (daysRemaining <= 3) {
    urgency = 'Almost there!';
  } else if (completionRate >= 75) {
    urgency = 'You\'re doing great!';
  }

  const title = `Goal reminder: ${urgency}`;
  const message = personName
    ? `${personName} has completed ${completionRate}% of "${goalName}" with ${daysRemaining} days remaining.`
    : `You've completed ${completionRate}% of "${goalName}" with ${daysRemaining} days remaining.`;

  return await createNotification(
    userId,
    roleId,
    'GOAL_REMINDER',
    title,
    message,
    {
      goalId,
      goalName,
      currentValue,
      targetValue,
      completionRate,
      daysRemaining,
      personId,
      personName
    }
  );
}

/**
 * Send condition triggered notification
 */
export async function notifyConditionTriggered(
  userId: string,
  roleId: string,
  routineId: string,
  routineName: string,
  conditionName: string,
  isNowVisible: boolean
) {
  const title = isNowVisible
    ? `Routine now available!`
    : `Routine conditions changed`;

  const message = isNowVisible
    ? `"${routineName}" is now available because ${conditionName || 'conditions were met'}.`
    : `"${routineName}" is no longer available because ${conditionName || 'conditions changed'}.`;

  return await createNotification(
    userId,
    roleId,
    'CONDITION_TRIGGERED',
    title,
    message,
    {
      routineId,
      routineName,
      conditionName,
      isNowVisible
    }
  );
}

/**
 * Send daily summary notification
 */
export async function notifyDailySummary(
  userId: string,
  roleId: string,
  summary: {
    tasksCompleted: number;
    goalsProgressed: number;
    streaksMaintained: number;
    achievements: string[];
    persons?: Array<{ name: string; completionRate: number }>;
  }
) {
  const title = 'Daily Summary';

  let message = `Today's progress: ${summary.tasksCompleted} tasks completed`;

  if (summary.goalsProgressed > 0) {
    message += `, ${summary.goalsProgressed} goals progressed`;
  }

  if (summary.streaksMaintained > 0) {
    message += `, ${summary.streaksMaintained} streaks maintained`;
  }

  if (summary.achievements.length > 0) {
    message += `. Achievements: ${summary.achievements.join(', ')}`;
  }

  return await createNotification(
    userId,
    roleId,
    'DAILY_SUMMARY',
    title,
    message,
    summary as NotificationData
  );
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string, roleId: string) {
  return await prisma.notification.findMany({
    where: {
      userId,
      roleId,
      read: false
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  });
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(
  userId: string,
  roleId: string,
  limit: number = 50,
  offset: number = 0
) {
  return await prisma.notification.findMany({
    where: {
      userId,
      roleId
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  return await prisma.notification.update({
    where: {
      id: notificationId,
      userId // Ensure user owns this notification
    },
    data: {
      read: true
    }
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string, roleId: string) {
  return await prisma.notification.updateMany({
    where: {
      userId,
      roleId,
      read: false
    },
    data: {
      read: true
    }
  });
}

/**
 * Get unread count
 */
export async function getUnreadCount(userId: string, roleId: string) {
  return await prisma.notification.count({
    where: {
      userId,
      roleId,
      read: false
    }
  });
}

/**
 * Delete old notifications (cleanup job)
 */
export async function deleteOldNotifications(daysToKeep: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return await prisma.notification.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      },
      read: true // Only delete read notifications
    }
  });
}

/**
 * Check and send streak risk notifications
 */
export async function checkStreakRisks(roleId: string) {
  const goals = await prisma.goal.findMany({
    where: {
      roleId,
      status: 'ACTIVE',
      streakEnabled: true,
      currentStreak: { gt: 0 }
    },
    include: {
      role: {
        include: {
          user: true
        }
      }
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const goal of goals) {
    // Check if streak is at risk (no completion today)
    const hasCompletionToday = await prisma.taskCompletion.findFirst({
      where: {
        task: {
          goalLinks: {
            some: {
              goalId: goal.id
            }
          }
        },
        completedAt: {
          gte: today
        }
      }
    });

    if (!hasCompletionToday && goal.lastAchievedAt) {
      const hoursSinceLastAchievement = (today.getTime() - new Date(goal.lastAchievedAt).getTime()) / (1000 * 60 * 60);

      // Send notification if it's been more than 20 hours
      if (hoursSinceLastAchievement > 20) {
        await createNotification(
          goal.role.userId,
          goal.roleId,
          'STREAK_RISK',
          'Streak at risk!',
          `Your ${goal.currentStreak}-day streak on "${goal.name}" is at risk! Complete it today to keep it going.`,
          {
            goalId: goal.id,
            goalName: goal.name,
            streakCount: goal.currentStreak
          }
        );
      }
    }
  }
}

/**
 * Send encouragement notifications
 */
export async function sendEncouragementNotifications(roleId: string) {
  const goals = await prisma.goal.findMany({
    where: {
      roleId,
      status: 'ACTIVE'
    },
    include: {
      role: {
        include: {
          user: true
        }
      }
    }
  });

  for (const goal of goals) {
    // Calculate progress
    const progress = await calculateGoalProgress(goal.id);

    // Send encouragement based on progress
    if (progress >= 50 && progress < 75) {
      await createNotification(
        goal.role.userId,
        goal.roleId,
        'ENCOURAGEMENT',
        'Halfway there!',
        `Great progress on "${goal.name}"! You're ${progress}% of the way to your goal.`,
        {
          goalId: goal.id,
          goalName: goal.name,
          completionRate: progress
        }
      );
    } else if (progress >= 75 && progress < 100) {
      await createNotification(
        goal.role.userId,
        goal.roleId,
        'ENCOURAGEMENT',
        'Almost there!',
        `Amazing work on "${goal.name}"! Just a little more to reach your goal (${progress}% complete).`,
        {
          goalId: goal.id,
          goalName: goal.name,
          completionRate: progress
        }
      );
    }
  }
}

/**
 * Helper function to calculate goal progress
 */
async function calculateGoalProgress(goalId: string): Promise<number> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      taskLinks: {
        include: {
          task: {
            include: {
              completions: true
            }
          }
        }
      }
    }
  });

  if (!goal) return 0;

  const completionCount = goal.taskLinks.reduce(
    (sum, link) => sum + link.task.completions.length,
    0
  );

  return Math.min(100, Math.round((completionCount / goal.target) * 100));
}