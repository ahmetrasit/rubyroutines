/**
 * Condition Evaluator Service
 * Evaluates conditions for smart tasks and smart routines
 */

import { ConditionLogic, ConditionOperator } from '@/lib/types/prisma-enums';
import { getResetPeriodStart } from './reset-period';
import type { PrismaClient } from '@prisma/client';

export interface ConditionEvaluation {
  conditionId: string;
  result: boolean;
  checks: {
    checkId: string;
    operator: ConditionOperator;
    result: boolean;
    negate: boolean;
    finalResult: boolean;
  }[];
}

/**
 * Evaluate a condition for a specific person
 */
export async function evaluateCondition(
  prisma: PrismaClient,
  conditionId: string,
  personId: string
): Promise<ConditionEvaluation> {
  // Fetch condition with all checks
  const condition = await prisma.condition.findUnique({
    where: { id: conditionId },
    include: {
      checks: {
        include: {
          targetTask: {
            include: {
              routine: true,
            },
          },
          targetRoutine: true,
          targetGoal: true,
        },
      },
      routine: true,
    },
  });

  if (!condition) {
    throw new Error(`Condition ${conditionId} not found`);
  }

  // Evaluate each check
  const checkResults = await Promise.all(
    condition.checks.map(async (check) => {
      let checkResult = false;

      // Evaluate based on operator
      if (check.targetTaskId && check.targetTask) {
        checkResult = await evaluateTaskCheck(prisma, check, personId);
      } else if (check.targetRoutineId && check.targetRoutine) {
        checkResult = await evaluateRoutineCheck(prisma, check, personId);
      } else if (check.targetGoalId && check.targetGoal) {
        checkResult = await evaluateGoalCheck(prisma, check, personId);
      }

      // Apply negation
      const finalResult = check.negate ? !checkResult : checkResult;

      return {
        checkId: check.id,
        operator: check.operator,
        result: checkResult,
        negate: check.negate,
        finalResult,
      };
    })
  );

  // Apply logic (AND/OR)
  let result: boolean;
  if (condition.logic === ConditionLogic.AND) {
    result = checkResults.every((r) => r.finalResult);
  } else {
    // OR logic
    result = checkResults.some((r) => r.finalResult);
  }

  return {
    conditionId,
    result,
    checks: checkResults,
  };
}

/**
 * Evaluate task-based check
 */
async function evaluateTaskCheck(
  prisma: PrismaClient,
  check: any,
  personId: string
): Promise<boolean> {
  const task = check.targetTask;
  const routine = task.routine;

  // Get reset period start
  const periodStart = getResetPeriodStart(routine.resetPeriod, routine.resetDay);

  // Get completions for this task and person in current period
  const completions = await prisma.taskCompletion.findMany({
    where: {
      taskId: task.id,
      personId,
      completedAt: {
        gte: periodStart,
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
  });

  const completionCount = completions.length;
  const hasCompletion = completionCount > 0;

  switch (check.operator) {
    case ConditionOperator.TASK_COMPLETED:
      return hasCompletion;

    case ConditionOperator.TASK_NOT_COMPLETED:
      return !hasCompletion;

    case ConditionOperator.TASK_COUNT_EQUALS:
      return completionCount === parseInt(check.value || '0', 10);

    case ConditionOperator.TASK_COUNT_GT:
      return completionCount > parseInt(check.value || '0', 10);

    case ConditionOperator.TASK_COUNT_LT:
      return completionCount < parseInt(check.value || '0', 10);

    case ConditionOperator.TASK_VALUE_EQUALS: {
      if (!hasCompletion) return false;
      const latestValue = parseFloat(completions[0].value || '0');
      return latestValue === parseFloat(check.value || '0');
    }

    case ConditionOperator.TASK_VALUE_GT: {
      if (!hasCompletion) return false;
      const latestValue = parseFloat(completions[0].value || '0');
      return latestValue > parseFloat(check.value || '0');
    }

    case ConditionOperator.TASK_VALUE_LT: {
      if (!hasCompletion) return false;
      const latestValue = parseFloat(completions[0].value || '0');
      return latestValue < parseFloat(check.value || '0');
    }

    default:
      return false;
  }
}

/**
 * Evaluate routine-based check
 */
async function evaluateRoutineCheck(
  prisma: PrismaClient,
  check: any,
  personId: string
): Promise<boolean> {
  const routine = check.targetRoutine;

  // Get all tasks in routine
  const tasks = await prisma.task.findMany({
    where: {
      routineId: routine.id,
      status: 'ACTIVE',
    },
    include: {
      completions: {
        where: {
          personId,
          completedAt: {
            gte: getResetPeriodStart(routine.resetPeriod, routine.resetDay),
          },
        },
      },
    },
  });

  const totalTasks = tasks.length;
  if (totalTasks === 0) return false;

  const completedTasks = tasks.filter((t) => t.completions.length > 0).length;
  const completionPercent = (completedTasks / totalTasks) * 100;

  const targetPercent = parseFloat(check.value || '0');

  switch (check.operator) {
    case ConditionOperator.ROUTINE_PERCENT_EQUALS:
      return Math.abs(completionPercent - targetPercent) < 0.01;

    case ConditionOperator.ROUTINE_PERCENT_GT:
      return completionPercent > targetPercent;

    case ConditionOperator.ROUTINE_PERCENT_LT:
      return completionPercent < targetPercent;

    default:
      return false;
  }
}

/**
 * Evaluate goal-based check
 */
async function evaluateGoalCheck(
  prisma: PrismaClient,
  check: any,
  personId: string
): Promise<boolean> {
  const goal = check.targetGoal;

  // Get goal progress (simplified - you may have a separate service for this)
  const periodStart = getResetPeriodStart(goal.period, goal.resetDay);

  // Get all task links for this goal
  const taskLinks = await prisma.goalTaskLink.findMany({
    where: { goalId: goal.id },
    include: {
      task: {
        include: {
          routine: true,
          completions: {
            where: {
              personId,
              completedAt: {
                gte: periodStart,
              },
            },
          },
        },
      },
    },
  });

  // Calculate current progress
  let current = 0;
  for (const link of taskLinks) {
    const task = link.task;
    const completionCount = task.completions.length;

    if (task.type === 'SIMPLE') {
      current += completionCount > 0 ? link.weight : 0;
    } else if (task.type === 'MULTIPLE_CHECKIN') {
      current += completionCount * link.weight;
    } else if (task.type === 'PROGRESS') {
      const totalValue = task.completions.reduce(
        (sum, c) => sum + parseFloat(c.value || '0'),
        0
      );
      current += totalValue * link.weight;
    }
  }

  const achieved = current >= goal.target;

  switch (check.operator) {
    case ConditionOperator.GOAL_ACHIEVED:
      return achieved;

    case ConditionOperator.GOAL_NOT_ACHIEVED:
      return !achieved;

    default:
      return false;
  }
}

/**
 * Check if a task should be visible based on its condition
 */
export async function isTaskVisible(
  prisma: PrismaClient,
  taskId: string,
  personId: string
): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) return false;

  // Regular tasks are always visible
  if (!task.isSmart || !task.conditionId) return true;

  // Smart tasks visibility depends on condition evaluation
  const evaluation = await evaluateCondition(prisma, task.conditionId, personId);
  return evaluation.result;
}

/**
 * Check if a smart routine should be visible based on its conditions
 */
export async function isSmartRoutineVisible(
  prisma: PrismaClient,
  routineId: string,
  personId: string
): Promise<boolean> {
  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    include: {
      conditions: {
        where: {
          controlsRoutine: true,
        },
      },
    },
  });

  if (!routine) return false;

  // Regular routines are always visible
  if (routine.type !== 'SMART') return true;

  // If no conditions, show the routine
  if (routine.conditions.length === 0) return true;

  // Evaluate all routine-controlling conditions
  // All conditions must pass for routine to be visible
  const evaluations = await Promise.all(
    routine.conditions.map((c) => evaluateCondition(prisma, c.id, personId))
  );

  return evaluations.every((e) => e.result);
}

/**
 * Get all visible tasks for a routine and person
 */
export async function getVisibleTasks(
  prisma: PrismaClient,
  routineId: string,
  personId: string
) {
  const tasks = await prisma.task.findMany({
    where: {
      routineId,
      status: 'ACTIVE',
    },
    orderBy: {
      order: 'asc',
    },
  });

  // Filter by visibility
  const visibleTasks = await Promise.all(
    tasks.map(async (task) => ({
      task,
      visible: await isTaskVisible(prisma, task.id, personId),
    }))
  );

  return visibleTasks.filter((t) => t.visible).map((t) => t.task);
}
