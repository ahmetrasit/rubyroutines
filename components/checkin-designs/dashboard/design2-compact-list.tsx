'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, Plus, Target, TrendingUp, Circle } from 'lucide-react';
import { TaskType } from '@/lib/types/prisma-enums';
import { Progress } from '@/components/ui/progress';

interface Task {
  id: string;
  name: string;
  description?: string | null;
  type: TaskType;
  unit?: string | null;
  isComplete?: boolean;
  completionCount?: number;
  emoji?: string | null;
  color?: string | null;
}

interface Goal {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  progress?: {
    percentage: number;
    achieved: boolean;
    current: number;
    target: number;
  };
}

interface Design2CompactListProps {
  personName: string;
  tasks: Task[];
  goals: Goal[];
  onComplete: (taskId: string, value?: string) => void;
  onClose: () => void;
  isPending: boolean;
}

/**
 * Dashboard Check-in Design 2: Compact List with Color Indicators
 *
 * Features:
 * - Efficient use of screen space for quick check-ins
 * - Color-coded task status (red/yellow/green)
 * - Inline progress tracking
 * - Quick-tap completion for simple tasks
 * - Sticky header with progress overview
 * - Category grouping by task type
 */
export function Design2CompactList({
  personName,
  tasks,
  goals,
  onComplete,
  onClose,
  isPending,
}: Design2CompactListProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.isComplete).length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Group tasks by type
  const simpleTasks = tasks.filter(t => t.type === TaskType.SIMPLE);
  const multiTasks = tasks.filter(t => t.type === TaskType.MULTIPLE_CHECKIN);
  const progressTasks = tasks.filter(t => t.type === TaskType.PROGRESS);

  // Goal stats
  const activeGoals = goals.filter(g => !g.progress?.achieved);
  const completedGoals = goals.filter(g => g.progress?.achieved).length;

  const handleQuickComplete = (taskId: string) => {
    onComplete(taskId);
  };

  const handleProgressComplete = (taskId: string) => {
    const value = progressValues[taskId];
    if (!value || parseInt(value, 10) <= 0) {
      alert('Please enter a value');
      return;
    }
    onComplete(taskId, value);
    setProgressValues({ ...progressValues, [taskId]: '' });
    setExpandedTask(null);
  };

  const getTaskStatusColor = (task: Task) => {
    if (task.isComplete) return 'bg-green-500';
    if (task.type === TaskType.MULTIPLE_CHECKIN && (task.completionCount || 0) > 0) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  const getTaskStatusText = (task: Task) => {
    if (task.isComplete) return 'Done';
    if (task.type === TaskType.MULTIPLE_CHECKIN) return `${task.completionCount || 0}/9`;
    return 'To Do';
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{personName}</h1>
              <p className="text-xs text-gray-500 mt-0.5">Quick Check-in</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Compact Progress Summary */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-700">Tasks</span>
                <span className="text-sm font-bold text-gray-900">
                  {completedCount}/{totalTasks}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            {goals.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-2 bg-amber-100 rounded-lg">
                <Target className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-900">
                  {completedGoals}/{goals.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h2>
            <p className="text-gray-600 text-center">You've completed everything</p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {/* Simple Tasks Section */}
            {simpleTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-gray-600" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Simple Tasks
                  </h2>
                  <span className="text-xs text-gray-500">
                    ({simpleTasks.filter(t => t.isComplete).length}/{simpleTasks.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {simpleTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => !task.isComplete && handleQuickComplete(task.id)}
                      disabled={task.isComplete || isPending}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        task.isComplete
                          ? 'bg-green-50 border-green-200 opacity-60'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      {/* Status Indicator */}
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full ${getTaskStatusColor(task)} flex items-center justify-center`}>
                          {task.isComplete ? (
                            <Check className="h-6 w-6 text-white" />
                          ) : (
                            <span className="text-xl">{task.emoji || '📌'}</span>
                          )}
                        </div>
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 text-left">
                        <h3 className="text-base font-semibold text-gray-900 leading-tight">
                          {task.name}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        task.isComplete
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getTaskStatusText(task)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple Check-in Tasks Section */}
            {multiTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="h-4 w-4 text-gray-600" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Check-ins
                  </h2>
                  <span className="text-xs text-gray-500">({multiTasks.length})</span>
                </div>
                <div className="space-y-2">
                  {multiTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleQuickComplete(task.id)}
                      disabled={isPending}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 bg-white border-gray-200 hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      {/* Status Indicator */}
                      <div className={`w-10 h-10 rounded-full ${getTaskStatusColor(task)} flex items-center justify-center`}>
                        <Plus className="h-5 w-5 text-white" />
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 text-left">
                        <h3 className="text-base font-semibold text-gray-900 leading-tight">
                          {task.name}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Count Badge */}
                      <div className="px-3 py-1.5 rounded-full bg-blue-100 text-sm font-bold text-blue-900">
                        {task.completionCount || 0}/9
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Tasks Section */}
            {progressTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Progress Tracking
                  </h2>
                  <span className="text-xs text-gray-500">({progressTasks.length})</span>
                </div>
                <div className="space-y-2">
                  {progressTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border-2 bg-white border-gray-200"
                    >
                      <button
                        onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                        className="w-full flex items-center gap-3"
                      >
                        {/* Status Indicator */}
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>

                        {/* Task Info */}
                        <div className="flex-1 text-left">
                          <h3 className="text-base font-semibold text-gray-900 leading-tight">
                            {task.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Tap to add {task.unit || 'progress'}
                          </p>
                        </div>

                        {/* Expand Indicator */}
                        <Circle className={`h-3 w-3 ${expandedTask === task.id ? 'fill-purple-500' : 'fill-gray-300'}`} />
                      </button>

                      {/* Expanded Input */}
                      {expandedTask === task.id && (
                        <div className="mt-3 pt-3 border-t border-gray-200 animate-in slide-in-from-top duration-200">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={progressValues[task.id] || ''}
                              onChange={(e) =>
                                setProgressValues({ ...progressValues, [task.id]: e.target.value })
                              }
                              placeholder="0"
                              className="flex-1 h-12 text-lg font-semibold text-center border-2 border-gray-300 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none"
                              autoFocus
                            />
                            <Button
                              onClick={() => handleProgressComplete(task.id)}
                              disabled={isPending}
                              className="h-12 px-6 bg-purple-500 hover:bg-purple-600 rounded-lg"
                            >
                              <Plus className="h-5 w-5 mr-1" />
                              Add
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 text-center mt-2">
                            {task.unit || 'units'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Goals Section */}
            {activeGoals.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-gray-600" />
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Active Goals
                  </h2>
                  <span className="text-xs text-gray-500">({activeGoals.length})</span>
                </div>
                <div className="space-y-2">
                  {activeGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-3 rounded-xl border-2 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{goal.icon || '🎯'}</span>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">{goal.name}</h3>
                        </div>
                        <span className="text-sm font-bold text-amber-900">
                          {Math.round(goal.progress?.percentage || 0)}%
                        </span>
                      </div>
                      <Progress
                        value={goal.progress?.percentage || 0}
                        className="h-2 bg-amber-100"
                      />
                      {goal.progress && (
                        <p className="text-xs text-gray-600 text-center mt-1">
                          {goal.progress.current} / {goal.progress.target}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with Quick Stats */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-center gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalTasks - completedCount}</div>
            <div className="text-xs text-gray-600">Remaining</div>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{completedGoals}</div>
            <div className="text-xs text-gray-600">Goals</div>
          </div>
        </div>
      </div>
    </div>
  );
}
