import { prisma } from '@/lib/prisma';
import { ResetPeriod } from '@/lib/types/prisma-enums';
import { getResetPeriodStart } from './reset-period';
import { logger } from '@/lib/utils/logger';
import type { GoalProgress } from '@/lib/types/database';

const serviceLogger = logger;

/**
 * Calculate goal progress based on linked tasks and routines
 */
export async function calculateGoalProgress(goalId: string): Promise<GoalProgress> {
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
  });

  const periodStart = getResetPeriodStart(goal.period, goal.resetDay ?? undefined);
  let current = 0;

  // Aggregate from linked tasks
  for (const taskLink of goal.taskLinks) {
    const task = taskLink.task;
    const completions = task.completions.filter(
      (completion) => completion.completedAt >= periodStart
    );

    if (task.type === 'MULTIPLE_CHECKIN') {
      // Sum all check-ins in period
      current += completions.length;
    } else if (task.type === 'PROGRESS') {
      // Sum all progress values in period
      current += completions.reduce((sum: number, completion) => {
        const value = parseFloat(completion.value || '0');
        return sum + (isNaN(value) ? 0 : value);
      }, 0);
    } else if (task.type === 'SIMPLE' || task.type === 'SMART') {
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
 * Batch calculate progress for multiple goals (performance optimization)
 * Reduces N+1 query problem by fetching all goals at once
 */
export async function calculateGoalProgressBatch(
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
        const periodStart = getResetPeriodStart(
          goal.period,
          goal.resetDay ?? undefined
        );
        let current = 0;

        // Aggregate from linked tasks
        for (const taskLink of goal.taskLinks) {
          const task = taskLink.task;
          const completions = task.completions.filter(
            (completion) => completion.completedAt >= periodStart
          );

          if (task.type === 'MULTIPLE_CHECKIN') {
            current += completions.length;
          } else if (task.type === 'PROGRESS') {
            current += completions.reduce((sum: number, completion) => {
              const value = parseFloat(completion.value || '0');
              return sum + (isNaN(value) ? 0 : value);
            }, 0);
          } else if (task.type === 'SIMPLE' || task.type === 'SMART') {
            current += completions.length > 0 ? 1 : 0;
          }
        }

        // Aggregate from linked routines
        for (const routineLink of goal.routineLinks) {
          const routine = routineLink.routine;
          const totalTasks = routine.tasks.length;

          if (totalTasks === 0) continue;

          const routinePeriodStart = getResetPeriodStart(
            routine.resetPeriod,
            routine.resetDay ?? undefined
          );

          const completedTasks = routine.tasks.filter((task) => {
            return task.completions.some(
              (completion) => completion.completedAt >= routinePeriodStart
            );
          }).length;

          const completionPercent = (completedTasks / totalTasks) * 100;
          current += completionPercent;
        }

        const target = goal.target;
        const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
        const achieved = current >= target;

        results.set(goal.id, { current, target, percentage, achieved });
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
