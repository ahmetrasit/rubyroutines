import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, isSameDay, differenceInDays } from 'date-fns';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: Date | null;
  totalCompletions: number;
  streakHistory: Array<{
    date: Date;
    completed: boolean;
  }>;
}

/**
 * Calculate current streak for a person's routine
 */
export async function calculateRoutineStreak(
  personId: string,
  routineId: string
): Promise<StreakData> {
  // Get all task completions for this person and routine
  const completions = await prisma.taskCompletion.findMany({
    where: {
      personId,
      task: {
        routineId,
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
    select: {
      completedAt: true,
      taskId: true,
    },
  });

  if (completions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      totalCompletions: 0,
      streakHistory: [],
    };
  }

  // Get all tasks in the routine to know how many must be completed each day
  const routineTasks = await prisma.task.findMany({
    where: {
      routineId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
    },
  });

  const requiredTasksPerDay = routineTasks.length;

  // Group completions by date
  const completionsByDate = new Map<string, Set<string>>();
  completions.forEach((completion) => {
    const dateKey = startOfDay(completion.completedAt).toISOString();
    if (!completionsByDate.has(dateKey)) {
      completionsByDate.set(dateKey, new Set());
    }
    completionsByDate.get(dateKey)!.add(completion.taskId);
  });

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = startOfDay(new Date());

  while (true) {
    const dateKey = checkDate.toISOString();
    const completedTasks = completionsByDate.get(dateKey);

    // Check if all tasks were completed on this day
    if (completedTasks && completedTasks.size >= requiredTasksPerDay) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else if (isSameDay(checkDate, new Date())) {
      // Today hasn't been completed yet, check yesterday
      checkDate = subDays(checkDate, 1);
    } else {
      // Streak is broken
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = Array.from(completionsByDate.keys()).sort();

  for (let i = 0; i < sortedDates.length; i++) {
    const dateStr = sortedDates[i];
    if (!dateStr) continue;

    const currentDate = new Date(dateStr);
    const completedTasks = completionsByDate.get(dateStr)!;

    if (completedTasks.size >= requiredTasksPerDay) {
      tempStreak++;

      // Check if next day continues the streak
      if (i < sortedDates.length - 1) {
        const nextDateStr = sortedDates[i + 1];
        if (!nextDateStr) continue;
        const nextDate = new Date(nextDateStr);
        const daysDiff = differenceInDays(nextDate, currentDate);
        if (daysDiff > 1) {
          // Streak is broken
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Build streak history for last 30 days
  const streakHistory = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(startOfDay(new Date()), i);
    const dateKey = date.toISOString();
    const completedTasks = completionsByDate.get(dateKey);
    const completed = completedTasks ? completedTasks.size >= requiredTasksPerDay : false;

    streakHistory.push({
      date,
      completed,
    });
  }

  const firstCompletion = completions[0];
  return {
    currentStreak,
    longestStreak,
    lastCompletionDate: firstCompletion?.completedAt || new Date(),
    totalCompletions: completions.length,
    streakHistory,
  };
}

/**
 * Calculate current streak for a person across all routines
 */
export async function calculatePersonStreak(personId: string): Promise<StreakData> {
  // Get all assigned routines for this person
  const assignments = await prisma.routineAssignment.findMany({
    where: {
      personId,
      routine: {
        status: 'ACTIVE',
      },
    },
    select: {
      routineId: true,
    },
  });

  if (assignments.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      totalCompletions: 0,
      streakHistory: [],
    };
  }

  // Get completions for all assigned routines
  const routineIds = assignments.map((a) => a.routineId);
  const completions = await prisma.taskCompletion.findMany({
    where: {
      personId,
      task: {
        routineId: {
          in: routineIds,
        },
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
    select: {
      completedAt: true,
      taskId: true,
      task: {
        select: {
          routineId: true,
        },
      },
    },
  });

  if (completions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      totalCompletions: 0,
      streakHistory: [],
    };
  }

  // Group completions by date and routine
  const completionsByDateAndRoutine = new Map<string, Map<string, Set<string>>>();
  completions.forEach((completion) => {
    const dateKey = startOfDay(completion.completedAt).toISOString();
    if (!completionsByDateAndRoutine.has(dateKey)) {
      completionsByDateAndRoutine.set(dateKey, new Map());
    }
    const routineMap = completionsByDateAndRoutine.get(dateKey)!;
    if (!routineMap.has(completion.task.routineId)) {
      routineMap.set(completion.task.routineId, new Set());
    }
    routineMap.get(completion.task.routineId)!.add(completion.taskId);
  });

  // Get task counts for each routine
  const routineTaskCounts = new Map<string, number>();
  for (const routineId of routineIds) {
    const count = await prisma.task.count({
      where: {
        routineId,
        status: 'ACTIVE',
      },
    });
    routineTaskCounts.set(routineId, count);
  }

  // Calculate current streak (all routines must be completed each day)
  let currentStreak = 0;
  let checkDate = startOfDay(new Date());

  while (true) {
    const dateKey = checkDate.toISOString();
    const routineCompletions = completionsByDateAndRoutine.get(dateKey);

    // Check if all routines were completed on this day
    let allRoutinesCompleted = true;
    if (routineCompletions) {
      for (const routineId of routineIds) {
        const completedTasks = routineCompletions.get(routineId);
        const requiredTasks = routineTaskCounts.get(routineId) || 0;
        if (!completedTasks || completedTasks.size < requiredTasks) {
          allRoutinesCompleted = false;
          break;
        }
      }
    } else {
      allRoutinesCompleted = false;
    }

    if (allRoutinesCompleted) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else if (isSameDay(checkDate, new Date())) {
      // Today hasn't been completed yet, check yesterday
      checkDate = subDays(checkDate, 1);
    } else {
      // Streak is broken
      break;
    }
  }

  // Build streak history for last 30 days
  const streakHistory = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(startOfDay(new Date()), i);
    const dateKey = date.toISOString();
    const routineCompletions = completionsByDateAndRoutine.get(dateKey);

    let allRoutinesCompleted = true;
    if (routineCompletions) {
      for (const routineId of routineIds) {
        const completedTasks = routineCompletions.get(routineId);
        const requiredTasks = routineTaskCounts.get(routineId) || 0;
        if (!completedTasks || completedTasks.size < requiredTasks) {
          allRoutinesCompleted = false;
          break;
        }
      }
    } else {
      allRoutinesCompleted = false;
    }

    streakHistory.push({
      date,
      completed: allRoutinesCompleted,
    });
  }

  const firstCompletion = completions[0];
  return {
    currentStreak,
    longestStreak: 0, // FEATURE: Longest streak calculation not yet implemented
    lastCompletionDate: firstCompletion?.completedAt || new Date(),
    totalCompletions: completions.length,
    streakHistory,
  };
}

/**
 * Get streak milestones
 */
export function getStreakMilestones(currentStreak: number): {
  milestone: number;
  achieved: boolean;
  message: string;
}[] {
  const milestones = [
    { days: 3, message: '3-Day Streak! Great start!' },
    { days: 7, message: '1 Week Streak! Keep it up!' },
    { days: 14, message: '2 Week Streak! You\'re on fire!' },
    { days: 30, message: '30-Day Streak! Amazing dedication!' },
    { days: 60, message: '60-Day Streak! Unstoppable!' },
    { days: 90, message: '90-Day Streak! Master of consistency!' },
    { days: 180, message: '6 Month Streak! Legendary!' },
    { days: 365, message: '1 Year Streak! Champion!' },
  ];

  return milestones.map((m) => ({
    milestone: m.days,
    achieved: currentStreak >= m.days,
    message: m.message,
  }));
}

/**
 * Check if a streak milestone was just achieved
 */
export function checkNewMilestone(
  previousStreak: number,
  currentStreak: number
): { milestone: number; message: string } | null {
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];

  for (const milestone of milestones) {
    if (previousStreak < milestone && currentStreak >= milestone) {
      const messages: Record<number, string> = {
        3: '3-Day Streak! Great start!',
        7: '1 Week Streak! Keep it up!',
        14: '2 Week Streak! You\'re on fire!',
        30: '30-Day Streak! Amazing dedication!',
        60: '60-Day Streak! Unstoppable!',
        90: '90-Day Streak! Master of consistency!',
        180: '6 Month Streak! Legendary!',
        365: '1 Year Streak! Champion!',
      };

      return {
        milestone,
        message: messages[milestone] || `${milestone}-Day Streak!`,
      };
    }
  }

  return null;
}
