'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, Plus, Target, Award, TrendingUp, ArrowRight } from 'lucide-react';
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
    current: number;
    target: number;
  };
}

interface KioskDesign2SplitScreenProps {
  personName: string;
  tasks: Task[];
  goals: Goal[];
  onComplete: (taskId: string, value?: string) => void;
  onClose: () => void;
  isPending: boolean;
}

/**
 * Kiosk Check-in Design 2: Split-screen Goals and Tasks
 *
 * Features:
 * - Two-panel layout: Goals on left, Tasks on right
 * - Real-time goal progress visualization
 * - Task completion shows immediate goal impact
 * - Large touch targets for tablet use
 * - Clear visual separation of concerns
 * - Progress-focused design
 */
export function KioskDesign2SplitScreen({
  personName,
  tasks,
  goals,
  onComplete,
  onClose,
  isPending,
}: KioskDesign2SplitScreenProps) {
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.isComplete).length;
  const activeGoals = goals.filter(g => !g.progress?.achieved);
  const achievedGoals = goals.filter(g => g.progress?.achieved);

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
    setSelectedTask(null);
  };

  const incompleteTasks = tasks.filter(t => !t.isComplete);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black text-white drop-shadow-lg mb-2">
              {personName}'s Progress
            </h1>
            <p className="text-2xl text-blue-100">
              {completedCount} of {totalTasks} tasks completed today
            </p>
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="h-20 w-20 rounded-full bg-white/20 hover:bg-white/30"
          >
            <X className="h-10 w-10 text-white" />
          </Button>
        </div>
      </div>

      {/* Split Screen Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Goals */}
        <div className="w-2/5 bg-gradient-to-br from-amber-50 to-orange-50 p-8 overflow-auto border-r-4 border-amber-200">
          <div className="mb-6">
            <h2 className="text-4xl font-black text-gray-900 flex items-center gap-3 mb-2">
              <Target className="h-10 w-10 text-amber-600" />
              Your Goals
            </h2>
            <p className="text-xl text-gray-600">
              {achievedGoals.length} of {goals.length} achieved
            </p>
          </div>

          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Target className="h-24 w-24 text-gray-300 mb-4" />
              <p className="text-2xl text-gray-500">No goals set yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Goals */}
              {activeGoals.length > 0 && (
                <>
                  <h3 className="text-2xl font-bold text-gray-700 mb-3">Active</h3>
                  {activeGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-white rounded-3xl shadow-lg p-6 border-4 border-amber-200"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-4xl">{goal.icon || '🎯'}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-900 mb-1">{goal.name}</h4>
                          <p className="text-lg text-gray-600">
                            {goal.progress?.current || 0} / {goal.progress?.target || 0}
                          </p>
                        </div>
                      </div>
                      <Progress
                        value={goal.progress?.percentage || 0}
                        className="h-6 bg-amber-100 mb-2"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-amber-900">
                          {Math.round(goal.progress?.percentage || 0)}%
                        </span>
                        <span className="text-base text-gray-600">
                          {Math.round((goal.progress?.target || 0) - (goal.progress?.current || 0))} to go
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Achieved Goals */}
              {achievedGoals.length > 0 && (
                <>
                  <h3 className="text-2xl font-bold text-gray-700 mb-3 mt-6">Achieved</h3>
                  {achievedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl shadow-lg p-6 border-4 border-green-400"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center">
                          <Award className="h-10 w-10 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-900">{goal.name}</h4>
                          <p className="text-lg text-green-700 font-semibold">🎉 Complete!</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Tasks */}
        <div className="flex-1 bg-white p-8 overflow-auto">
          <div className="mb-6">
            <h2 className="text-4xl font-black text-gray-900 flex items-center gap-3 mb-2">
              <Check className="h-10 w-10 text-blue-600" />
              Today's Tasks
            </h2>
            <p className="text-xl text-gray-600">
              Complete tasks to progress your goals
            </p>
          </div>

          {incompleteTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-9xl mb-6 animate-bounce">🎉</div>
              <h3 className="text-5xl font-black text-gray-900 mb-4">All Done!</h3>
              <p className="text-2xl text-gray-600">You completed all your tasks!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl shadow-lg p-6 border-4 transition-all ${
                    selectedTask === task.id
                      ? 'border-blue-500 shadow-2xl'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Task Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-5xl">{task.emoji || '📋'}</span>
                    </div>

                    {/* Task Info */}
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-gray-900 mb-1">{task.name}</h3>
                      {task.description && (
                        <p className="text-lg text-gray-600 mb-3">{task.description}</p>
                      )}

                      {/* Task Type Badge */}
                      <div className="mb-4">
                        {task.type === TaskType.SIMPLE && (
                          <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-base font-bold">
                            ✓ Simple Task
                          </span>
                        )}
                        {task.type === TaskType.MULTIPLE_CHECKIN && (
                          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-base font-bold">
                            Check-in {task.completionCount || 0}/9
                          </span>
                        )}
                        {task.type === TaskType.PROGRESS && (
                          <span className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-base font-bold">
                            📊 Track {task.unit || 'Progress'}
                          </span>
                        )}
                      </div>

                      {/* Progress Input for PROGRESS type */}
                      {task.type === TaskType.PROGRESS && selectedTask === task.id && (
                        <div className="mb-4 animate-in slide-in-from-top duration-300">
                          <div className="flex gap-3">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={progressValues[task.id] || ''}
                              onChange={(e) =>
                                setProgressValues({ ...progressValues, [task.id]: e.target.value })
                              }
                              placeholder="0"
                              className="flex-1 h-20 text-3xl text-center font-bold border-4 border-purple-300 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none"
                              autoFocus
                            />
                            <div className="flex flex-col justify-center">
                              <span className="text-xl font-bold text-gray-700">
                                {task.unit || 'units'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        onClick={() => {
                          if (task.type === TaskType.PROGRESS && selectedTask !== task.id) {
                            setSelectedTask(task.id);
                          } else {
                            handleComplete(task);
                          }
                        }}
                        disabled={isPending}
                        className="w-full h-20 text-2xl font-black rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg disabled:opacity-50 transition-all transform active:scale-95"
                      >
                        {task.type === TaskType.PROGRESS && selectedTask !== task.id ? (
                          <>
                            <Plus className="h-7 w-7 mr-2" />
                            Add {task.unit || 'Progress'}
                          </>
                        ) : (
                          <>
                            <Check className="h-7 w-7 mr-2" />
                            Complete Task
                            <ArrowRight className="h-7 w-7 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
