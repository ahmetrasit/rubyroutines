'use client';

import { Target, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Goal {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  target: number;
  simpleCondition?: string | null;
  comparisonOperator?: string | null;
  comparisonValue?: number | null;
  progress?: {
    current: number;
    target: number;
    percentage: number;
    achieved: boolean;
  };
}

interface GoalProgressIndicatorProps {
  goals: Goal[];
  compact?: boolean; // For inline display under tasks
}

export function GoalProgressIndicator({ goals, compact = false }: GoalProgressIndicatorProps) {
  if (!goals || goals.length === 0) {
    return null;
  }

  // For compact mode (tasks in check-in screens)
  if (compact) {
    return (
      <div className="mt-2 space-y-1.5">
        {goals.map((goal) => {
          const percentage = goal.progress?.percentage || 0;
          const achieved = goal.progress?.achieved || false;
          const isSimpleGoal = goal.simpleCondition || goal.comparisonOperator;

          return (
            <div key={goal.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {goal.icon ? (
                  <span className="text-xs flex-shrink-0">{goal.icon}</span>
                ) : (
                  <Target className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-xs text-gray-600 truncate">{goal.name}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, percentage)}%`,
                      backgroundColor: achieved
                        ? '#10b981' // green-500
                        : goal.color || '#6b7280', // gray-500
                    }}
                  />
                </div>
                {isSimpleGoal && (
                  achieved ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-gray-400" />
                  )
                )}
                {!isSimpleGoal && (
                  <span className={`text-xs font-medium ${achieved ? 'text-green-600' : 'text-gray-500'}`}>
                    {Math.round(percentage)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Standard mode for goal cards and detailed views
  return (
    <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
      {goals.map((goal) => {
        const percentage = goal.progress?.percentage || 0;
        const achieved = goal.progress?.achieved || false;
        const current = goal.progress?.current || 0;
        const target = goal.progress?.target || goal.target;
        const isSimpleGoal = goal.simpleCondition || goal.comparisonOperator;

        return (
          <div key={goal.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {goal.icon ? (
                  <span className="text-sm">{goal.icon}</span>
                ) : (
                  <Target className="h-3 w-3 text-gray-400" />
                )}
                <span className="font-medium text-gray-700">{goal.name}</span>
              </div>
              {isSimpleGoal ? (
                <span className={`text-xs font-semibold ${achieved ? 'text-green-600' : 'text-gray-500'}`}>
                  {achieved ? 'Achieved' : 'Not achieved'}
                </span>
              ) : (
                <span
                  className={`font-semibold ${
                    achieved ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {Math.round(current)}/{target}
                </span>
              )}
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, percentage)}%`,
                  backgroundColor: achieved
                    ? '#10b981' // green-500
                    : goal.color || '#3b82f6', // blue-500
                }}
              />
            </div>
            {/* Show condition details for simple goals */}
            {isSimpleGoal && (
              <div className="text-xs text-gray-500 mt-0.5">
                {goal.simpleCondition && (
                  <span>
                    {goal.simpleCondition === 'complete'
                      ? 'Goal: Complete task'
                      : 'Goal: Do not complete task'}
                  </span>
                )}
                {goal.comparisonOperator && goal.comparisonValue && (
                  <span>
                    Goal: {goal.comparisonOperator === 'gte' ? '≥' : '≤'} {goal.comparisonValue}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
