'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Plus, Undo2 } from 'lucide-react';
import { TaskType } from '@/lib/types/prisma-enums';
import { canUndoCompletion, getRemainingUndoTime } from '@/lib/services/task-completion';
import { useState, useEffect } from 'react';

interface Task {
  id: string;
  name: string;
  description?: string | null;
  type: TaskType;
  unit?: string | null;
  targetValue?: number | null;
  isComplete?: boolean;
  completionCount?: number;
  progress?: number;
  totalValue?: number;
  entryNumber?: number;
  summedValue?: number;
  completions?: Array<{
    id: string;
    completedAt: Date;
    personId: string;
  }>;
}

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  personId: string;
  onComplete: (taskId: string, value?: string) => void;
  onUndo: (completionId: string) => void;
  isPending: boolean;
}

export function TaskColumn({ title, tasks, personId, onComplete, onUndo, isPending }: TaskColumnProps) {
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});
  const [undoTimers, setUndoTimers] = useState<Record<string, number>>({});

  // Split tasks into incomplete and complete
  const incompleteTasks = tasks.filter(t => !t.isComplete);
  const completeTasks = tasks.filter(t => t.isComplete);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers: Record<string, number> = {};

      tasks.forEach((task) => {
        if (task.type === TaskType.SIMPLE && task.completions && task.completions.length > 0) {
          const recentCompletion = task.completions.find((c) => c.personId === personId);
          if (recentCompletion && canUndoCompletion(recentCompletion.completedAt, task.type)) {
            newTimers[task.id] = getRemainingUndoTime(recentCompletion.completedAt);
          }
        }
      });

      setUndoTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks, personId]);

  const handleComplete = (task: Task) => {
    if (task.type === TaskType.PROGRESS) {
      const value = progressValues[task.id];
      if (!value || parseInt(value, 10) <= 0) {
        alert('Please enter a value');
        return;
      }
      onComplete(task.id, value);
      setProgressValues({ ...progressValues, [task.id]: '' });
    } else {
      onComplete(task.id);
    }
  };

  const handleUndo = (task: Task) => {
    const recentCompletion = task.completions?.find((c) => c.personId === personId);
    if (recentCompletion) {
      onUndo(recentCompletion.id);
    }
  };

  const renderTaskButton = (task: Task) => {
    const undoTime = undoTimers[task.id];
    const canUndo = task.type === TaskType.SIMPLE && task.isComplete && undoTime !== undefined && undoTime > 0;

    switch (task.type) {
      case TaskType.SIMPLE:
        return canUndo ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleUndo(task)}
            disabled={isPending}
            className="w-full h-14 text-base rounded-xl"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Undo ({Math.floor(undoTime / 60)}:{(undoTime % 60).toString().padStart(2, '0')})
          </Button>
        ) : task.isComplete ? (
          <Button
            size="sm"
            variant="outline"
            disabled
            className="w-full h-14 text-base rounded-xl bg-green-50 border-green-300 text-green-700"
          >
            <Check className="h-5 w-5 mr-2" />
            {task.name}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => handleComplete(task)}
            disabled={isPending}
            className="w-full h-14 text-base rounded-xl"
          >
            <Check className="h-4 w-4 mr-2" />
            {task.name}
          </Button>
        );

      case TaskType.MULTIPLE_CHECKIN:
        return (
          <Button
            size="sm"
            onClick={() => handleComplete(task)}
            disabled={isPending}
            className="w-full h-16 text-lg font-semibold rounded-xl"
          >
            <Plus className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="flex-1">{task.name}</span>
            <span className="text-sm ml-2 opacity-70">({(task.entryNumber || task.completionCount || 0)}/9)</span>
          </Button>
        );

      case TaskType.PROGRESS:
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="999"
                value={progressValues[task.id] || ''}
                onChange={(e) =>
                  setProgressValues({ ...progressValues, [task.id]: e.target.value })
                }
                placeholder="0"
                className="text-base h-14 rounded-xl"
              />
              <Button
                size="sm"
                onClick={() => handleComplete(task)}
                disabled={isPending}
                className="h-14 px-6 text-base whitespace-nowrap rounded-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add {task.unit}
              </Button>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                Total: {task.summedValue || task.totalValue || 0} {task.unit}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Entry #{task.entryNumber || task.completionCount || 0}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-900 mb-3 px-2">{title}</h3>
      <div className="flex-1 overflow-auto space-y-2">
        {/* Incomplete tasks */}
        {incompleteTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-xl shadow-md p-3 hover:shadow-lg transition-shadow"
          >
            {task.type !== TaskType.MULTIPLE_CHECKIN && (
              <div className="mb-2">
                <h4 className="text-base font-bold text-gray-900">{task.name}</h4>
                {task.description && (
                  <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                )}
              </div>
            )}
            {renderTaskButton(task)}
          </div>
        ))}

        {/* Completed tasks - dimmed */}
        {completeTasks.length > 0 && (
          <>
            {incompleteTasks.length > 0 && (
              <div className="border-t border-gray-300 my-4"></div>
            )}
            {completeTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-md p-3 opacity-50 transition-shadow"
              >
                {task.type !== TaskType.MULTIPLE_CHECKIN && (
                  <div className="mb-2">
                    <h4 className="text-base font-bold text-gray-900">{task.name}</h4>
                    {task.description && (
                      <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                    )}
                  </div>
                )}
                {renderTaskButton(task)}
              </div>
            ))}
          </>
        )}

        {tasks.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">✓</div>
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
