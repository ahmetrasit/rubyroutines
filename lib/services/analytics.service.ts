import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from 'date-fns';

export interface CompletionTrendData {
  date: string;
  completions: number;
  totalTasks: number;
  completionRate: number;
}

export interface GoalProgressData {
  goalId: string;
  goalName: string;
  current: number;
  target: number;
  percentage: number;
  status: 'not_started' | 'in_progress' | 'achieved';
}

export interface TaskHeatmapData {
  taskId: string;
  taskName: string;
  routineName: string;
  completions: {
    date: string;
    count: number;
  }[];
}

/**
 * Get completion trend for date range
 */
export async function getCompletionTrend(
  roleId: string,
  personId: string | null,
  startDate: Date,
  endDate: Date
): Promise<CompletionTrendData[]> {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const data = await Promise.all(
    days.map(async (day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      // Get completions for the day
      const completions = await prisma.taskCompletion.count({
        where: {
          completedAt: {
            gte: dayStart,
            lte: dayEnd
          },
          ...(personId && { personId }),
          task: {
            routine: { roleId }
          }
        }
      });

      // Get total tasks assigned for the day
      const totalTasks = await prisma.task.count({
        where: {
          status: 'ACTIVE',
          routine: {
            roleId,
            status: 'ACTIVE',
            ...(personId && {
              assignments: {
                some: { personId }
              }
            })
          }
        }
      });

      const completionRate = totalTasks > 0 ? (completions / totalTasks) * 100 : 0;

      return {
        date: format(day, 'yyyy-MM-dd'),
        completions,
        totalTasks,
        completionRate: Math.round(completionRate * 100) / 100
      };
    })
  );

  return data;
}

/**
 * Get goal progress for all active goals
 */
export async function getGoalProgress(
  roleId: string,
  personId: string | null
): Promise<GoalProgressData[]> {
  const goals = await prisma.goal.findMany({
    where: {
      roleId,
      status: 'ACTIVE',
      ...(personId && {
        personId
      })
    },
    include: {
      taskLinks: {
        include: {
          task: {
            include: {
              completions: {
                where: {
                  ...(personId && { personId })
                }
              }
            }
          }
        }
      },
      routineLinks: {
        include: {
          routine: {
            include: {
              tasks: {
                include: {
                  completions: {
                    where: {
                      ...(personId && { personId })
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return goals.map((goal) => {
    let current = 0;

    // Aggregate from task links
    for (const link of goal.taskLinks) {
      const completions = link.task.completions;
      if (link.task.type === 'MULTIPLE_CHECKIN') {
        current += completions.length;
      } else if (link.task.type === 'PROGRESS') {
        current += completions.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
      } else {
        current += completions.length > 0 ? 1 : 0;
      }
    }

    // Aggregate from routine links
    for (const link of goal.routineLinks) {
      const routine = link.routine;
      const totalTasks = routine.tasks.length;
      const completedTasks = routine.tasks.filter((t) => t.completions.length > 0).length;
      current += totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    }

    const target = Number(goal.target);
    const percentage = target > 0 ? (current / target) * 100 : 0;
    const status = current === 0 ? 'not_started' : current >= target ? 'achieved' : 'in_progress';

    return {
      goalId: goal.id,
      goalName: goal.name,
      current: Math.round(current * 100) / 100,
      target,
      percentage: Math.round(percentage * 100) / 100,
      status
    };
  });
}

/**
 * Get task heatmap (completion frequency by task)
 */
export async function getTaskHeatmap(
  roleId: string,
  personId: string | null,
  startDate: Date,
  endDate: Date
): Promise<TaskHeatmapData[]> {
  const tasks = await prisma.task.findMany({
    where: {
      status: 'ACTIVE',
      routine: {
        roleId,
        status: 'ACTIVE',
        ...(personId && {
          assignments: {
            some: { personId }
          }
        })
      }
    },
    include: {
      routine: true,
      completions: {
        where: {
          completedAt: {
            gte: startDate,
            lte: endDate
          },
          ...(personId && { personId })
        }
      }
    }
  });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return tasks.map((task) => {
    const completionsByDate = days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const count = task.completions.filter(
        (c) => c.completedAt >= dayStart && c.completedAt <= dayEnd
      ).length;

      return {
        date: format(day, 'yyyy-MM-dd'),
        count
      };
    });

    return {
      taskId: task.id,
      taskName: task.name,
      routineName: task.routine.name,
      completions: completionsByDate
    };
  });
}

/**
 * Export analytics data as CSV
 */
export async function exportAnalyticsCSV(
  roleId: string,
  personId: string | null,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const completionTrend = await getCompletionTrend(roleId, personId, startDate, endDate);

  const headers = ['Date', 'Completions', 'Total Tasks', 'Completion Rate (%)'];
  const rows = completionTrend.map((d) => [
    d.date,
    d.completions.toString(),
    d.totalTasks.toString(),
    d.completionRate.toString()
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return csv;
}
