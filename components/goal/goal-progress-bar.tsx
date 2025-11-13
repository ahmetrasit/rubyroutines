'use client';

import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';

interface GoalProgressBarProps {
  goal: {
    id: string;
    name: string;
    target: number;
    progress?: number;
  };
  compact?: boolean;
}

export function GoalProgressBar({ goal, compact = false }: GoalProgressBarProps) {
  const progress = goal.progress || 0;
  const percentage = Math.min(100, (progress / goal.target) * 100);
  const isComplete = progress >= goal.target;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Target className={`h-3 w-3 ${isComplete ? 'text-green-600' : 'text-gray-400'}`} />
        <Progress value={percentage} className="h-1 flex-1" />
        <span className="text-xs text-gray-600 whitespace-nowrap">
          {progress}/{goal.target}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className={`h-4 w-4 ${isComplete ? 'text-green-600' : 'text-gray-400'}`} />
          <span className="text-sm font-medium text-gray-900">{goal.name}</span>
        </div>
        <span className="text-sm text-gray-600">
          {progress}/{goal.target}
        </span>
      </div>
      <div className="relative">
        <Progress value={percentage} className="h-2" />
        {isComplete && (
          <div className="absolute -top-1 -right-1">
            <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500">
        {isComplete ? 'Goal completed!' : `${(100 - percentage).toFixed(0)}% remaining`}
      </div>
    </div>
  );
}
