import { Tier, RoleType } from '@/lib/types/prisma-enums';
import { RoleType as PrismaRoleType } from '@prisma/client';
import { TRPCError } from '@trpc/server';

export type LimitKey =
  | 'children_per_family'
  | 'students_per_classroom'
  | 'routines_per_person'
  | 'tasks_per_routine'
  | 'smart_tasks_per_routine'
  | 'goals'
  | 'items_per_goal'
  | 'co_parents'
  | 'co_teachers';

// Database tier limits structure (from SystemSettings)
export interface DatabaseTierLimits {
  parent: {
    persons: number;
    maxCoParents: number;
    routines: number;
    smartRoutines: number;
    tasksPerRoutine: number;
    smartTasksPerRoutine: number;
    goals: number;
    kioskCodes: number;
  };
  teacher: {
    classrooms: number;
    studentsPerClassroom: number;
    maxCoTeachers: number;
    routines: number;
    smartRoutines: number;
    tasksPerRoutine: number;
    smartTasksPerRoutine: number;
    goals: number;
    kioskCodes: number;
  };
}

// Component-expected limits structure
export interface ComponentTierLimits {
  children_per_family: number;
  students_per_classroom: number;
  routines_per_person: number;
  tasks_per_routine: number;
  smart_tasks_per_routine: number;
  goals: number;
  items_per_goal: number;
  co_parents: number;
  co_teachers: number;
}

/**
 * Map database tier limits to component-expected format
 * @param dbLimits - Tier limits from database (SystemSettings or tierOverride)
 * @param roleType - PARENT or TEACHER
 */
export function mapDatabaseLimitsToComponentFormat(
  dbLimits: DatabaseTierLimits | null | undefined,
  roleType: RoleType | PrismaRoleType
): ComponentTierLimits | null {
  if (!dbLimits) return null;

  const modeLimits = roleType === 'PARENT' ? dbLimits.parent : dbLimits.teacher;

  return {
    children_per_family: (modeLimits as any).persons || 0,
    students_per_classroom: (modeLimits as any).studentsPerClassroom || 0,
    routines_per_person: modeLimits.routines || 0,
    tasks_per_routine: modeLimits.tasksPerRoutine || 0,
    smart_tasks_per_routine: modeLimits.smartTasksPerRoutine || 0,
    goals: modeLimits.goals || 0,
    items_per_goal: modeLimits.goals || 0, // Using goals as fallback for items_per_goal
    co_parents: (modeLimits as any).maxCoParents || 0,
    co_teachers: (modeLimits as any).maxCoTeachers || 0,
  };
}

/**
 * Get a specific tier limit value from component-formatted limits
 * @param limits - Component-formatted tier limits (from role.effectiveLimits)
 * @param limitKey - The limit key to retrieve
 */
export function getTierLimit(limits: ComponentTierLimits | null, limitKey: LimitKey): number {
  if (!limits) {
    // Fallback defaults if limits are not available
    const defaults: ComponentTierLimits = {
      children_per_family: 3,
      students_per_classroom: 24,
      routines_per_person: 2,
      tasks_per_routine: 5,
      smart_tasks_per_routine: 1,
      goals: 3,
      items_per_goal: 3,
      co_parents: 1,
      co_teachers: 1,
    };
    return defaults[limitKey];
  }

  return limits[limitKey];
}

/**
 * Check if a tier limit has been reached (throws error if exceeded)
 * @param limits - Component-formatted tier limits
 * @param limitKey - The limit key to check
 * @param currentCount - Current count of items
 */
export function checkTierLimit(
  limits: ComponentTierLimits | null,
  limitKey: LimitKey,
  currentCount: number
): void {
  const limit = getTierLimit(limits, limitKey);

  if (currentCount >= limit) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Tier limit reached: ${limitKey} (${limit} max)`,
    });
  }
}

/**
 * Check if more items can be added
 * @param limits - Component-formatted tier limits
 * @param limitKey - The limit key to check
 * @param currentCount - Current count of items
 */
export function canAddMore(
  limits: ComponentTierLimits | null,
  limitKey: LimitKey,
  currentCount: number
): boolean {
  const limit = getTierLimit(limits, limitKey);
  return currentCount < limit;
}
