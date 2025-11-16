'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Plus, Undo2, LogOut } from 'lucide-react';
import { TaskType } from '@/lib/types/prisma-enums';
import { canUndoCompletion, getRemainingUndoTime } from '@/lib/services/task-completion';

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
  completions?: Array<{
    id: string;
    completedAt: Date;
    personId: string;
  }>;
}

interface TaskListProps {
  tasks: Task[];
  personId: string;
  personName: string;
  onComplete: (taskId: string, value?: string) => void;
  onUndo: (completionId: string) => void;
  onExit: () => void;
}

export function TaskList({ tasks, personId, personName, onComplete, onUndo, onExit }: TaskListProps) {
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});
  const [undoTimers, setUndoTimers] = useState<Record<string, number>>({});

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
      if (!value || parseFloat(value) <= 0) {
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
        return (
          <div className="flex items-center justify-between">
            <button
              onClick={() => task.isComplete && canUndo ? handleUndo(task) : handleComplete(task)}
              disabled={task.isComplete && !canUndo}
              aria-label={task.isComplete ? `Mark ${task.name} as not completed` : `Mark ${task.name} as completed`}
              aria-pressed={task.isComplete}
              className={`flex items-center gap-4 w-full p-4 rounded-lg transition-all ${
                task.isComplete && !canUndo
                  ? 'cursor-not-allowed opacity-75'
                  : 'hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded border-2 transition-all ${
                  task.isComplete
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {task.isComplete && <Check className="h-5 w-5 text-white" />}
              </div>
              <span className="text-lg font-medium text-gray-700">
                {task.isComplete ? 'Completed' : 'Click to complete'}
              </span>
            </button>
            {canUndo && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUndo(task)}
                aria-label={`Undo completion of ${task.name}`}
                className="ml-4"
              >
                <Undo2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Undo ({Math.floor(undoTime / 60)}:{(undoTime % 60).toString().padStart(2, '0')})
              </Button>
            )}
          </div>
        );

      case TaskType.MULTIPLE_CHECKIN:
        return (
          <Button
            size="lg"
            onClick={() => handleComplete(task)}
            aria-label={`Check in for ${task.name}. Current count: ${task.completionCount || 0}`}
            className="w-full h-16 text-lg"
          >
            <Plus className="h-6 w-6 mr-3" aria-hidden="true" />
            Check In
          </Button>
        );

      case TaskType.PROGRESS:
        return (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={progressValues[task.id] || ''}
                onChange={(e) =>
                  setProgressValues({ ...progressValues, [task.id]: e.target.value })
                }
                placeholder="0"
                aria-label={`Enter value for ${task.name}`}
                aria-describedby={`progress-${task.id}`}
                className="text-xl h-16"
              />
              <Button
                size="lg"
                onClick={() => handleComplete(task)}
                aria-label={`Add ${task.unit} to ${task.name}`}
                className="h-16 px-8 text-lg"
              >
                <Plus className="h-6 w-6 mr-2" aria-hidden="true" />
                Add {task.unit}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={task.progress || 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress for ${task.name}`}
              >
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100, task.progress || 0)}%` }}
                />
              </div>
              <span id={`progress-${task.id}`} className="text-lg font-semibold text-gray-700 whitespace-nowrap">
                {task.totalValue || 0} / {task.targetValue} {task.unit}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{personName}&apos;s Tasks</h1>
            <p className="text-xl text-gray-600">Let&apos;s get things done!</p>
          </div>
          <Button variant="outline" onClick={onExit} size="lg" aria-label="Exit kiosk mode">
            <LogOut className="h-5 w-5 mr-2" aria-hidden="true" />
            Exit
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All done!</h2>
            <p className="text-gray-600">You have no tasks right now. Great job!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="mb-4">
                  <div className="flex items-baseline gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{task.name}</h3>
                    {task.type === TaskType.MULTIPLE_CHECKIN && (
                      <span className="text-lg font-semibold text-blue-600">
                        ({task.completionCount || 0}x)
                      </span>
                    )}
                    {task.type === TaskType.PROGRESS && (
                      <span className="text-lg font-semibold text-green-600">
                        {task.totalValue || 0} {task.unit}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-gray-600">{task.description}</p>
                  )}
                </div>
                {renderTaskButton(task)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
