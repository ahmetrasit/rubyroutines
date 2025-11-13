import { ResetPeriod } from '@/lib/types/prisma-enums';

export function calculateNextReset(
  period: ResetPeriod,
  resetDay?: number | null,
  resetTime: string = '23:55'
): Date {
  const now = new Date();
  const [hoursStr, minutesStr] = resetTime.split(':');
  const hours = parseInt(hoursStr || '23', 10);
  const minutes = parseInt(minutesStr || '55', 10);
  const next = new Date(now);

  next.setHours(hours, minutes, 0, 0);

  switch (period) {
    case ResetPeriod.DAILY:
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case ResetPeriod.WEEKLY:
      if (resetDay === null || resetDay === undefined) {
        throw new Error('resetDay required for weekly period');
      }
      // resetDay is 0-6 (Sunday-Saturday)
      const currentDay = next.getDay();
      const daysUntilReset = (7 + resetDay - currentDay) % 7;

      next.setDate(next.getDate() + daysUntilReset);

      if (next <= now) {
        next.setDate(next.getDate() + 7);
      }
      break;

    case ResetPeriod.MONTHLY:
      if (resetDay === null || resetDay === undefined) {
        throw new Error('resetDay required for monthly period');
      }

      if (resetDay === 99) {
        // Last day of month
        next.setMonth(next.getMonth() + 1, 0);
      } else {
        // Specific day (1-28)
        next.setDate(resetDay);
      }

      if (next <= now) {
        if (resetDay === 99) {
          next.setMonth(next.getMonth() + 2, 0);
        } else {
          next.setMonth(next.getMonth() + 1);
          next.setDate(resetDay);
        }
      }
      break;

    case ResetPeriod.CUSTOM:
      throw new Error('Custom reset period not yet implemented');
  }

  return next;
}

export function shouldResetNow(routine: {
  resetPeriod: ResetPeriod;
  resetDay?: number | null;
  lastResetAt?: Date | null;
}): boolean {
  if (!routine.lastResetAt) {
    return false; // Never reset yet, don't auto-reset
  }

  const nextReset = calculateNextReset(routine.resetPeriod, routine.resetDay);

  return new Date() >= nextReset;
}

export function getResetDescription(period: ResetPeriod, resetDay?: number | null): string {
  switch (period) {
    case ResetPeriod.DAILY:
      return 'Daily at 11:55 PM';

    case ResetPeriod.WEEKLY:
      if (resetDay === null || resetDay === undefined) return 'Weekly';
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Weekly on ${days[resetDay]} at 11:55 PM`;

    case ResetPeriod.MONTHLY:
      if (resetDay === null || resetDay === undefined) return 'Monthly';
      if (resetDay === 99) return 'Monthly on last day at 11:55 PM';
      return `Monthly on day ${resetDay} at 11:55 PM`;

    case ResetPeriod.CUSTOM:
      return 'Custom schedule';

    default:
      return 'Unknown';
  }
}

/**
 * Get the start date of the current reset period
 * Used for filtering completions within the current period
 */
export function getResetPeriodStart(
  period: ResetPeriod,
  resetDay?: number | null,
  resetTime: string = '23:55'
): Date {
  const now = new Date();
  const [hoursStr, minutesStr] = resetTime.split(':');
  const hours = parseInt(hoursStr || '23', 10);
  const minutes = parseInt(minutesStr || '55', 10);

  switch (period) {
    case ResetPeriod.DAILY: {
      const startOfToday = new Date(now);
      startOfToday.setHours(hours, minutes, 0, 0);

      // If current time is before reset time, period started yesterday
      if (now < startOfToday) {
        startOfToday.setDate(startOfToday.getDate() - 1);
      }

      return startOfToday;
    }

    case ResetPeriod.WEEKLY: {
      if (resetDay === null || resetDay === undefined) {
        resetDay = 0; // Default to Sunday
      }

      const currentDay = now.getDay();
      const daysAgo = (7 + currentDay - resetDay) % 7;

      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - daysAgo);
      periodStart.setHours(hours, minutes, 0, 0);

      // If we haven't passed the reset time this week yet, go back one week
      if (periodStart > now) {
        periodStart.setDate(periodStart.getDate() - 7);
      }

      return periodStart;
    }

    case ResetPeriod.MONTHLY: {
      if (resetDay === null || resetDay === undefined) {
        resetDay = 1; // Default to 1st of month
      }

      const periodStart = new Date(now);
      periodStart.setHours(hours, minutes, 0, 0);

      if (resetDay === 99) {
        // Last day of month
        periodStart.setMonth(periodStart.getMonth(), 0); // Set to last day of previous month

        // If we haven't reached it this month yet, use last month's last day
        if (periodStart > now) {
          periodStart.setMonth(periodStart.getMonth() - 1, 0);
        }
      } else {
        // Specific day
        periodStart.setDate(resetDay);

        // If we haven't reached it this month yet, use last month
        if (periodStart > now) {
          periodStart.setMonth(periodStart.getMonth() - 1);
        }
      }

      return periodStart;
    }

    case ResetPeriod.CUSTOM:
      // For custom, return beginning of time (never resets)
      return new Date(0);

    default:
      return new Date(0);
  }
}
