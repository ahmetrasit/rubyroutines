import { ResetPeriod } from '@prisma/client';

export function calculateNextReset(
  period: ResetPeriod,
  resetDay?: number | null,
  resetTime: string = '23:55'
): Date {
  const now = new Date();
  const [hours, minutes] = resetTime.split(':').map(Number);
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
