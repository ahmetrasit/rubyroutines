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
        return canUndo ? (
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleUndo(task)}
            className="w-full h-16 text-lg"
          >
            <Undo2 className="h-6 w-6 mr-3" />
            Undo ({Math.floor(undoTime / 60)}:{(undoTime % 60).toString().padStart(2, '0')})
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => handleComplete(task)}
            disabled={task.isComplete}
            className={`w-full h-16 text-lg ${task.isComplete ? 'bg-green-600' : ''}`}
          >
            <Check className="h-6 w-6 mr-3" />
            {task.isComplete ? 'Done Today!' : 'Mark Done'}
          </Button>
        );

      case TaskType.MULTIPLE_CHECKIN:
        return (
          <Button
            size="lg"
            onClick={() => handleComplete(task)}
            className="w-full h-16 text-lg"
          >
            <Plus className="h-6 w-6 mr-3" />
            Check In ({task.completionCount || 0}x)
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
                className="text-xl h-16"
              />
              <Button
                size="lg"
                onClick={() => handleComplete(task)}
                className="h-16 px-8 text-lg"
              >
                <Plus className="h-6 w-6 mr-2" />
                Add {task.unit}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100, task.progress || 0)}%` }}
                />
              </div>
              <span className="text-lg font-semibold text-gray-700 whitespace-nowrap">
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
          <Button variant="outline" onClick={onExit} size="lg">
            <LogOut className="h-5 w-5 mr-2" />
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{task.name}</h3>
                  {task.description && (
                    <p className="text-gray-600">{task.description}</p>
                  )}
                  {task.isComplete && task.type === TaskType.SIMPLE && (
                    <div className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      ✓ Completed Today
                    </div>
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
