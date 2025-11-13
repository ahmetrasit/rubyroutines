'use client';

import { GoalProgressBar } from './goal-progress-bar';

interface Goal {
  id: string;
  name: string;
  target: number;
  progress?: number;
}

interface GoalProgressBarsProps {
  goals: Goal[];
  title?: string;
  compact?: boolean;
}

export function GoalProgressBars({ goals, title = 'Linked Goals', compact = false }: GoalProgressBarsProps) {
  if (!goals || goals.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-${compact ? '2' : '3'}`}>
      {title && !compact && (
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      )}
      <div className={`space-y-${compact ? '2' : '3'}`}>
        {goals.map((goal) => (
          <GoalProgressBar key={goal.id} goal={goal} compact={compact} />
        ))}
      </div>
    </div>
  );
}
