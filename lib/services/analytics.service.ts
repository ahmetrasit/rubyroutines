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

/**
 * Get goal achievement rate and statistics
 */
export async function getGoalAchievementRate(
  roleId: string,
  personId: string | null,
  groupId: string | null,
  period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'WEEK':
      startDate = subDays(now, 7);
      break;
    case 'MONTH':
      startDate = subDays(now, 30);
      break;
    case 'QUARTER':
      startDate = subDays(now, 90);
      break;
    case 'YEAR':
      startDate = subDays(now, 365);
      break;
  }

  // Get all goals for the role
  const goals = await prisma.goal.findMany({
    where: {
      roleId,
      status: 'ACTIVE',
      ...(personId && {
        OR: [
          { personIds: { has: personId } },
          { scope: 'ROLE' }
        ]
      }),
      ...(groupId && {
        OR: [
          { groupIds: { has: groupId } },
          { scope: 'GROUP' }
        ]
      })
    },
    include: {
      achievements: {
        where: {
          achievedAt: { gte: startDate },
          ...(personId && { personId })
        }
      }
    }
  });

  const totalGoals = goals.length;
  const achievedGoals = goals.filter(g => g.achievements.length > 0).length;
  const achievementRate = totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : 0;

  // Calculate active streaks
  const activeStreaks = goals.filter(g => g.streakEnabled && g.currentStreak > 0).length;

  // Calculate average progress
  const progressValues = await Promise.all(
    goals.map(async (goal) => {
      const progress = await getGoalProgress(roleId, personId);
      const goalProgress = progress.find(p => p.goalId === goal.id);
      return goalProgress?.percentage || 0;
    })
  );

  const averageProgress = progressValues.length > 0
    ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
    : 0;

  // Determine trend (compare with previous period)
  const prevStartDate = subDays(startDate, period === 'WEEK' ? 7 : period === 'MONTH' ? 30 : period === 'QUARTER' ? 90 : 365);
  const prevGoals = await prisma.goal.findMany({
    where: {
      roleId,
      status: 'ACTIVE',
      createdAt: { lte: startDate }
    },
    include: {
      achievements: {
        where: {
          achievedAt: { gte: prevStartDate, lt: startDate },
          ...(personId && { personId })
        }
      }
    }
  });

  const prevAchieved = prevGoals.filter(g => g.achievements.length > 0).length;
  const prevRate = prevGoals.length > 0 ? (prevAchieved / prevGoals.length) * 100 : 0;
  const trend = achievementRate > prevRate ? 'up' : achievementRate < prevRate ? 'down' : 'stable';

  return {
    totalGoals,
    achievedGoals,
    achievementRate,
    activeStreaks,
    averageProgress,
    trend
  };
}

/**
 * Get goal type distribution
 */
export async function getGoalTypeDistribution(
  roleId: string,
  personId: string | null,
  groupId: string | null
) {
  const goals = await prisma.goal.findMany({
    where: {
      roleId,
      status: 'ACTIVE',
      ...(personId && {
        OR: [
          { personIds: { has: personId } },
          { scope: 'ROLE' }
        ]
      }),
      ...(groupId && {
        OR: [
          { groupIds: { has: groupId } },
          { scope: 'GROUP' }
        ]
      })
    },
    select: {
      type: true
    }
  });

  const distribution = goals.reduce((acc, goal) => {
    acc[goal.type] = (acc[goal.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return distribution;
}

/**
 * Get streak leaderboard
 */
export async function getStreakLeaderboard(roleId: string, limit: number = 10) {
  const goals = await prisma.goal.findMany({
    where: {
      roleId,
      status: 'ACTIVE',
      streakEnabled: true,
      currentStreak: { gt: 0 }
    },
    orderBy: {
      currentStreak: 'desc'
    },
    take: limit,
    include: {
      role: {
        include: {
          user: true
        }
      }
    }
  });

  // Get person names for individual goals
  const leaderboard = await Promise.all(
    goals.map(async (goal) => {
      let personName = goal.role.user.email || 'Unknown';
      let personId = null;

      if (goal.personIds.length > 0) {
        const person = await prisma.person.findFirst({
          where: { id: goal.personIds[0] }
        });
        if (person) {
          personName = person.name;
          personId = person.id;
        }
      }

      return {
        id: goal.id,
        name: personName,
        personId,
        goalName: goal.name,
        currentStreak: goal.currentStreak,
        longestStreak: goal.longestStreak
      };
    })
  );

  return leaderboard;
}

/**
 * Get goal trends over time
 */
export async function getGoalTrends(
  roleId: string,
  personId: string | null,
  groupId: string | null,
  period: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'
) {
  const now = new Date();
  let days: number;

  switch (period) {
    case 'WEEK':
      days = 7;
      break;
    case 'MONTH':
      days = 30;
      break;
    case 'QUARTER':
      days = 90;
      break;
    case 'YEAR':
      days = 365;
      break;
  }

  const startDate = subDays(now, days);
  const dateRange = eachDayOfInterval({ start: startDate, end: now });

  // Get goals and their completions
  const goals = await prisma.goal.findMany({
    where: {
      roleId,
      status: 'ACTIVE',
      ...(personId && {
        OR: [
          { personIds: { has: personId } },
          { scope: 'ROLE' }
        ]
      }),
      ...(groupId && {
        OR: [
          { groupIds: { has: groupId } },
          { scope: 'GROUP' }
        ]
      })
    },
    include: {
      taskLinks: {
        include: {
          task: {
            include: {
              completions: {
                where: {
                  completedAt: { gte: startDate },
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
                      completedAt: { gte: startDate },
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

  // Aggregate data by day
  const trends = dateRange.map((date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    let completed = 0;
    let target = 0;

    goals.forEach((goal) => {
      target += goal.target;

      // Count task completions for this day
      goal.taskLinks.forEach((link) => {
        const dayCompletions = link.task.completions.filter((c) => {
          const completedDate = new Date(c.completedAt);
          return completedDate >= dayStart && completedDate <= dayEnd;
        });
        completed += dayCompletions.length;
      });

      // Count routine task completions for this day
      goal.routineLinks.forEach((link) => {
        link.routine.tasks.forEach((task) => {
          const dayCompletions = task.completions.filter((c) => {
            const completedDate = new Date(c.completedAt);
            return completedDate >= dayStart && completedDate <= dayEnd;
          });
          completed += dayCompletions.length;
        });
      });
    });

    return {
      date: format(date, 'yyyy-MM-dd'),
      completed,
      target,
      rate: target > 0 ? Math.round((completed / target) * 100) : 0
    };
  });

  return trends;
}
