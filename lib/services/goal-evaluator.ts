import { PrismaClient, ResetPeriod } from '@prisma/client';

/**
 * Goal Evaluator Service - Phase 1
 * Handles goal progress calculation and evaluation for basic goal types
 */

interface GoalEvaluation {
  goalId: string;
  personId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  achieved: boolean;
  periodStart: Date;
  periodEnd: Date;
  streak?: number;
}

interface BatchEvaluationResult {
  evaluations: Map<string, GoalEvaluation>;
  failures: { goalId: string; error: string }[];
}

interface PeriodBounds {
  start: Date;
  end: Date;
}

export class GoalEvaluator {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get period boundaries based on reset period
   */
  getPeriodBounds(period: ResetPeriod, resetDay?: number | null): PeriodBounds {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case ResetPeriod.DAILY:
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      case ResetPeriod.WEEKLY:
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start = new Date(now);
        start.setDate(now.getDate() + daysToMonday);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;

      case ResetPeriod.MONTHLY:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case ResetPeriod.CUSTOM:
        // Custom period with resetDay as number of days
        const days = resetDay || 30;
        start = new Date(now);
        start.setDate(now.getDate() - days + 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      default:
        // Default to weekly
        const defaultDayOfWeek = now.getDay();
        const defaultDaysToMonday = defaultDayOfWeek === 0 ? -6 : 1 - defaultDayOfWeek;
        start = new Date(now);
        start.setDate(now.getDate() + defaultDaysToMonday);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  /**
   * Evaluate goal progress for a specific person and period
   */
  async evaluateGoal(
    goalId: string,
    personId: string
  ): Promise<GoalEvaluation> {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        taskLinks: {
          include: {
            task: true
          }
        },
        routineLinks: {
          include: {
            routine: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    const periodBounds = this.getPeriodBounds(goal.period, goal.resetDay);

    let evaluation: GoalEvaluation;

    switch (goal.type) {
      case 'COMPLETION_COUNT':
        evaluation = await this.evaluateCompletionCount(goal, personId, periodBounds);
        break;

      case 'STREAK':
        evaluation = await this.evaluateStreak(goal, personId, periodBounds);
        break;

      default:
        // For Phase 2 goal types, return basic evaluation
        evaluation = {
          goalId,
          personId,
          currentValue: 0,
          targetValue: goal.target,
          percentage: 0,
          achieved: false,
          periodStart: periodBounds.start,
          periodEnd: periodBounds.end
        };
    }

    // Update progress record
    await this.updateProgress(goal, personId, evaluation);

    return evaluation;
  }

  /**
   * Evaluate completion count goal (Phase 1)
   */
  private async evaluateCompletionCount(
    goal: any,
    personId: string,
    periodBounds: PeriodBounds
  ): Promise<GoalEvaluation> {
    // Get all linked task IDs
    const taskIds = new Set<string>();

    // Direct task links
    goal.taskLinks.forEach((link: any) => {
      taskIds.add(link.taskId);
    });

    // Tasks from linked routines
    goal.routineLinks.forEach((link: any) => {
      link.routine.tasks.forEach((task: any) => {
        taskIds.add(task.id);
      });
    });

    // Count completions in period
    const completions = await this.prisma.taskCompletion.count({
      where: {
        taskId: { in: Array.from(taskIds) },
        personId,
        completedAt: {
          gte: periodBounds.start,
          lte: periodBounds.end
        }
      }
    });

    const percentage = Math.min(100, Math.round((completions / goal.target) * 100));

    return {
      goalId: goal.id,
      personId,
      currentValue: completions,
      targetValue: goal.target,
      percentage,
      achieved: completions >= goal.target,
      periodStart: periodBounds.start,
      periodEnd: periodBounds.end
    };
  }

  /**
   * Evaluate streak goal (Phase 1 - basic implementation)
   */
  private async evaluateStreak(
    goal: any,
    personId: string,
    periodBounds: PeriodBounds
  ): Promise<GoalEvaluation> {
    // Get all linked task IDs
    const taskIds = new Set<string>();

    goal.taskLinks.forEach((link: any) => {
      taskIds.add(link.taskId);
    });

    goal.routineLinks.forEach((link: any) => {
      link.routine.tasks.forEach((task: any) => {
        taskIds.add(task.id);
      });
    });

    // Get completions for streak calculation
    const completions = await this.prisma.taskCompletion.findMany({
      where: {
        taskId: { in: Array.from(taskIds) },
        personId
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    // Calculate current streak (simplified for Phase 1)
    let currentStreak = 0;
    const firstCompletion = completions[0];
    if (firstCompletion) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastCompletion = new Date(firstCompletion.completedAt);
      lastCompletion.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        currentStreak = goal.currentStreak + 1;
      }
    }

    const percentage = Math.min(100, Math.round((currentStreak / goal.target) * 100));

    return {
      goalId: goal.id,
      personId,
      currentValue: currentStreak,
      targetValue: goal.target,
      percentage,
      achieved: currentStreak >= goal.target,
      periodStart: periodBounds.start,
      periodEnd: periodBounds.end,
      streak: currentStreak
    };
  }

  /**
   * Update or create goal progress record
   */
  private async updateProgress(
    goal: any,
    personId: string,
    evaluation: GoalEvaluation
  ): Promise<void> {
    // Check if progress record exists for this period
    const existingProgress = await this.prisma.goalProgress.findFirst({
      where: {
        goalId: goal.id,
        personId,
        periodStart: {
          gte: evaluation.periodStart
        },
        periodEnd: {
          lte: evaluation.periodEnd
        }
      }
    });

    if (existingProgress) {
      // Update existing progress
      await this.prisma.goalProgress.update({
        where: { id: existingProgress.id },
        data: {
          currentValue: evaluation.currentValue,
          achieved: evaluation.achieved,
          achievedAt: evaluation.achieved && !existingProgress.achieved
            ? new Date()
            : existingProgress.achievedAt
        }
      });
    } else {
      // Create new progress record
      await this.prisma.goalProgress.create({
        data: {
          goalId: goal.id,
          personId,
          currentValue: evaluation.currentValue,
          achieved: evaluation.achieved,
          periodStart: evaluation.periodStart,
          periodEnd: evaluation.periodEnd,
          achievedAt: evaluation.achieved ? new Date() : null
        }
      });
    }

    // Update goal's streak fields if it's a streak goal
    if (goal.type === 'STREAK' && evaluation.streak !== undefined) {
      await this.prisma.goal.update({
        where: { id: goal.id },
        data: {
          currentStreak: evaluation.streak,
          longestStreak: Math.max(goal.longestStreak, evaluation.streak),
          lastAchievedAt: evaluation.achieved ? new Date() : goal.lastAchievedAt
        }
      });
    }
  }

  /**
   * Batch evaluate multiple goals for performance
   * Returns both successful evaluations and a list of failures
   */
  async evaluateBatch(
    goalIds: string[],
    personId: string
  ): Promise<BatchEvaluationResult> {
    const evaluations = new Map<string, GoalEvaluation>();
    const failures: { goalId: string; error: string }[] = [];

    // Process in parallel for performance
    const promises = goalIds.map(async (goalId) => {
      try {
        const evaluation = await this.evaluateGoal(goalId, personId);
        evaluations.set(goalId, evaluation);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to evaluate goal ${goalId}:`, error);
        failures.push({ goalId, error: errorMessage });
      }
    });

    await Promise.all(promises);
    return { evaluations, failures };
  }
}

// Export singleton instance
export const createGoalEvaluator = (prisma: PrismaClient) => new GoalEvaluator(prisma);