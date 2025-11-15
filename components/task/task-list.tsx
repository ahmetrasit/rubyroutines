'use client';

import { trpc } from '@/lib/trpc/client';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TaskForm } from './task-form';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';

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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tasks && tasks.length > 0 ? (
          <>
            {tasks.map((task: any, index: number) => (
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
            <Card
              className="border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer min-h-[200px] flex items-center justify-center"
              onClick={() => setShowForm(true)}
            >
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Add Task</p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card
            className="col-span-full border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer"
            onClick={() => setShowForm(true)}
          >
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 mb-2 text-lg font-medium">No tasks yet</p>
              <p className="text-gray-500 text-sm mb-6">Start building this routine by adding tasks</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Task
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {showForm && (
        <TaskForm routineId={routineId} personId={personId} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
