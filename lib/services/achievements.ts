/**
 * Achievement System
 * Provides gamification through badges and achievements
 */

import { prisma } from '@/lib/prisma';

export type AchievementCategory =
  | 'STREAK'
  | 'COMPLETION'
  | 'ROUTINE'
  | 'CONSISTENCY'
  | 'MILESTONE'
  | 'SPECIAL';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  category: AchievementCategory;
  requirement: number;
  unit: string; // e.g., 'days', 'tasks', 'routines'
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress?: number;
}

/**
 * All available achievements
 */
export const ACHIEVEMENTS: Record<string, Achievement> = {
  // Streak Achievements
  STREAK_3: {
    id: 'STREAK_3',
    name: 'Getting Started',
    description: 'Complete tasks for 3 days in a row',
    icon: '🌱',
    category: 'STREAK',
    requirement: 3,
    unit: 'days',
    rarity: 'COMMON',
  },
  STREAK_7: {
    id: 'STREAK_7',
    name: 'Week Warrior',
    description: 'Complete tasks for 7 days in a row',
    icon: '🔥',
    category: 'STREAK',
    requirement: 7,
    unit: 'days',
    rarity: 'COMMON',
  },
  STREAK_14: {
    id: 'STREAK_14',
    name: 'Two Week Champion',
    description: 'Complete tasks for 14 days in a row',
    icon: '⚡',
    category: 'STREAK',
    requirement: 14,
    unit: 'days',
    rarity: 'RARE',
  },
  STREAK_30: {
    id: 'STREAK_30',
    name: 'Monthly Master',
    description: 'Complete tasks for 30 days in a row',
    icon: '🏆',
    category: 'STREAK',
    requirement: 30,
    unit: 'days',
    rarity: 'RARE',
  },
  STREAK_100: {
    id: 'STREAK_100',
    name: 'Centurion',
    description: 'Complete tasks for 100 days in a row',
    icon: '👑',
    category: 'STREAK',
    requirement: 100,
    unit: 'days',
    rarity: 'EPIC',
  },
  STREAK_365: {
    id: 'STREAK_365',
    name: 'Year Legend',
    description: 'Complete tasks for 365 days in a row',
    icon: '🌟',
    category: 'STREAK',
    requirement: 365,
    unit: 'days',
    rarity: 'LEGENDARY',
  },

  // Completion Achievements
  TASKS_10: {
    id: 'TASKS_10',
    name: 'First Steps',
    description: 'Complete 10 tasks',
    icon: '✅',
    category: 'COMPLETION',
    requirement: 10,
    unit: 'tasks',
    rarity: 'COMMON',
  },
  TASKS_50: {
    id: 'TASKS_50',
    name: 'Task Tackler',
    description: 'Complete 50 tasks',
    icon: '💪',
    category: 'COMPLETION',
    requirement: 50,
    unit: 'tasks',
    rarity: 'COMMON',
  },
  TASKS_100: {
    id: 'TASKS_100',
    name: 'Century Club',
    description: 'Complete 100 tasks',
    icon: '🎯',
    category: 'COMPLETION',
    requirement: 100,
    unit: 'tasks',
    rarity: 'RARE',
  },
  TASKS_500: {
    id: 'TASKS_500',
    name: 'Task Master',
    description: 'Complete 500 tasks',
    icon: '🚀',
    category: 'COMPLETION',
    requirement: 500,
    unit: 'tasks',
    rarity: 'EPIC',
  },
  TASKS_1000: {
    id: 'TASKS_1000',
    name: 'Productivity Legend',
    description: 'Complete 1000 tasks',
    icon: '💎',
    category: 'COMPLETION',
    requirement: 1000,
    unit: 'tasks',
    rarity: 'LEGENDARY',
  },

  // Routine Achievements
  ROUTINES_3: {
    id: 'ROUTINES_3',
    name: 'Routine Builder',
    description: 'Create 3 routines',
    icon: '📝',
    category: 'ROUTINE',
    requirement: 3,
    unit: 'routines',
    rarity: 'COMMON',
  },
  ROUTINES_10: {
    id: 'ROUTINES_10',
    name: 'Routine Expert',
    description: 'Create 10 routines',
    icon: '📚',
    category: 'ROUTINE',
    requirement: 10,
    unit: 'routines',
    rarity: 'RARE',
  },

  // Consistency Achievements
  PERFECT_WEEK: {
    id: 'PERFECT_WEEK',
    name: 'Perfect Week',
    description: 'Complete all tasks every day for a week',
    icon: '⭐',
    category: 'CONSISTENCY',
    requirement: 7,
    unit: 'days',
    rarity: 'RARE',
  },
  PERFECT_MONTH: {
    id: 'PERFECT_MONTH',
    name: 'Perfect Month',
    description: 'Complete all tasks every day for a month',
    icon: '🌟',
    category: 'CONSISTENCY',
    requirement: 30,
    unit: 'days',
    rarity: 'EPIC',
  },

  // Milestone Achievements
  EARLY_BIRD: {
    id: 'EARLY_BIRD',
    name: 'Early Bird',
    description: 'Complete morning routine before 8 AM, 10 times',
    icon: '🌅',
    category: 'MILESTONE',
    requirement: 10,
    unit: 'times',
    rarity: 'RARE',
  },
  NIGHT_OWL: {
    id: 'NIGHT_OWL',
    name: 'Night Owl',
    description: 'Complete evening routine after 10 PM, 10 times',
    icon: '🌙',
    category: 'MILESTONE',
    requirement: 10,
    unit: 'times',
    rarity: 'RARE',
  },

  // Special Achievements
  FIRST_TASK: {
    id: 'FIRST_TASK',
    name: 'Getting Started',
    description: 'Complete your first task',
    icon: '🎉',
    category: 'SPECIAL',
    requirement: 1,
    unit: 'task',
    rarity: 'COMMON',
  },
  SHARED_ROUTINE: {
    id: 'SHARED_ROUTINE',
    name: 'Team Player',
    description: 'Share a routine with a co-parent or co-teacher',
    icon: '🤝',
    category: 'SPECIAL',
    requirement: 1,
    unit: 'share',
    rarity: 'COMMON',
  },
};

/**
 * Check if user has unlocked specific achievements
 */
export async function checkAchievements(
  personId: string,
  roleId: string
): Promise<UserAchievement[]> {
  const newAchievements: UserAchievement[] = [];

  // Get task completion stats
  const completionCount = await prisma.taskCompletion.count({
    where: { personId },
  });

  // Get streak data
  const recentCompletions = await prisma.taskCompletion.findMany({
    where: { personId },
    orderBy: { completedAt: 'desc' },
    take: 500, // Enough to check for long streaks
  });

  // Calculate current streak
  let currentStreak = 0;
  if (recentCompletions.length > 0) {
    const dates = new Set(
      recentCompletions.map((c) => c.completedAt.toISOString().split('T')[0])
    );
    const sortedDates = Array.from(dates).sort().reverse();

    let streak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = sortedDates[i];
      const nextDate = sortedDates[i + 1];
      if (!currentDate || !nextDate) continue;
      const current = new Date(currentDate);
      const next = new Date(nextDate);
      const dayDiff = Math.floor(
        (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }
    currentStreak = streak;
  }

  // Get routine count
  const routineCount = await prisma.routine.count({
    where: { roleId, status: 'ACTIVE' },
  });

  // Check task completion achievements
  if (completionCount >= 1 && completionCount < 10) {
    newAchievements.push({
      achievementId: 'FIRST_TASK',
      unlockedAt: new Date(),
    });
  }
  if (completionCount >= 10) {
    newAchievements.push({
      achievementId: 'TASKS_10',
      unlockedAt: new Date(),
    });
  }
  if (completionCount >= 50) {
    newAchievements.push({
      achievementId: 'TASKS_50',
      unlockedAt: new Date(),
    });
  }
  if (completionCount >= 100) {
    newAchievements.push({
      achievementId: 'TASKS_100',
      unlockedAt: new Date(),
    });
  }
  if (completionCount >= 500) {
    newAchievements.push({
      achievementId: 'TASKS_500',
      unlockedAt: new Date(),
    });
  }
  if (completionCount >= 1000) {
    newAchievements.push({
      achievementId: 'TASKS_1000',
      unlockedAt: new Date(),
    });
  }

  // Check streak achievements
  if (currentStreak >= 3) {
    newAchievements.push({
      achievementId: 'STREAK_3',
      unlockedAt: new Date(),
    });
  }
  if (currentStreak >= 7) {
    newAchievements.push({
      achievementId: 'STREAK_7',
      unlockedAt: new Date(),
    });
  }
  if (currentStreak >= 14) {
    newAchievements.push({
      achievementId: 'STREAK_14',
      unlockedAt: new Date(),
    });
  }
  if (currentStreak >= 30) {
    newAchievements.push({
      achievementId: 'STREAK_30',
      unlockedAt: new Date(),
    });
  }
  if (currentStreak >= 100) {
    newAchievements.push({
      achievementId: 'STREAK_100',
      unlockedAt: new Date(),
    });
  }
  if (currentStreak >= 365) {
    newAchievements.push({
      achievementId: 'STREAK_365',
      unlockedAt: new Date(),
    });
  }

  // Check routine achievements
  if (routineCount >= 3) {
    newAchievements.push({
      achievementId: 'ROUTINES_3',
      unlockedAt: new Date(),
    });
  }
  if (routineCount >= 10) {
    newAchievements.push({
      achievementId: 'ROUTINES_10',
      unlockedAt: new Date(),
    });
  }

  return newAchievements;
}

/**
 * Get achievement progress for display
 */
export async function getAchievementProgress(
  personId: string,
  roleId: string
): Promise<{ [key: string]: number }> {
  const completionCount = await prisma.taskCompletion.count({
    where: { personId },
  });

  const recentCompletions = await prisma.taskCompletion.findMany({
    where: { personId },
    orderBy: { completedAt: 'desc' },
    take: 500,
  });

  let currentStreak = 0;
  if (recentCompletions.length > 0) {
    const dates = new Set(
      recentCompletions.map((c) => c.completedAt.toISOString().split('T')[0])
    );
    const sortedDates = Array.from(dates).sort().reverse();

    let streak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = sortedDates[i];
      const nextDate = sortedDates[i + 1];
      if (!currentDate || !nextDate) continue;
      const current = new Date(currentDate);
      const next = new Date(nextDate);
      const dayDiff = Math.floor(
        (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }
    currentStreak = streak;
  }

  const routineCount = await prisma.routine.count({
    where: { roleId, status: 'ACTIVE' },
  });

  return {
    completionCount,
    currentStreak,
    routineCount,
  };
}

/**
 * Get rarity color for UI
 */
export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'COMMON':
      return 'text-gray-600 dark:text-gray-400';
    case 'RARE':
      return 'text-blue-600 dark:text-blue-400';
    case 'EPIC':
      return 'text-purple-600 dark:text-purple-400';
    case 'LEGENDARY':
      return 'text-yellow-600 dark:text-yellow-400';
  }
}

/**
 * Get rarity background for UI
 */
export function getRarityBackground(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'COMMON':
      return 'bg-gray-100 dark:bg-gray-800';
    case 'RARE':
      return 'bg-blue-50 dark:bg-blue-900/20';
    case 'EPIC':
      return 'bg-purple-50 dark:bg-purple-900/20';
    case 'LEGENDARY':
      return 'bg-yellow-50 dark:bg-yellow-900/20';
  }
}
