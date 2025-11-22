'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, Plus, Star, Trophy } from 'lucide-react';
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
  progress?: {
    percentage: number;
    achieved: boolean;
  };
}

interface KioskDesign1GridTilesProps {
  personName: string;
  tasks: Task[];
  goals: Goal[];
  onComplete: (taskId: string, value?: string) => void;
  onClose: () => void;
  isPending: boolean;
}

/**
 * Kiosk Check-in Design 1: Grid-based Touchable Tiles
 *
 * Features:
 * - Large grid tiles optimized for tablet touchscreen
 * - 2-column layout for efficiency
 * - Big touch targets (minimum 120px height)
 * - Color-coded task states
 * - Visual feedback with animations
 * - Senior-friendly with high contrast
 * - Kid-friendly with emojis and colors
 */
export function KioskDesign1GridTiles({
  personName,
  tasks,
  goals,
  onComplete,
  onClose,
  isPending,
}: KioskDesign1GridTilesProps) {
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});
  const [showCelebration, setShowCelebration] = useState(false);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.isComplete).length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
  const completedGoals = goals.filter(g => g.progress?.achieved).length;

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

    if (completedCount + 1 === totalTasks) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const incompleteTasks = tasks.filter(t => !t.isComplete);
  const completeTasks = tasks.filter(t => t.isComplete);

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in">
          <div className="text-center animate-in zoom-in duration-700">
            <div className="text-[200px] mb-8 animate-bounce">🎉</div>
            <div className="text-7xl font-black text-white drop-shadow-2xl">
              ALL DONE!
            </div>
            <div className="text-4xl text-white mt-4 drop-shadow-lg">
              Great Job, {personName}!
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-lg px-8 py-6 border-b-4 border-blue-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-5xl font-black text-gray-900 mb-2">{personName}'s Check-in</h1>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Check className="h-8 w-8 text-green-600" />
                  <span className="text-2xl font-bold text-gray-700">
                    {completedCount} / {totalTasks} Tasks
                  </span>
                </div>
                {goals.length > 0 && (
                  <>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-amber-600" />
                      <span className="text-2xl font-bold text-gray-700">
                        {completedGoals} / {goals.length} Goals
                      </span>
                    </div>
                  </>
                )}
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
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-4 bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Main Content - Grid */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-9xl mb-6">🎊</div>
              <h2 className="text-6xl font-black text-gray-900 mb-4">All Done!</h2>
              <p className="text-3xl text-gray-600">You completed everything!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Incomplete Tasks Grid */}
              {incompleteTasks.length > 0 && (
                <div>
                  <h2 className="text-3xl font-black text-gray-800 mb-4 flex items-center gap-3">
                    <span className="w-3 h-12 bg-blue-500 rounded-full"></span>
                    To Do ({incompleteTasks.length})
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {incompleteTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white rounded-3xl shadow-xl border-4 border-gray-200 p-6 hover:border-blue-400 transition-all"
                      >
                        {/* Task Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-5xl">{task.emoji || '📋'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                              {task.name}
                            </h3>
                            {task.description && (
                              <p className="text-base text-gray-600 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

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
                              📊 Track Progress
                            </span>
                          )}
                        </div>

                        {/* Progress Input for PROGRESS type */}
                        {task.type === TaskType.PROGRESS && (
                          <div className="mb-4">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={progressValues[task.id] || ''}
                              onChange={(e) =>
                                setProgressValues({ ...progressValues, [task.id]: e.target.value })
                              }
                              placeholder="0"
                              className="w-full h-20 text-3xl text-center font-bold border-4 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none"
                            />
                            <p className="text-center text-base text-gray-600 font-semibold mt-2">
                              {task.unit || 'units'}
                            </p>
                          </div>
                        )}

                        {/* Complete Button */}
                        <Button
                          onClick={() => handleComplete(task)}
                          disabled={isPending}
                          className="w-full h-20 text-2xl font-black rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg disabled:opacity-50 transition-all transform active:scale-95"
                        >
                          <Check className="h-8 w-8 mr-3" />
                          Complete
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks Grid */}
              {completeTasks.length > 0 && (
                <div>
                  <h2 className="text-3xl font-black text-gray-800 mb-4 flex items-center gap-3">
                    <span className="w-3 h-12 bg-green-500 rounded-full"></span>
                    Completed ({completeTasks.length})
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {completeTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-lg border-4 border-green-300 p-6"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-2xl bg-green-500 flex items-center justify-center flex-shrink-0">
                            <Check className="h-12 w-12 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900">{task.name}</h3>
                          </div>
                          <Star className="h-12 w-12 text-yellow-500 fill-yellow-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals Section */}
              {goals.length > 0 && (
                <div>
                  <h2 className="text-3xl font-black text-gray-800 mb-4 flex items-center gap-3">
                    <span className="w-3 h-12 bg-amber-500 rounded-full"></span>
                    Goals ({goals.length})
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {goals.map((goal) => (
                      <div
                        key={goal.id}
                        className={`rounded-3xl shadow-lg p-6 ${
                          goal.progress?.achieved
                            ? 'bg-gradient-to-br from-yellow-200 to-orange-200 border-4 border-yellow-400'
                            : 'bg-white border-4 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-6xl">{goal.icon || '🎯'}</span>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{goal.name}</h3>
                            {!goal.progress?.achieved && (
                              <Progress
                                value={goal.progress?.percentage || 0}
                                className="h-4 bg-gray-200"
                              />
                            )}
                          </div>
                          {goal.progress?.achieved && (
                            <Trophy className="h-12 w-12 text-orange-600" />
                          )}
                        </div>
                        <p className="text-xl font-bold text-gray-700 text-center">
                          {goal.progress?.achieved
                            ? '🎉 ACHIEVED!'
                            : `${Math.round(goal.progress?.percentage || 0)}% Complete`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
