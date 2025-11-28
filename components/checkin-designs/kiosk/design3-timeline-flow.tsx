'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, Plus, Circle, CheckCircle2, Trophy, Star } from 'lucide-react';
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
}

interface Goal {
  id: string;
  name: string;
  icon?: string | null;
  progress?: {
    percentage: number;
    achieved: boolean;
  };
}

interface KioskDesign3TimelineFlowProps {
  personName: string;
  tasks: Task[];
  goals: Goal[];
  onComplete: (taskId: string, value?: string) => void;
  onClose: () => void;
  isPending: boolean;
}

/**
 * Kiosk Check-in Design 3: Timeline Vertical Flow
 *
 * Features:
 * - Vertical timeline showing progression through tasks
 * - Clear visual flow from top to bottom
 * - Connected dots showing progress
 * - One task at a time focus
 * - Milestone celebrations at intervals
 * - Easy to understand for kids and seniors
 * - Large, clear visuals
 */
export function KioskDesign3TimelineFlow({
  personName,
  tasks,
  goals,
  onComplete,
  onClose,
  isPending,
}: KioskDesign3TimelineFlowProps) {
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.isComplete).length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

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

  // Find the current task (first incomplete)
  const currentTaskIndex = tasks.findIndex(t => !t.isComplete);
  const allComplete = currentTaskIndex === -1;

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-xl px-8 py-6 border-b-4 border-purple-300">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-5xl font-black text-gray-900 mb-3">{personName}'s Journey</h1>
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md">
                  <Progress value={progressPercentage} className="h-6 bg-gray-200" />
                </div>
                <span className="text-2xl font-bold text-gray-700">
                  {completedCount} / {totalTasks}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={onClose}
              className="h-20 w-20 rounded-full hover:bg-red-100"
            >
              <X className="h-10 w-10 text-gray-600" />
            </Button>
          </div>

          {/* Goals Summary */}
          {goals.length > 0 && (
            <div className="mt-4 flex items-center gap-3 bg-amber-50 rounded-2xl p-4 border-2 border-amber-200">
              <Trophy className="h-8 w-8 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-lg font-bold text-amber-900">
                  {goals.filter(g => g.progress?.achieved).length} of {goals.length} goals achieved
                </p>
              </div>
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-amber-300"
                >
                  <span className="text-2xl">{goal.icon || '🎯'}</span>
                  <span className="text-base font-semibold text-gray-900">
                    {Math.round(goal.progress?.percentage || 0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-auto px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {allComplete ? (
            // Victory Screen
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-[150px] mb-8 animate-bounce">🏆</div>
              <h2 className="text-7xl font-black text-gray-900 mb-6">Journey Complete!</h2>
              <p className="text-3xl text-gray-600 mb-8">
                You finished all {totalTasks} tasks!
              </p>
              <div className="flex gap-6">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-yellow-400"
                  >
                    <div className="text-5xl mb-3">{goal.icon || '🎯'}</div>
                    <div className="text-2xl font-bold text-gray-900">{goal.name}</div>
                    <div className="text-xl text-green-600 font-bold mt-2">
                      {Math.round(goal.progress?.percentage || 0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Timeline
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-12 top-0 bottom-0 w-2 bg-gradient-to-b from-blue-300 via-purple-300 to-pink-300 rounded-full"></div>

              {/* Tasks */}
              <div className="space-y-8">
                {tasks.map((task, index) => {
                  const isComplete = task.isComplete;
                  const isCurrent = index === currentTaskIndex;
                  const isPast = index < currentTaskIndex;
                  const isFuture = index > currentTaskIndex;

                  return (
                    <div
                      key={task.id}
                      className={`relative pl-32 transition-all duration-500 ${
                        isCurrent ? 'scale-105' : isComplete ? 'opacity-90' : 'opacity-50'
                      }`}
                    >
                      {/* Timeline Node */}
                      <div className="absolute left-0 top-8">
                        <div
                          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-8 transition-all ${
                            isComplete
                              ? 'bg-green-500 border-green-300'
                              : isCurrent
                              ? 'bg-white border-blue-400 animate-pulse'
                              : 'bg-gray-200 border-gray-300'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="h-12 w-12 text-white" />
                          ) : isCurrent ? (
                            <Circle className="h-12 w-12 text-blue-500 fill-blue-500" />
                          ) : (
                            <Circle className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        {/* Step Number */}
                        <div className="text-center mt-2">
                          <span className="text-lg font-bold text-gray-600">
                            Step {index + 1}
                          </span>
                        </div>
                      </div>

                      {/* Task Card */}
                      <div
                        className={`rounded-3xl shadow-xl p-8 border-4 transition-all ${
                          isComplete
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                            : isCurrent
                            ? 'bg-white border-blue-400 shadow-2xl'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        {/* Task Header */}
                        <div className="flex items-start gap-6 mb-4">
                          <div
                            className={`w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                              isComplete
                                ? 'bg-green-500'
                                : isCurrent
                                ? 'bg-gradient-to-br from-blue-400 to-purple-500'
                                : 'bg-gray-300'
                            }`}
                          >
                            {isComplete ? (
                              <Check className="h-14 w-14 text-white" />
                            ) : (
                              <span className="text-6xl">{task.emoji || '📋'}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-4xl font-black text-gray-900 mb-2">
                              {task.name}
                            </h3>
                            {task.description && (
                              <p className="text-xl text-gray-600">{task.description}</p>
                            )}
                          </div>
                          {isComplete && (
                            <Star className="h-16 w-16 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                        </div>

                        {/* Task Type Badge */}
                        <div className="mb-6">
                          {task.type === TaskType.SIMPLE && (
                            <span className="inline-block px-6 py-3 bg-green-100 text-green-800 rounded-full text-xl font-bold">
                              ✓ Simple Task
                            </span>
                          )}
                          {task.type === TaskType.MULTIPLE_CHECKIN && (
                            <span className="inline-block px-6 py-3 bg-blue-100 text-blue-800 rounded-full text-xl font-bold">
                              Check-in {task.completionCount || 0}/9
                            </span>
                          )}
                          {task.type === TaskType.PROGRESS && (
                            <span className="inline-block px-6 py-3 bg-purple-100 text-purple-800 rounded-full text-xl font-bold">
                              📊 Track {task.unit || 'Progress'}
                            </span>
                          )}
                        </div>

                        {/* Action Area - Only for current task */}
                        {isCurrent && !isComplete && (
                          <div className="space-y-4">
                            {/* Progress Input for PROGRESS type */}
                            {task.type === TaskType.PROGRESS && (
                              <div>
                                <input
                                  type="number"
                                  min="1"
                                  max="999"
                                  value={progressValues[task.id] || ''}
                                  onChange={(e) =>
                                    setProgressValues({
                                      ...progressValues,
                                      [task.id]: e.target.value,
                                    })
                                  }
                                  placeholder="0"
                                  className="w-full h-24 text-4xl text-center font-black border-4 border-purple-300 rounded-3xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                                />
                                <p className="text-center text-xl text-gray-600 font-semibold mt-3">
                                  {task.unit || 'units'}
                                </p>
                              </div>
                            )}

                            {/* Complete Button */}
                            <Button
                              onClick={() => handleComplete(task)}
                              disabled={isPending}
                              className="w-full h-24 text-3xl font-black rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl disabled:opacity-50 transition-all transform active:scale-95"
                            >
                              <Check className="h-10 w-10 mr-4" />
                              Complete & Continue
                            </Button>
                          </div>
                        )}

                        {/* Completion Status */}
                        {isComplete && (
                          <div className="bg-green-100 rounded-2xl p-4 border-2 border-green-300">
                            <p className="text-2xl font-bold text-green-800 text-center">
                              ✓ Completed!
                            </p>
                          </div>
                        )}

                        {/* Future Task Indicator */}
                        {isFuture && (
                          <div className="bg-gray-100 rounded-2xl p-4 border-2 border-gray-300">
                            <p className="text-xl font-semibold text-gray-500 text-center">
                              Coming up next...
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Milestone Celebration */}
                      {isComplete && (index + 1) % 3 === 0 && (
                        <div className="mt-6 text-center">
                          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-full px-8 py-4 border-4 border-yellow-400 shadow-lg">
                            <Trophy className="h-10 w-10 text-orange-600" />
                            <span className="text-2xl font-black text-gray-900">
                              Milestone Reached! {index + 1} {index + 1 === 1 ? 'Task' : 'Tasks'} Done!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
