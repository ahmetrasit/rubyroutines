/**
 * Formatting Utility Functions
 *
 * Centralized formatting utilities for dates, numbers, and enums.
 */

import { ResetPeriod, Visibility, TaskType, RoutineType } from '@/lib/types/prisma-enums';

/**
 * Format reset period to human-readable string
 *
 * @param period - Reset period enum value
 * @param resetDay - Optional reset day for WEEKLY/MONTHLY
 * @returns Formatted string
 */
export function formatResetPeriod(
  period: ResetPeriod,
  resetDay?: number | null
): string {
  switch (period) {
    case ResetPeriod.DAILY:
      return 'Daily';
    case ResetPeriod.WEEKLY:
      if (resetDay !== null && resetDay !== undefined) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly (${days[resetDay]})`;
      }
      return 'Weekly';
    case ResetPeriod.MONTHLY:
      if (resetDay !== null && resetDay !== undefined) {
        return `Monthly (Day ${resetDay})`;
      }
      return 'Monthly';
    case ResetPeriod.CUSTOM:
      return 'Custom';
    default:
      return 'Unknown';
  }
}

/**
 * Format date to readable string
 *
 * @param date - Date to format
 * @param format - Format type ('short', 'long', 'time')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'time' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    case 'time':
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    default:
      return d.toLocaleDateString();
  }
}

/**
 * Format date and time to readable string
 *
 * @param date - Date to format
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 *
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(d, 'short');
  }
}

/**
 * Format visibility to human-readable string
 *
 * @param visibility - Visibility enum value
 * @returns Formatted string
 */
export function formatVisibility(visibility: Visibility): string {
  switch (visibility) {
    case Visibility.ALWAYS:
      return 'Always Visible';
    case Visibility.DATE_RANGE:
      return 'Date Range';
    case Visibility.DAYS_OF_WEEK:
      return 'Specific Days';
    case Visibility.CONDITIONAL:
      return 'Conditional';
    default:
      return 'Unknown';
  }
}

/**
 * Format task type to human-readable string
 *
 * @param taskType - Task type enum value
 * @returns Formatted string
 */
export function formatTaskType(taskType: TaskType): string {
  switch (taskType) {
    case TaskType.SIMPLE:
      return 'Simple';
    case TaskType.MULTIPLE_CHECKIN:
      return 'Multiple Check-in';
    case TaskType.PROGRESS:
      return 'Progress Tracker';
    case TaskType.SMART:
      return 'Smart Task';
    default:
      return 'Unknown';
  }
}

/**
 * Format routine type to human-readable string
 *
 * @param routineType - Routine type enum value
 * @returns Formatted string
 */
export function formatRoutineType(routineType: RoutineType): string {
  switch (routineType) {
    case RoutineType.REGULAR:
      return 'Regular';
    case RoutineType.SMART:
      return 'Smart Routine';
    case RoutineType.TEACHER_CLASSROOM:
      return 'Classroom';
    default:
      return 'Unknown';
  }
}

/**
 * Format number with commas
 *
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format percentage
 *
 * @param value - Current value
 * @param total - Total value
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  total: number,
  decimals: number = 0
): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format days of week array to readable string
 *
 * @param days - Array of day numbers (0=Sunday, 6=Saturday)
 * @returns Formatted string
 */
export function formatDaysOfWeek(days: number[]): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.map(d => dayNames[d]).join(', ');
}

/**
 * Truncate text with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Pluralize a word based on count
 *
 * @param count - Number of items
 * @param singular - Singular form
 * @param plural - Plural form (optional, defaults to singular + 's')
 * @returns Pluralized word
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}
