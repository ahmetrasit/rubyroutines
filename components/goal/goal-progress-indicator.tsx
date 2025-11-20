'use client';

import { Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Goal {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  target: number;
  progress?: {
    current: number;
    target: number;
    percentage: number;
    achieved: boolean;
  };
}

interface GoalProgressIndicatorProps {
  goals: Goal[];
}

export function GoalProgressIndicator({ goals }: GoalProgressIndicatorProps) {
  if (!goals || goals.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
      {goals.map((goal) => {
        const percentage = goal.progress?.percentage || 0;
        const achieved = goal.progress?.achieved || false;
        const current = goal.progress?.current || 0;
        const target = goal.progress?.target || goal.target;

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
              <span
                className={`font-semibold ${
                  achieved ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                {Math.round(current)}/{target}
              </span>
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
          </div>
        );
      })}
    </div>
  );
}
