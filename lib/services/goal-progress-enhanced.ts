import { prisma } from '@/lib/prisma';
import { ResetPeriod, TaskType } from '@/lib/types/prisma-enums';
import { getResetPeriodStart } from './reset-period';
import { logger } from '@/lib/utils/logger';
import type { GoalProgress } from '@/lib/types/database';

const serviceLogger = logger;

interface GoalWithSimpleConfig {
  id: string;
  type: string;
  target: number;
  period: ResetPeriod;
  resetDay?: number | null;
  simpleCondition?: string | null;
  comparisonOperator?: string | null;
  comparisonValue?: number | null;
  taskLinks: Array<{
    task: {
      id: string;
      type: TaskType;
      targetValue?: number | null;
      completions: Array<{
        id: string;
        value?: string | null;
        completedAt: Date;
      }>;
      routine: {
        resetPeriod: ResetPeriod;
        resetDay?: number | null;
      };
    };
  }>;
  routineLinks: Array<{
    routine: {
      resetPeriod: ResetPeriod;
      resetDay?: number | null;
      tasks: Array<{
        completions: Array<{
          completedAt: Date;
        }>;
      }>;
    };
  }>;
}

/**
 * Enhanced goal progress calculation that supports simple goals with conditions
 */
export async function calculateGoalProgressEnhanced(
  goalId: string
): Promise<GoalProgress> {
  const goal = await prisma.goal.findUniqueOrThrow({
    where: { id: goalId },
    include: {
      taskLinks: {
        include: {
          task: {
            include: {
              completions: true,
              routine: true
            }
          }
        }
      },
      routineLinks: {
        include: {
          routine: {
            include: {
              tasks: {
                where: { status: 'ACTIVE' },
                include: { completions: true }
              }
            }
          }
        }
      }
    }
  }) as unknown as GoalWithSimpleConfig;

  // Check if this is a simple goal (single task with condition or comparison)
  const isSimpleGoal = goal.taskLinks.length === 1 &&
    (goal.simpleCondition || goal.comparisonOperator);

  if (isSimpleGoal) {
    return calculateSimpleGoalProgress(goal);
  }

  // For complex goals, use the original calculation logic
  return calculateComplexGoalProgress(goal);
}

/**
 * Calculate progress for simple goals with conditions
 */
function calculateSimpleGoalProgress(goal: GoalWithSimpleConfig): GoalProgress {
  const task = goal.taskLinks[0].task;
  const periodStart = getResetPeriodStart(
    task.routine.resetPeriod,
    task.routine.resetDay ?? undefined
  );

  const completions = task.completions.filter(
    (completion) => completion.completedAt >= periodStart
  );

  let current = 0;
  let percentage = 0;
  let achieved = false;

  if (task.type === TaskType.SIMPLE) {
    // Handle SIMPLE tasks with simpleCondition
    const isCompleted = completions.length > 0;

    if (goal.simpleCondition === 'complete') {
      // Goal is achieved when task IS completed
      current = isCompleted ? 1 : 0;
      percentage = isCompleted ? 100 : 0;
      achieved = isCompleted;
    } else if (goal.simpleCondition === 'not_complete') {
      // Goal is achieved when task IS NOT completed
      current = isCompleted ? 0 : 1;
      percentage = isCompleted ? 0 : 100;
      achieved = !isCompleted;
    }
  } else if (task.type === TaskType.MULTIPLE_CHECKIN || task.type === TaskType.PROGRESS) {
    // Handle MULTI/PROGRESS tasks with comparison
    let taskValue = 0;

    if (task.type === TaskType.MULTIPLE_CHECKIN) {
      taskValue = completions.length;
    } else if (task.type === TaskType.PROGRESS) {
      taskValue = completions.reduce((sum: number, completion) => {
        const value = parseFloat(completion.value || '0');
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    }

    // Calculate progress ratio based on comparisonValue
    if (goal.comparisonValue && goal.comparisonValue > 0) {
      percentage = Math.min(100, (taskValue / goal.comparisonValue) * 100);

      // Determine if goal is achieved based on operator
      if (goal.comparisonOperator === 'gte') {
        achieved = taskValue >= goal.comparisonValue;
      } else if (goal.comparisonOperator === 'lte') {
        achieved = taskValue <= goal.comparisonValue;
      }

      current = taskValue; // Use actual task value, not binary
    }
  }

  return {
    current,
    target: goal.comparisonValue || 1, // Use comparisonValue as target for MULTI/PROGRESS goals
    percentage,
    achieved
  };
}

/**
 * Calculate progress for complex goals (multiple tasks/routines)
 */
function calculateComplexGoalProgress(goal: GoalWithSimpleConfig): GoalProgress {
  const periodStart = getResetPeriodStart(goal.period, goal.resetDay ?? undefined);
  let current = 0;

  // Aggregate from linked tasks
  for (const taskLink of goal.taskLinks) {
    const task = taskLink.task;
    const completions = task.completions.filter(
      (completion) => completion.completedAt >= periodStart
    );

    if (task.type === TaskType.MULTIPLE_CHECKIN) {
      // Sum all check-ins in period
      current += completions.length;
    } else if (task.type === TaskType.PROGRESS) {
      // Sum all progress values in period
      current += completions.reduce((sum: number, completion) => {
        const value = parseFloat(completion.value || '0');
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    } else if (task.type === TaskType.SIMPLE || task.type === 'SMART') {
      // Binary: 1 if completed at least once, 0 otherwise
      current += completions.length > 0 ? 1 : 0;
    }
  }

  // Aggregate from linked routines
  for (const routineLink of goal.routineLinks) {
    const routine = routineLink.routine;
    const totalTasks = routine.tasks.length;

    if (totalTasks === 0) continue;

    // Get routine's reset period start (may differ from goal's period)
    const routinePeriodStart = getResetPeriodStart(
      routine.resetPeriod,
      routine.resetDay ?? undefined
    );

    // Count completed tasks in routine's period
    const completedTasks = routine.tasks.filter((task) => {
      return task.completions.some(
        (completion) => completion.completedAt >= routinePeriodStart
      );
    }).length;

    // Calculate routine completion percentage
    const completionPercent = (completedTasks / totalTasks) * 100;
    current += completionPercent;
  }

  const target = goal.target;
  const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const achieved = current >= target;

  return { current, target, percentage, achieved };
}

/**
 * Batch calculate enhanced progress for multiple goals
 */
export async function calculateGoalProgressBatchEnhanced(
  goalIds: string[]
): Promise<Map<string, GoalProgress>> {
  const results = new Map<string, GoalProgress>();

  if (goalIds.length === 0) {
    return results;
  }

  try {
    // Fetch all goals in one query to avoid N+1 problem
    const goals = await prisma.goal.findMany({
      where: {
        id: { in: goalIds },
      },
      include: {
        taskLinks: {
          include: {
            task: {
              include: {
                completions: true,
                routine: true,
              },
            },
          },
        },
        routineLinks: {
          include: {
            routine: {
              include: {
                tasks: {
                  where: { status: 'ACTIVE' },
                  include: { completions: true },
                },
              },
            },
          },
        },
      },
    });

    // Process each goal
    for (const goal of goals) {
      try {
        const typedGoal = goal as unknown as GoalWithSimpleConfig;

        // Check if this is a simple goal
        const isSimpleGoal = typedGoal.taskLinks.length === 1 &&
          (typedGoal.simpleCondition || typedGoal.comparisonOperator);

        let progress: GoalProgress;

        if (isSimpleGoal) {
          progress = calculateSimpleGoalProgress(typedGoal);
        } else {
          progress = calculateComplexGoalProgress(typedGoal);
        }

        results.set(goal.id, progress);
      } catch (error) {
        serviceLogger.error(`Failed to calculate progress for goal ${goal.id}`, error, {
          goalId: goal.id,
        });
      }
    }
  } catch (error) {
    serviceLogger.error('Failed to batch calculate goal progress', error, {
      goalIds,
    });
  }

  return results;
}