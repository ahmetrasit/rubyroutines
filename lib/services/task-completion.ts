import { TaskType } from '@/lib/types/prisma-enums';
import { differenceInMinutes } from 'date-fns';

// Admin-configurable undo window in minutes
const UNDO_WINDOW_MINUTES = 5;

/**
 * Check if a completion can be undone based on the undo window
 */
export function canUndoCompletion(
  completedAt: Date,
  taskType: TaskType,
  undoWindowMinutes: number = UNDO_WINDOW_MINUTES
): boolean {
  // Only SIMPLE tasks support undo
  if (taskType !== TaskType.SIMPLE) {
    return false;
  }

  const now = new Date();
  const minutesSinceCompletion = differenceInMinutes(now, completedAt);

  return minutesSinceCompletion <= undoWindowMinutes;
}

/**
 * Calculate remaining undo time in seconds
 */
export function getRemainingUndoTime(
  completedAt: Date,
  undoWindowMinutes: number = UNDO_WINDOW_MINUTES
): number {
  const now = new Date();
  const completedAtMs = completedAt.getTime();
  const nowMs = now.getTime();
  const windowMs = undoWindowMinutes * 60 * 1000;
  const expiresAtMs = completedAtMs + windowMs;

  const remainingMs = expiresAtMs - nowMs;

  return Math.max(0, Math.floor(remainingMs / 1000));
}

/**
 * Get task completion count for a person in the current reset period
 */
export function getCompletionCount(
  completions: Array<{ completedAt: Date }>,
  resetDate: Date
): number {
  return completions.filter((completion) => completion.completedAt >= resetDate).length;
}

/**
 * Calculate progress percentage for PROGRESS tasks
 */
export function calculateProgress(
  completions: Array<{ value: string | null }>,
  targetValue: number
): number {
  const totalValue = completions.reduce((sum, completion) => {
    const value = parseFloat(completion.value || '0');
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  return Math.min(100, Math.round((totalValue / targetValue) * 100));
}

/**
 * Get aggregated completion data for task display
 */
export function getTaskAggregation(
  task: {
    type: TaskType;
    targetValue?: number | null;
  },
  completions: Array<{ completedAt: Date; value: string | null }>,
  resetDate: Date
): {
  isComplete: boolean;
  completionCount: number;
  progress?: number;
  totalValue?: number;
} {
  const relevantCompletions = completions.filter(
    (c) => c.completedAt >= resetDate
  );

  switch (task.type) {
    case TaskType.SIMPLE:
      return {
        isComplete: relevantCompletions.length > 0,
        completionCount: relevantCompletions.length,
      };

    case TaskType.MULTIPLE_CHECKIN:
      return {
        isComplete: false, // Multiple check-ins never fully complete
        completionCount: relevantCompletions.length,
      };

    case TaskType.PROGRESS:
      const totalValue = relevantCompletions.reduce((sum, c) => {
        const value = parseFloat(c.value || '0');
        return sum + (isNaN(value) ? 0 : value);
      }, 0);

      const targetValue = task.targetValue || 1;
      const progress = Math.min(100, Math.round((totalValue / targetValue) * 100));

      return {
        isComplete: progress >= 100,
        completionCount: relevantCompletions.length,
        progress,
        totalValue,
      };

    default:
      return {
        isComplete: false,
        completionCount: 0,
      };
  }
}
