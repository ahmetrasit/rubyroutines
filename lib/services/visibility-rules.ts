import { Visibility } from '@/lib/types/prisma-enums';

export interface VisibilityOverride {
  id: string;
  routineId: string;
  duration: number;
  expiresAt: Date;
}

export function isRoutineVisible(routine: {
  visibility: Visibility;
  visibleDays: number[];
  startDate?: Date | null;
  endDate?: Date | null;
}): boolean {
  const now = new Date();

  switch (routine.visibility) {
    case Visibility.ALWAYS:
      return true;

    case Visibility.DAYS_OF_WEEK:
      // visibleDays is array of day numbers (0-6, Sunday-Saturday)
      const currentDay = now.getDay();
      return routine.visibleDays.includes(currentDay);

    case Visibility.DATE_RANGE:
      if (!routine.startDate || !routine.endDate) return false;

      const currentMonth = now.getMonth() + 1;
      const currentDate = now.getDate();

      const startMonth = routine.startDate.getMonth() + 1;
      const startDay = routine.startDate.getDate();

      const endMonth = routine.endDate.getMonth() + 1;
      const endDay = routine.endDate.getDate();

      // Handle same year range (e.g., March to October)
      if (startMonth <= endMonth) {
        if (currentMonth < startMonth || currentMonth > endMonth) return false;
        if (currentMonth === startMonth && currentDate < startDay) return false;
        if (currentMonth === endMonth && currentDate > endDay) return false;
        return true;
      }

      // Handle year-crossing range (e.g., November to February)
      if (currentMonth >= startMonth || currentMonth <= endMonth) {
        if (currentMonth === startMonth && currentDate < startDay) return false;
        if (currentMonth === endMonth && currentDate > endDay) return false;
        return true;
      }

      return false;

    case Visibility.CONDITIONAL:
      // Conditional visibility handled by condition system (Stage 3)
      return true;

    default:
      return true;
  }
}

export function checkVisibilityOverride(
  routineId: string,
  overrides: VisibilityOverride[]
): VisibilityOverride | null {
  const now = new Date();

  const active = overrides.find(
    (o) => o.routineId === routineId && o.expiresAt > now
  );

  return active || null;
}

export function getRemainingOverrideTime(override: VisibilityOverride): number {
  const now = new Date();
  const remaining = override.expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.floor(remaining / 1000 / 60)); // Return minutes
}

export function formatVisibilityDescription(routine: {
  visibility: Visibility;
  visibleDays: number[];
  startDate?: Date | null;
  endDate?: Date | null;
}): string {
  switch (routine.visibility) {
    case Visibility.ALWAYS:
      return 'Always visible';

    case Visibility.DAYS_OF_WEEK:
      if (routine.visibleDays.length === 0) return 'Never visible';
      if (routine.visibleDays.length === 7) return 'Every day';

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayNames = routine.visibleDays.map((d) => days[d]).join(', ');

      // Check for weekdays (1-5) or weekends (0,6)
      const isWeekdays =
        routine.visibleDays.length === 5 &&
        routine.visibleDays.every((d) => d >= 1 && d <= 5);
      const isWeekends =
        routine.visibleDays.length === 2 &&
        routine.visibleDays.includes(0) &&
        routine.visibleDays.includes(6);

      if (isWeekdays) return 'Weekdays only';
      if (isWeekends) return 'Weekends only';

      return dayNames;

    case Visibility.DATE_RANGE:
      if (!routine.startDate || !routine.endDate) return 'Date range not set';

      const formatDate = (date: Date) =>
        `${date.getMonth() + 1}/${date.getDate()}`;

      return `${formatDate(routine.startDate)} - ${formatDate(routine.endDate)}`;

    case Visibility.CONDITIONAL:
      return 'Condition-based';

    default:
      return 'Unknown';
  }
}
