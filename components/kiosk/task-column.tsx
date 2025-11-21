'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Plus, Undo2 } from 'lucide-react';
import { TaskType } from '@/lib/types/prisma-enums';
import { canUndoCompletion, getRemainingUndoTime } from '@/lib/services/task-completion';
import { useState, useEffect } from 'react';
import { TaskWithGoals } from './task-with-goals';

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
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set());

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
    setPendingTasks(prev => new Set(prev).add(task.id));

    if (task.type === TaskType.PROGRESS) {
      const value = progressValues[task.id];
      if (!value || parseInt(value, 10) <= 0) {
        alert('Please enter a value');
        setPendingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(task.id);
          return newSet;
        });
        return;
      }
      onComplete(task.id, value);
      setProgressValues({ ...progressValues, [task.id]: '' });
    } else {
      onComplete(task.id);
    }

    // Clear pending state after a delay (mutation should complete by then)
    setTimeout(() => {
      setPendingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }, 1000);
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
    const isTaskPending = pendingTasks.has(task.id);

    switch (task.type) {
      case TaskType.SIMPLE:
        return canUndo ? (
          <button
            onClick={() => handleUndo(task)}
            disabled={isTaskPending}
            className="w-full text-left p-6 rounded-full border-2 transition-all bg-white border-gray-200 hover:border-gray-300 hover:shadow-md disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-gray-300 bg-white mr-4 flex-shrink-0 transition-all">
                <Undo2 className="h-6 w-6 text-gray-700" />
              </div>
              <div className="flex-1">
                <div className="text-xl font-semibold text-gray-900">{task.name}</div>
                {task.description && (
                  <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                )}
              </div>
              <span className="text-sm text-gray-500 flex-shrink-0">({Math.floor(undoTime / 60)}:{(undoTime % 60).toString().padStart(2, '0')})</span>
            </div>
          </button>
        ) : task.isComplete ? (
          <button
            disabled
            className="w-full text-left p-6 rounded-full border-2 transition-all bg-green-50 border-green-500 shadow-md opacity-70"
          >
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-green-500 bg-green-500 mr-4 flex-shrink-0 transition-all">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xl font-semibold text-gray-900">{task.name}</div>
                {task.description && (
                  <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                )}
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => handleComplete(task)}
            disabled={isTaskPending}
            className="w-full text-left p-6 rounded-full border-2 transition-all bg-white border-gray-200 hover:border-gray-300 hover:shadow-md disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-gray-300 bg-white mr-4 flex-shrink-0 transition-all"></div>
              <div className="flex-1">
                <div className="text-xl font-semibold text-gray-900">{task.name}</div>
                {task.description && (
                  <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                )}
              </div>
            </div>
          </button>
        );

      case TaskType.MULTIPLE_CHECKIN:
        return (
          <button
            onClick={() => handleComplete(task)}
            disabled={isTaskPending}
            className="w-full text-left p-6 rounded-full border-2 transition-all bg-white border-gray-200 hover:border-gray-300 hover:shadow-md disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-blue-300 bg-blue-50 mr-4 flex-shrink-0 transition-all">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-xl font-semibold text-gray-900">{task.name}</div>
                {task.description && (
                  <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                )}
              </div>
            </div>
          </button>
        );

      case TaskType.PROGRESS:
        return (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Input
                type="number"
                min="1"
                max="999"
                value={progressValues[task.id] || ''}
                onChange={(e) =>
                  setProgressValues({ ...progressValues, [task.id]: e.target.value })
                }
                placeholder="0"
                className="flex-1 text-lg h-16 rounded-xl border-2 px-4"
              />
              <button
                onClick={() => handleComplete(task)}
                disabled={isTaskPending}
                className="px-6 h-16 text-base font-semibold whitespace-nowrap rounded-xl border-2 transition-all bg-purple-500 text-white border-purple-500 hover:bg-purple-600 hover:border-purple-600 hover:shadow-md disabled:opacity-50 disabled:cursor-wait"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add {task.unit}
                </div>
              </button>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                Total: {task.summedValue || task.totalValue || 0} {task.unit}
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
            <TaskWithGoals taskId={task.id}>
              {task.type === TaskType.PROGRESS && (
                <div className="mb-2">
                  <h4 className="text-base font-bold text-gray-900">{task.name}</h4>
                  {task.description && (
                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                  )}
                </div>
              )}
              {renderTaskButton(task)}
            </TaskWithGoals>
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
                className="bg-white rounded-xl shadow-md p-3 transition-shadow"
              >
                <TaskWithGoals taskId={task.id}>
                  {task.type === TaskType.PROGRESS && (
                    <div className="mb-2">
                      <h4 className="text-base font-bold text-gray-900">{task.name}</h4>
                      {task.description && (
                        <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                      )}
                    </div>
                  )}
                  {renderTaskButton(task)}
                </TaskWithGoals>
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
