import { prisma } from '@/lib/prisma';
import { subDays, differenceInDays } from 'date-fns';
import { goalTemplates, type GoalTemplate } from '@/lib/constants/goal-templates';

interface RecommendationContext {
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
  personId?: string;
  ageGroup?: string;
}

interface GoalRecommendation {
  template: GoalTemplate;
  score: number;
  reason: string;
  suggestedTarget?: number;
  suggestedPeriod?: string;
}

/**
 * Recommend goals based on completion history
 */
export async function recommendGoals(
  context: RecommendationContext
): Promise<GoalRecommendation[]> {
  const recommendations: GoalRecommendation[] = [];

  // Get historical data
  const history = await getCompletionHistory(context.roleId, context.personId);
  const existingGoals = await getExistingGoals(context.roleId, context.personId);
  const patterns = analyzePatterns(history);

  // Filter templates by audience and age group
  let candidateTemplates = goalTemplates.filter(
    t => t.targetAudience === context.roleType || t.targetAudience === 'BOTH'
  );

  if (context.ageGroup) {
    const age = parseInt(context.ageGroup);
    candidateTemplates = candidateTemplates.filter(t => {
      if (!t.ageGroup) return true;
      const [min, max] = t.ageGroup.split('-').map(Number);
      if (min === undefined || max === undefined) return true;
      return age >= min && age <= max;
    });
  }

  // Score each template
  for (const template of candidateTemplates) {
    const score = calculateRecommendationScore(
      template,
      patterns,
      existingGoals,
      history
    );

    if (score > 0.3) { // Only include relevant recommendations
      const recommendation: GoalRecommendation = {
        template,
        score,
        reason: generateRecommendationReason(template, patterns, score),
        suggestedTarget: suggestTarget(template, patterns),
        suggestedPeriod: template.defaultPeriod
      };

      recommendations.push(recommendation);
    }
  }

  // Sort by score and return top recommendations
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Get completion history for analysis
 */
async function getCompletionHistory(
  roleId: string,
  personId?: string
) {
  const thirtyDaysAgo = subDays(new Date(), 30);

  const completions = await prisma.taskCompletion.findMany({
    where: {
      task: {
        routine: {
          roleId
        }
      },
      completedAt: {
        gte: thirtyDaysAgo
      },
      ...(personId && { personId })
    },
    include: {
      task: {
        include: {
          routine: true,
          goalLinks: {
            include: {
              goal: true
            }
          }
        }
      }
    },
    orderBy: {
      completedAt: 'desc'
    }
  });

  return completions;
}

/**
 * Get existing goals to avoid duplicates
 */
async function getExistingGoals(roleId: string, personId?: string) {
  return await prisma.goal.findMany({
    where: {
      roleId,
      status: 'ACTIVE',
      ...(personId && {
        personIds: { has: personId }
      })
    }
  });
}

/**
 * Analyze completion patterns
 */
function analyzePatterns(history: any[]) {
  const patterns = {
    dailyAverage: 0,
    weeklyAverage: 0,
    mostActiveTime: '',
    mostActiveDay: '',
    consistencyScore: 0,
    taskTypes: {} as Record<string, number>,
    routineCompletion: {} as Record<string, number>,
    streakPotential: 0
  };

  if (history.length === 0) return patterns;

  // Calculate daily average
  const daysWithCompletions = new Set(
    history.map(h => new Date(h.completedAt).toDateString())
  ).size;
  patterns.dailyAverage = history.length / Math.max(daysWithCompletions, 1);

  // Calculate weekly average
  patterns.weeklyAverage = (history.length / 30) * 7;

  // Find most active time of day
  const hourCounts: Record<number, number> = {};
  history.forEach(h => {
    const hour = new Date(h.completedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const mostActiveHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0];
  if (mostActiveHour) {
    const hour = parseInt(mostActiveHour[0]);
    patterns.mostActiveTime = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  }

  // Calculate consistency score (0-1)
  const dayCompletions: Record<string, number> = {};
  history.forEach(h => {
    const day = new Date(h.completedAt).toDateString();
    dayCompletions[day] = (dayCompletions[day] || 0) + 1;
  });
  const completionDays = Object.keys(dayCompletions).length;
  patterns.consistencyScore = completionDays / 30;

  // Analyze task types
  history.forEach(h => {
    const taskType = h.task.type || 'SIMPLE';
    patterns.taskTypes[taskType] = (patterns.taskTypes[taskType] || 0) + 1;
  });

  // Analyze routine completion rates
  history.forEach(h => {
    const routineId = h.task.routineId;
    patterns.routineCompletion[routineId] = (patterns.routineCompletion[routineId] || 0) + 1;
  });

  // Calculate streak potential
  const consecutiveDays = calculateConsecutiveDays(history);
  patterns.streakPotential = consecutiveDays / 30;

  return patterns;
}

/**
 * Calculate consecutive days with completions
 */
function calculateConsecutiveDays(history: any[]): number {
  if (history.length === 0) return 0;

  const days = new Set(
    history.map(h => new Date(h.completedAt).toDateString())
  );
  const sortedDays = Array.from(days)
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = sortedDays[i - 1];
    const currentDay = sortedDays[i];
    if (!prevDay || !currentDay) continue;

    const diff = differenceInDays(prevDay, currentDay);
    if (diff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Calculate recommendation score for a template
 */
function calculateRecommendationScore(
  template: GoalTemplate,
  patterns: any,
  existingGoals: any[],
  history: any[]
): number {
  let score = 0;

  // Check if similar goal already exists (negative score)
  const hasSimilar = existingGoals.some(
    g => g.type === template.type && g.category === template.category
  );
  if (hasSimilar) {
    score -= 0.5;
  }

  // Score based on goal type alignment
  switch (template.type) {
    case 'STREAK':
      // Good for consistent performers
      score += patterns.consistencyScore * 0.5;
      score += patterns.streakPotential * 0.3;
      break;

    case 'COMPLETION_COUNT':
      // Good for active users
      if (patterns.weeklyAverage > 10) {
        score += 0.4;
      }
      break;

    case 'TIME_BASED':
      // Good if they have PROGRESS tasks
      if (patterns.taskTypes['PROGRESS'] > 0) {
        score += 0.5;
      }
      break;

    case 'PERCENTAGE':
      // Good for routine-focused users
      if (Object.keys(patterns.routineCompletion).length > 2) {
        score += 0.4;
      }
      break;
  }

  // Score based on activity level
  if (patterns.dailyAverage > 5 && template.defaultPeriod === 'DAILY') {
    score += 0.3;
  } else if (patterns.weeklyAverage > 20 && template.defaultPeriod === 'WEEKLY') {
    score += 0.3;
  }

  // Score based on time alignment
  if (template.name.toLowerCase().includes('morning') && patterns.mostActiveTime === 'morning') {
    score += 0.2;
  } else if (template.name.toLowerCase().includes('evening') && patterns.mostActiveTime === 'evening') {
    score += 0.2;
  }

  // Boost score for category diversity
  const existingCategories = new Set(existingGoals.map(g => g.category));
  if (!existingCategories.has(template.category)) {
    score += 0.2;
  }

  // Normalize score to 0-1 range
  return Math.max(0, Math.min(1, score));
}

/**
 * Generate human-readable recommendation reason
 */
function generateRecommendationReason(
  template: GoalTemplate,
  patterns: any,
  score: number
): string {
  const reasons: string[] = [];

  if (score > 0.7) {
    reasons.push('Highly recommended based on your activity');
  }

  if (template.type === 'STREAK' && patterns.streakPotential > 0.5) {
    reasons.push('You show great consistency');
  }

  if (template.type === 'COMPLETION_COUNT' && patterns.weeklyAverage > 15) {
    reasons.push('You complete many tasks regularly');
  }

  if (patterns.consistencyScore > 0.7) {
    reasons.push('Your daily routine is very consistent');
  }

  if (template.name.toLowerCase().includes(patterns.mostActiveTime)) {
    reasons.push(`Aligns with your ${patterns.mostActiveTime} activity`);
  }

  if (reasons.length === 0) {
    reasons.push('Recommended to diversify your goals');
  }

  return reasons.join('. ');
}

/**
 * Suggest a realistic target based on patterns
 */
function suggestTarget(template: GoalTemplate, patterns: any): number {
  let suggestedTarget = template.defaultTarget;

  switch (template.type) {
    case 'COMPLETION_COUNT':
      if (template.defaultPeriod === 'DAILY') {
        suggestedTarget = Math.round(patterns.dailyAverage * 0.8);
      } else if (template.defaultPeriod === 'WEEKLY') {
        suggestedTarget = Math.round(patterns.weeklyAverage * 0.8);
      }
      break;

    case 'STREAK':
      // Start with achievable streak goals
      if (patterns.streakPotential < 0.3) {
        suggestedTarget = 3; // Start small
      } else if (patterns.streakPotential < 0.6) {
        suggestedTarget = 5;
      } else {
        suggestedTarget = 7;
      }
      break;

    case 'PERCENTAGE':
      // Be realistic about percentage goals
      if (patterns.consistencyScore < 0.5) {
        suggestedTarget = 70;
      } else if (patterns.consistencyScore < 0.8) {
        suggestedTarget = 85;
      } else {
        suggestedTarget = 95;
      }
      break;
  }

  // Ensure suggested target is reasonable
  return Math.max(1, Math.round(suggestedTarget));
}

/**
 * Identify patterns in task completion for insights
 */
export async function identifyCompletionPatterns(
  roleId: string,
  personId?: string
): Promise<{
  patterns: string[];
  insights: string[];
  suggestions: string[];
}> {
  const history = await getCompletionHistory(roleId, personId);
  const patterns = analyzePatterns(history);

  const result = {
    patterns: [] as string[],
    insights: [] as string[],
    suggestions: [] as string[]
  };

  // Identify patterns
  if (patterns.consistencyScore > 0.8) {
    result.patterns.push('Highly consistent daily activity');
  } else if (patterns.consistencyScore > 0.5) {
    result.patterns.push('Regular activity most days');
  } else {
    result.patterns.push('Sporadic activity patterns');
  }

  if (patterns.streakPotential > 0.7) {
    result.patterns.push('Strong streak potential');
  }

  if (patterns.mostActiveTime) {
    result.patterns.push(`Most active during ${patterns.mostActiveTime}`);
  }

  // Generate insights
  if (patterns.dailyAverage > 10) {
    result.insights.push('High task completion volume');
  }

  if (patterns.consistencyScore < 0.3) {
    result.insights.push('Could benefit from more regular routines');
  }

  const topTaskType = Object.entries(patterns.taskTypes)
    .sort(([, a], [, b]) => b - a)[0];
  if (topTaskType) {
    result.insights.push(`Primarily completes ${topTaskType[0]} tasks`);
  }

  // Generate suggestions
  if (patterns.consistencyScore < 0.5) {
    result.suggestions.push('Start with small, daily goals to build consistency');
  }

  if (patterns.streakPotential > 0.5 && patterns.consistencyScore > 0.6) {
    result.suggestions.push('Ready for streak-based goals');
  }

  if (patterns.weeklyAverage > 20) {
    result.suggestions.push('Consider challenging completion count goals');
  }

  if (Object.keys(patterns.taskTypes).length === 1) {
    result.suggestions.push('Try diversifying task types for balanced growth');
  }

  return result;
}