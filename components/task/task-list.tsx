'use client';

import { trpc } from '@/lib/trpc/client';
import { TaskItem } from './task-item';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { TaskForm } from './task-form';
import { useToast } from '@/components/ui/toast';

interface TaskListProps {
  routineId: string;
  personId?: string;
}

export function TaskList({ routineId, personId = '' }: TaskListProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">Tasks</h3>
        <Button size="md" onClick={() => setShowForm(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Add Task
        </Button>
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={task.id} className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveTask(index, 'up')}
                  disabled={index === 0 || reorderMutation.isPending}
                  className="h-7 w-7 p-0 hover:bg-gray-100"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveTask(index, 'down')}
                  disabled={index === tasks.length - 1 || reorderMutation.isPending}
                  className="h-7 w-7 p-0 hover:bg-gray-100"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <TaskItem task={task} personId={personId} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-600 mb-2 text-lg font-medium">No tasks yet</p>
          <p className="text-gray-500 text-sm mb-6">Start building this routine by adding tasks</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Task
          </Button>
        </div>
      )}

      {showForm && (
        <TaskForm routineId={routineId} personId={personId} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
