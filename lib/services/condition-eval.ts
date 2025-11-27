import { prisma } from '@/lib/prisma';
import { ConditionType, ConditionOperator } from '@/lib/types/prisma-enums';
import { getResetPeriodStart } from './reset-period';
import { calculateGoalProgress } from './goal-progress';

export interface ConditionEvaluationResult {
  met: boolean;
  reason?: string;
}

/**
 * Evaluate all conditions for a smart routine
 * Returns true if ALL conditions are met (AND logic)
 */
export async function evaluateRoutineConditions(
  routineId: string,
  personId?: string
): Promise<boolean> {
  const conditions = await prisma.condition.findMany({
    where: { routineId },
    include: {
      checks: {
        include: {
          targetTask: {
            include: {
              routine: true,
              completions: personId ? {
                where: { personId }
              } : undefined
            }
          },
          targetRoutine: {
            include: {
              tasks: {
                where: { status: 'ACTIVE' },
                include: {
                  completions: personId ? {
                    where: { personId }
                  } : undefined
                }
              }
            }
          }
        }
      }
    }
  });

  if (conditions.length === 0) {
    return true; // No conditions means always visible
  }

  // Evaluate each condition
  const results = await Promise.all(
    conditions.map((condition: any) => evaluateCondition(condition, personId))
  );

  // AND logic: all conditions must be met
  return results.every((result: ConditionEvaluationResult) => result.met);
}

/**
 * Evaluate a single condition
 */
export async function evaluateCondition(
  condition: any,
  personId?: string
): Promise<ConditionEvaluationResult> {
  try {
    switch (condition.type) {
      case ConditionType.TASK_COMPLETED:
        return evaluateTaskCompletedCondition(condition, personId);

      case ConditionType.TASK_COUNT:
        return evaluateTaskCountCondition(condition, personId);

      case ConditionType.ROUTINE_COMPLETED:
        return evaluateRoutineCompletedCondition(condition, personId);

      case ConditionType.GOAL_ACHIEVED:
        return evaluateGoalAchievedCondition(condition);

      case ConditionType.DATE_RANGE:
        return evaluateDateRangeCondition(condition);

      case ConditionType.DAY_OF_WEEK:
        return evaluateDayOfWeekCondition(condition);

      default:
        return { met: false, reason: 'Unknown condition type' };
    }
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return { met: false, reason: 'Evaluation error' };
  }
}

/**
 * Evaluate TASK_COMPLETED condition
 */
async function evaluateTaskCompletedCondition(
  condition: any,
  personId?: string
): Promise<ConditionEvaluationResult> {
  if (!condition.targetTask) {
    return { met: false, reason: 'Target task not found' };
  }

  const task = condition.targetTask;
  const routine = task.routine;

  // Get reset period start for the task's routine
  const periodStart = getResetPeriodStart(routine.resetPeriod, routine.resetDay ?? undefined);

  // Filter completions by person and period
  const completions = task.completions.filter((c: any) => {
    const inPeriod = c.completedAt >= periodStart;
    const matchesPerson = !personId || c.personId === personId;
    return inPeriod && matchesPerson;
  });

  const isCompleted = completions.length > 0;

  switch (condition.operator) {
    case ConditionOperator.EQUALS:
      // For TASK_COMPLETED, EQUALS means "is completed"
      return { met: isCompleted };

    default:
      return { met: isCompleted };
  }
}

/**
 * Evaluate TASK_COUNT condition
 */
async function evaluateTaskCountCondition(
  condition: any,
  personId?: string
): Promise<ConditionEvaluationResult> {
  if (!condition.targetTask) {
    return { met: false, reason: 'Target task not found' };
  }

  const task = condition.targetTask;
  const routine = task.routine;

  // Get reset period start for the task's routine
  const periodStart = getResetPeriodStart(routine.resetPeriod, routine.resetDay ?? undefined);

  // Filter completions by person and period
  const completions = task.completions.filter((c: any) => {
    const inPeriod = c.completedAt >= periodStart;
    const matchesPerson = !personId || c.personId === personId;
    return inPeriod && matchesPerson;
  });

  const count = completions.length;
  const targetValue = parseFloat(condition.value || '0');

  switch (condition.operator) {
    case ConditionOperator.EQUALS:
      return { met: count === targetValue };

    case ConditionOperator.GREATER_THAN:
      return { met: count > targetValue };

    case ConditionOperator.LESS_THAN:
      return { met: count < targetValue };

    case ConditionOperator.GREATER_THAN_OR_EQUAL:
      return { met: count >= targetValue };

    case ConditionOperator.LESS_THAN_OR_EQUAL:
      return { met: count <= targetValue };

    default:
      return { met: false, reason: 'Invalid operator for TASK_COUNT' };
  }
}

/**
 * Evaluate ROUTINE_COMPLETED condition
 */
async function evaluateRoutineCompletedCondition(
  condition: any,
  personId?: string
): Promise<ConditionEvaluationResult> {
  if (!condition.targetRoutine) {
    return { met: false, reason: 'Target routine not found' };
  }

  const routine = condition.targetRoutine;
  const tasks = routine.tasks;

  if (tasks.length === 0) {
    return { met: true }; // Empty routine is considered 100% complete
  }

  // Get reset period start for the routine
  const periodStart = getResetPeriodStart(routine.resetPeriod, routine.resetDay ?? undefined);

  // Count completed tasks
  const completedTasks = tasks.filter((task: any) => {
    return task.completions.some((c: any) => {
      const inPeriod = c.completedAt >= periodStart;
      const matchesPerson = !personId || c.personId === personId;
      return inPeriod && matchesPerson;
    });
  }).length;

  const completionPercent = (completedTasks / tasks.length) * 100;
  const targetPercent = parseFloat(condition.value || '100');

  switch (condition.operator) {
    case ConditionOperator.EQUALS:
      return { met: completionPercent === targetPercent };

    case ConditionOperator.GREATER_THAN:
      return { met: completionPercent > targetPercent };

    case ConditionOperator.LESS_THAN:
      return { met: completionPercent < targetPercent };

    case ConditionOperator.GREATER_THAN_OR_EQUAL:
      return { met: completionPercent >= targetPercent };

    case ConditionOperator.LESS_THAN_OR_EQUAL:
      return { met: completionPercent <= targetPercent };

    default:
      return { met: false, reason: 'Invalid operator for ROUTINE_COMPLETED' };
  }
}

/**
 * Evaluate GOAL_ACHIEVED condition
 */
async function evaluateGoalAchievedCondition(
  condition: any
): Promise<ConditionEvaluationResult> {
  const goalId = condition.value;

  if (!goalId) {
    return { met: false, reason: 'Goal ID not specified' };
  }

  try {
    const progress = await calculateGoalProgress(goalId);

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        // For GOAL_ACHIEVED, EQUALS means "is achieved"
        return { met: progress.achieved };

      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        const targetPercent = parseFloat(condition.value || '100');
        return { met: progress.percentage >= targetPercent };

      default:
        return { met: progress.achieved };
    }
  } catch (error) {
    return { met: false, reason: 'Goal not found' };
  }
}

/**
 * Evaluate DATE_RANGE condition
 */
function evaluateDateRangeCondition(
  condition: any
): ConditionEvaluationResult {
  // Parse start and end dates from condition.value
  // Expected format: "startDate,endDate" in ISO format
  const [startStr, endStr] = (condition.value || '').split(',');

  if (!startStr || !endStr) {
    return { met: false, reason: 'Invalid date range format' };
  }

  const now = new Date();
  const startDate = new Date(startStr);
  const endDate = new Date(endStr);

  const isInRange = now >= startDate && now <= endDate;

  return { met: isInRange };
}

/**
 * Evaluate DAY_OF_WEEK condition
 */
function evaluateDayOfWeekCondition(
  condition: any
): ConditionEvaluationResult {
  // Parse days from condition.value
  // Expected format: "0,1,2" (comma-separated day numbers)
  const daysStr = condition.value || '';
  const days = daysStr.split(',').map((d: string) => parseInt(d, 10)).filter((d: number) => !isNaN(d));

  if (days.length === 0) {
    return { met: false, reason: 'No days specified' };
  }

  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday

  const isMatchingDay = days.includes(today);

  return { met: isMatchingDay };
}

/**
 * Get all smart routines that should be visible for a person
 */
export async function getVisibleSmartRoutines(
  roleId: string,
  personId?: string
): Promise<string[]> {
  const smartRoutines = await prisma.routine.findMany({
    where: {
      roleId,
      type: 'SMART',
      status: 'ACTIVE'
    }
  });

  const visibleRoutineIds: string[] = [];

  await Promise.all(
    smartRoutines.map(async (routine: any) => {
      const isVisible = await evaluateRoutineConditions(routine.id, personId);
      if (isVisible) {
        visibleRoutineIds.push(routine.id);
      }
    })
  );

  return visibleRoutineIds;
}
