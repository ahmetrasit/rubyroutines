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

  // Determine if we're in kiosk mode (tablet) or dashboard mode (smartphone)
  const [isKioskMode, setIsKioskMode] = useState(false);

  useEffect(() => {
    const checkMode = () => {
      setIsKioskMode(window.innerWidth >= 768);
    };

    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, []);

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
            className={`w-full text-left transition-all disabled:opacity-50 disabled:cursor-wait warm-earth-task-simple ${isKioskMode ? 'p-4' : 'p-3'}`}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <div className="warm-square">
                <Undo2 className="h-3 w-3" style={{ color: 'var(--warm-incomplete-primary)' }} />
              </div>
              <div className="flex-1">
                <div className={`font-semibold task-name`} style={{ color: 'var(--warm-text-primary)' }}>{task.name}</div>
                {task.description && (
                  <div className={`task-desc mt-1`} style={{ color: 'var(--warm-text-secondary)' }}>{task.description}</div>
                )}
              </div>
              <span className="text-sm flex-shrink-0" style={{ color: 'var(--warm-text-secondary)' }}>
                ({Math.floor(undoTime / 60)}:{(undoTime % 60).toString().padStart(2, '0')})
              </span>
            </div>
          </button>
        ) : task.isComplete ? (
          <button
            disabled
            className={`w-full text-left transition-all opacity-70 warm-earth-task-simple complete ${isKioskMode ? 'p-4' : 'p-3'}`}
          >
            <div className="flex items-center gap-3">
              <div className="warm-square complete"></div>
              <div className="flex-1">
                <div className={`font-semibold task-name`} style={{ color: 'var(--warm-complete-secondary)', textDecoration: isKioskMode ? 'line-through' : 'none' }}>
                  {task.name}
                </div>
                {task.description && (
                  <div className={`task-desc mt-1`} style={{ color: 'var(--warm-complete-primary)', opacity: 0.8 }}>{task.description}</div>
                )}
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => handleComplete(task)}
            disabled={isTaskPending}
            className={`w-full text-left transition-all disabled:opacity-50 disabled:cursor-wait warm-earth-task-simple ${isKioskMode ? 'p-4' : 'p-3'}`}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <div className="warm-square"></div>
              <div className="flex-1">
                <div className={`font-semibold task-name`} style={{ color: 'var(--warm-incomplete-secondary)' }}>{task.name}</div>
                {task.description && (
                  <div className={`task-desc mt-1`} style={{ color: 'var(--warm-incomplete-primary)' }}>{task.description}</div>
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
            className={`w-full text-left transition-all disabled:opacity-50 disabled:cursor-wait warm-earth-task-simple ${isKioskMode ? 'p-4' : 'p-3'}`}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 transition-all"
                style={{ backgroundColor: 'var(--warm-progress-bg)', border: '2px solid var(--warm-progress-primary)' }}>
                <Plus className="h-4 w-4" style={{ color: 'var(--warm-progress-primary)' }} />
              </div>
              <div className="flex-1">
                <div className={`font-semibold task-name`} style={{ color: 'var(--warm-text-primary)' }}>{task.name}</div>
                {task.description && (
                  <div className={`task-desc mt-1`} style={{ color: 'var(--warm-text-secondary)' }}>{task.description}</div>
                )}
              </div>
              <div className="text-sm font-semibold" style={{ color: 'var(--warm-progress-primary)' }}>
                {task.completionCount || 0}
              </div>
            </div>
          </button>
        );

      case TaskType.PROGRESS:
        return (
          <div className="space-y-3">
            <div className={`flex gap-3 ${isKioskMode ? 'progress-controls' : ''}`}>
              <input
                type="number"
                min="1"
                max="999"
                value={progressValues[task.id] || ''}
                onChange={(e) =>
                  setProgressValues({ ...progressValues, [task.id]: e.target.value })
                }
                placeholder="0"
                className={`flex-1 rounded-lg border-2 px-4 ${isKioskMode ? 'progress-input' : 'text-lg h-14'}`}
                style={{ borderColor: 'var(--warm-border-light)' }}
              />
              <button
                onClick={() => handleComplete(task)}
                disabled={isTaskPending}
                className={`warm-progress-button font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-wait ${
                  isKioskMode ? 'progress-button' : 'px-4 py-3 text-base'
                }`}
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add {task.unit}
                </div>
              </button>
            </div>
            <div className="text-center">
              <div className={`font-semibold ${isKioskMode ? 'goal-stats' : 'text-lg'}`} style={{ color: 'var(--warm-text-primary)' }}>
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
    <div className={`h-full flex flex-col ${isKioskMode ? 'kiosk-mode' : 'dashboard-mode'}`}>
      {title && <h3 className="font-bold mb-3 px-2" style={{ color: 'var(--warm-text-primary)' }}>{title}</h3>}
      <div className="flex-1 overflow-auto space-y-2">
        {/* Incomplete tasks */}
        {incompleteTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl p-3 transition-shadow"
            style={{
              backgroundColor: 'var(--warm-card-bg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <TaskWithGoals taskId={task.id}>
              {task.type === TaskType.PROGRESS && (
                <div className="mb-2">
                  <h4 className={`font-bold ${isKioskMode ? 'text-xl' : 'text-base'}`} style={{ color: 'var(--warm-text-primary)' }}>{task.name}</h4>
                  {task.description && (
                    <p className={`mt-1 ${isKioskMode ? 'text-base' : 'text-xs'}`} style={{ color: 'var(--warm-text-secondary)' }}>{task.description}</p>
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
              <div className="border-t my-4" style={{ borderColor: 'var(--warm-border-light)' }}></div>
            )}
            {completeTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl p-3 transition-shadow opacity-75"
                style={{
                  backgroundColor: 'var(--warm-card-bg)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <TaskWithGoals taskId={task.id}>
                  {task.type === TaskType.PROGRESS && (
                    <div className="mb-2">
                      <h4 className={`font-bold ${isKioskMode ? 'text-xl' : 'text-base'}`} style={{ color: 'var(--warm-text-primary)' }}>{task.name}</h4>
                      {task.description && (
                        <p className={`mt-1 ${isKioskMode ? 'text-base' : 'text-xs'}`} style={{ color: 'var(--warm-text-secondary)' }}>{task.description}</p>
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
          <div className="text-center py-8" style={{ color: 'var(--warm-text-secondary)' }}>
            <div className="text-4xl mb-2">✓</div>
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
