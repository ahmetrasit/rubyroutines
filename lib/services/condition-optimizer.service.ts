import { prisma } from '@/lib/prisma';
import { ConditionOperator, ConditionLogic } from '@prisma/client';
import { subDays } from 'date-fns';

interface OptimizationSuggestion {
  type: 'SIMPLIFY' | 'REMOVE' | 'COMBINE' | 'REORDER' | 'CACHE';
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  conditionIds?: string[];
  suggestedChange?: any;
}

interface UsagePattern {
  triggerCount: number;
  successRate: number;
  averageEvalTime?: number;
  mostCommonResult: boolean;
  lastTriggered?: Date;
}

/**
 * Analyze routine usage patterns to suggest optimal conditions
 */
export async function analyzeRoutineUsagePatterns(
  routineId: string
): Promise<{
  patterns: UsagePattern[];
  suggestions: OptimizationSuggestion[];
}> {
  // Get routine with conditions
  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    include: {
      conditions: {
        include: {
          checks: true
        }
      },
      tasks: {
        include: {
          completions: {
            where: {
              completedAt: {
                gte: subDays(new Date(), 30)
              }
            }
          }
        }
      }
    }
  });

  if (!routine) {
    throw new Error('Routine not found');
  }

  const patterns: UsagePattern[] = [];
  const suggestions: OptimizationSuggestion[] = [];

  // Analyze each condition
  for (const condition of routine.conditions) {
    const pattern = analyzeConditionPattern(condition);
    patterns.push(pattern);

    // Generate suggestions based on pattern
    const conditionSuggestions = generateConditionSuggestions(condition, pattern);
    suggestions.push(...conditionSuggestions);
  }

  // Check for redundant conditions
  const redundantSuggestions = findRedundantConditions(routine.conditions);
  suggestions.push(...redundantSuggestions);

  // Check for optimization opportunities
  const optimizationSuggestions = findOptimizationOpportunities(routine);
  suggestions.push(...optimizationSuggestions);

  return { patterns, suggestions };
}

/**
 * Analyze a single condition's usage pattern
 */
function analyzeConditionPattern(condition: any): UsagePattern {
  const triggers = condition.triggers || [];
  const triggerCount = triggers.length;

  if (triggerCount === 0) {
    return {
      triggerCount: 0,
      successRate: 0,
      mostCommonResult: false
    };
  }

  const successCount = triggers.filter((t: any) => t.triggered).length;
  const successRate = successCount / triggerCount;

  return {
    triggerCount,
    successRate,
    mostCommonResult: successRate > 0.5,
    lastTriggered: triggers[0]?.evaluatedAt
  };
}

/**
 * Generate suggestions for a specific condition
 */
function generateConditionSuggestions(
  condition: any,
  pattern: UsagePattern
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Suggest removal if never triggered
  if (pattern.triggerCount === 0) {
    suggestions.push({
      type: 'REMOVE',
      title: 'Unused condition',
      description: 'This condition has never been triggered in the last 30 days',
      impact: 'LOW',
      conditionIds: [condition.id]
    });
  }

  // Suggest simplification if always true or false
  if (pattern.triggerCount > 10) {
    if (pattern.successRate === 1) {
      suggestions.push({
        type: 'SIMPLIFY',
        title: 'Always-true condition',
        description: 'This condition always evaluates to true - consider removing it',
        impact: 'MEDIUM',
        conditionIds: [condition.id]
      });
    } else if (pattern.successRate === 0) {
      suggestions.push({
        type: 'SIMPLIFY',
        title: 'Always-false condition',
        description: 'This condition never evaluates to true - routine may be inaccessible',
        impact: 'HIGH',
        conditionIds: [condition.id]
      });
    }
  }

  // Check for complex conditions that could be simplified
  if (condition.checks.length > 5) {
    suggestions.push({
      type: 'SIMPLIFY',
      title: 'Complex condition',
      description: `This condition has ${condition.checks.length} checks - consider breaking it down`,
      impact: 'MEDIUM',
      conditionIds: [condition.id]
    });
  }

  // Suggest caching for time-based conditions
  const hasTimeCheck = condition.checks.some(
    (c: any) => c.contextType === 'TIME_OF_DAY' || c.contextType === 'DAY_OF_WEEK'
  );
  if (hasTimeCheck && pattern.triggerCount > 50) {
    suggestions.push({
      type: 'CACHE',
      title: 'Cache time-based condition',
      description: 'This time-based condition is evaluated frequently - caching could improve performance',
      impact: 'MEDIUM',
      conditionIds: [condition.id]
    });
  }

  return suggestions;
}

/**
 * Find redundant conditions across all conditions
 */
function findRedundantConditions(conditions: any[]): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Check for duplicate checks across conditions
  const checkSignatures = new Map<string, string[]>();

  for (const condition of conditions) {
    for (const check of condition.checks) {
      const signature = getCheckSignature(check);
      if (!checkSignatures.has(signature)) {
        checkSignatures.set(signature, []);
      }
      checkSignatures.get(signature)!.push(condition.id);
    }
  }

  // Find duplicates
  for (const [signature, conditionIds] of checkSignatures.entries()) {
    if (conditionIds.length > 1) {
      suggestions.push({
        type: 'COMBINE',
        title: 'Duplicate condition checks',
        description: 'Multiple conditions have the same check - consider combining them',
        impact: 'MEDIUM',
        conditionIds: Array.from(new Set(conditionIds))
      });
    }
  }

  // Check for conflicting conditions
  const conflictingSuggestions = findConflictingConditions(conditions);
  suggestions.push(...conflictingSuggestions);

  return suggestions;
}

/**
 * Find conflicting conditions
 */
function findConflictingConditions(conditions: any[]): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  for (let i = 0; i < conditions.length; i++) {
    for (let j = i + 1; j < conditions.length; j++) {
      const conflict = detectConflict(conditions[i], conditions[j]);
      if (conflict) {
        suggestions.push({
          type: 'SIMPLIFY',
          title: 'Conflicting conditions',
          description: conflict,
          impact: 'HIGH',
          conditionIds: [conditions[i].id, conditions[j].id]
        });
      }
    }
  }

  return suggestions;
}

/**
 * Detect if two conditions conflict
 */
function detectConflict(condition1: any, condition2: any): string | null {
  // Check for time conflicts
  const time1 = condition1.checks.find((c: any) => c.contextType === 'TIME_OF_DAY');
  const time2 = condition2.checks.find((c: any) => c.contextType === 'TIME_OF_DAY');

  if (time1 && time2) {
    // Check if time ranges overlap
    if (time1.timeOperator === 'BETWEEN' && time2.timeOperator === 'BETWEEN') {
      const overlap = checkTimeOverlap(
        time1.timeValue,
        time1.value2,
        time2.timeValue,
        time2.value2
      );
      if (!overlap && condition1.logic === 'AND' && condition2.logic === 'AND') {
        return 'These conditions have non-overlapping time ranges';
      }
    }
  }

  // Check for day conflicts
  const day1 = condition1.checks.find((c: any) => c.contextType === 'DAY_OF_WEEK');
  const day2 = condition2.checks.find((c: any) => c.contextType === 'DAY_OF_WEEK');

  if (day1 && day2 && day1.dayOfWeek && day2.dayOfWeek) {
    const days1 = new Set(day1.dayOfWeek);
    const days2 = new Set(day2.dayOfWeek);
    const overlap = Array.from(days1).some(d => days2.has(d));

    if (!overlap && condition1.logic === 'AND' && condition2.logic === 'AND') {
      return 'These conditions have non-overlapping days';
    }
  }

  return null;
}

/**
 * Check if two time ranges overlap
 */
function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string) => {
    const parts = time.split(':').map(Number);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    return hours * 60 + minutes;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return !(e1 <= s2 || e2 <= s1);
}

/**
 * Find general optimization opportunities
 */
function findOptimizationOpportunities(routine: any): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Check if routine has low completion rate
  const totalTasks = routine.tasks.length;
  const totalCompletions = routine.tasks.reduce(
    (sum: number, task: any) => sum + task.completions.length,
    0
  );

  if (totalTasks > 0 && totalCompletions / (totalTasks * 30) < 0.1) {
    suggestions.push({
      type: 'SIMPLIFY',
      title: 'Low completion rate',
      description: 'This routine has very few completions - conditions might be too restrictive',
      impact: 'HIGH'
    });
  }

  // Suggest reordering checks for performance
  const reorderSuggestion = suggestCheckReordering(routine.conditions);
  if (reorderSuggestion) {
    suggestions.push(reorderSuggestion);
  }

  return suggestions;
}

/**
 * Suggest reordering condition checks for better performance
 */
function suggestCheckReordering(conditions: any[]): OptimizationSuggestion | null {
  for (const condition of conditions) {
    if (condition.checks.length <= 1) continue;

    const costMap = condition.checks.map((check: any, index: number) => ({
      index,
      cost: getCheckCost(check)
    }));

    const sorted = [...costMap].sort((a, b) => a.cost - b.cost);
    const isOptimal = sorted.every((item, index) => item.index === index);

    if (!isOptimal) {
      return {
        type: 'REORDER',
        title: 'Optimize check order',
        description: 'Reordering condition checks could improve performance',
        impact: 'LOW',
        conditionIds: [condition.id],
        suggestedChange: {
          order: sorted.map(item => item.index)
        }
      };
    }
  }

  return null;
}

/**
 * Get the computational cost of a check
 */
function getCheckCost(check: any): number {
  // Context checks are cheapest (no DB queries)
  if (check.contextType) {
    switch (check.contextType) {
      case 'TIME_OF_DAY':
      case 'DAY_OF_WEEK':
        return 1;
      case 'WEATHER':
      case 'LOCATION':
        return 3; // External API calls
      default:
        return 2;
    }
  }

  // Database checks are more expensive
  if (check.targetTaskId) return 5;
  if (check.targetRoutineId) return 10;
  if (check.targetGoalId) return 20;

  return 100; // Unknown
}

/**
 * Generate a signature for a check (for duplicate detection)
 */
function getCheckSignature(check: any): string {
  const parts = [
    check.operator,
    check.targetTaskId || '',
    check.targetRoutineId || '',
    check.targetGoalId || '',
    check.contextType || '',
    check.value || '',
    check.negate ? 'NOT' : ''
  ];
  return parts.join('|');
}

/**
 * Suggest condition simplifications
 */
export async function suggestConditionSimplifications(
  conditionId: string
): Promise<OptimizationSuggestion[]> {
  const condition = await prisma.condition.findUnique({
    where: { id: conditionId },
    include: {
      checks: true
    }
  });

  if (!condition) {
    throw new Error('Condition not found');
  }

  const suggestions: OptimizationSuggestion[] = [];

  // Check for redundant negations
  const negatedChecks = condition.checks.filter(c => c.negate);
  if (negatedChecks.length > condition.checks.length / 2) {
    suggestions.push({
      type: 'SIMPLIFY',
      title: 'Too many negations',
      description: 'Consider inverting the logic to reduce negations',
      impact: 'LOW'
    });
  }

  // Note: triggers analysis would require separate trigger data tracking
  // which is not yet implemented in the schema

  // Suggest combining similar checks
  const taskChecks = condition.checks.filter(c => c.targetTaskId);
  if (taskChecks.length > 3) {
    suggestions.push({
      type: 'COMBINE',
      title: 'Multiple task checks',
      description: 'Consider using a routine-level check instead of multiple task checks',
      impact: 'MEDIUM'
    });
  }

  return suggestions;
}