'use client';

import { trpc } from '@/lib/trpc/client';
import { TaskCard } from './task-card';
import { useState } from 'react';
import { TaskForm } from './task-form';
import { useToast } from '@/components/ui/toast';
import { Plus } from 'lucide-react';
import { getTierLimit, ComponentTierLimits } from '@/lib/services/tier-limits';

interface TaskListProps {
  routineId: string;
  personId?: string;
  effectiveLimits?: ComponentTierLimits | null;
}

export function TaskList({ routineId, personId = '', effectiveLimits = null }: TaskListProps) {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: tasks, isLoading } = trpc.task.list.useQuery({
    routineId,
  });

  const reorderMutation = trpc.task.reorder.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const moveTask = (index: number, direction: 'up' | 'down') => {
    if (!tasks) return;

    const newTasks = [...tasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newTasks.length) return;

    // Swap tasks
    [newTasks[index], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[index]];

    // Update order
    const taskIds = newTasks.map((t) => t.id);
    reorderMutation.mutate({ routineId, taskIds });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  const taskLimit = getTierLimit(effectiveLimits, 'tasks_per_routine');
  const currentTaskCount = tasks?.length || 0;
  const canAddTask = currentTaskCount < taskLimit;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">Tasks</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tasks && tasks.length > 0 && tasks.map((task: any, index: number) => (
          <TaskCard
            key={task.id}
            task={task}
            personId={personId}
            onMoveUp={() => moveTask(index, 'up')}
            onMoveDown={() => moveTask(index, 'down')}
            canMoveUp={index > 0 && !reorderMutation.isPending}
            canMoveDown={index < tasks.length - 1 && !reorderMutation.isPending}
          />
        ))}

        {/* Add Task Card - Always visible */}
        <div
          onClick={canAddTask ? () => setShowForm(true) : undefined}
          className={`bg-white rounded-lg border-2 border-dashed p-4 flex items-center justify-center min-h-[150px] ${
            canAddTask
              ? 'border-gray-300 cursor-pointer transition-all hover:border-primary-400 hover:bg-gray-50'
              : 'border-gray-200 cursor-not-allowed bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center text-center gap-2">
            {canAddTask ? (
              <>
                <Plus className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-400">Add Task</span>
              </>
            ) : (
              <>
                <div className="text-2xl mb-1">🔒</div>
                <span className="text-xs font-medium text-gray-500">Upgrade to increase</span>
                <span className="text-xs text-gray-400">your task limit</span>
                <span className="text-xs text-gray-400 mt-1">({currentTaskCount}/{taskLimit})</span>
              </>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <TaskForm routineId={routineId} personId={personId} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
