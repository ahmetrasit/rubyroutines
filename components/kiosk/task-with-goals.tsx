'use client';

import { trpc } from '@/lib/trpc/client';
import { GoalProgressIndicator } from '@/components/goal/goal-progress-indicator';
import { ReactNode } from 'react';

interface TaskWithGoalsProps {
  taskId: string;
  children: ReactNode;
}

export function TaskWithGoals({ taskId, children }: TaskWithGoalsProps) {
  // Fetch goals for this task
  const { data: goals } = trpc.goal.getGoalsForTask.useQuery(
    { taskId },
    {
      // Only fetch if in authenticated context
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  return (
    <div>
      {children}
      {goals && goals.length > 0 && <GoalProgressIndicator goals={goals} />}
    </div>
  );
}
