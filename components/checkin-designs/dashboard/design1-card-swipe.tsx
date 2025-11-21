'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, ChevronLeft, ChevronRight, Star, Trophy } from 'lucide-react';
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

interface Design1CardSwipeProps {
  personName: string;
  tasks: Task[];
  goals: Goal[];
  onComplete: (taskId: string, value?: string) => void;
  onClose: () => void;
  isPending: boolean;
}

/**
 * Dashboard Check-in Design 1: Card-based Swipeable Layout
 *
 * Features:
 * - Large, swipeable cards optimized for one-handed use
 * - High contrast colors for seniors
 * - Big emoji and visual feedback for kids
 * - Celebration animations on completion
 * - Large touch targets (minimum 56px)
 */
export function Design1CardSwipe({
  personName,
  tasks,
  goals,
  onComplete,
  onClose,
  isPending,
}: Design1CardSwipeProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [progressValue, setProgressValue] = useState('');

  const incompleteTasks = tasks.filter(t => !t.isComplete);
  const currentTask = incompleteTasks[currentTaskIndex];
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.isComplete).length;
  const progressPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Active goals
  const activeGoals = goals.filter(g => !g.progress?.achieved);
  const completedGoals = goals.filter(g => g.progress?.achieved).length;

  const handleComplete = () => {
    if (!currentTask) return;

    if (currentTask.type === TaskType.PROGRESS) {
      if (!progressValue || parseInt(progressValue, 10) <= 0) {
        alert('Please enter a value');
        return;
      }
      onComplete(currentTask.id, progressValue);
      setProgressValue('');
    } else {
      onComplete(currentTask.id);
    }

    // Show celebration
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      // Move to next task
      if (currentTaskIndex < incompleteTasks.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
      }
    }, 1500);
  };

  const handleNext = () => {
    if (currentTaskIndex < incompleteTasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="text-center animate-in zoom-in duration-500">
            <div className="text-9xl mb-4 animate-bounce">🎉</div>
            <div className="text-4xl font-bold text-white drop-shadow-lg">
              Great Job!
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{personName}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {completedCount} of {totalTasks} tasks done
            </p>
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="h-14 w-14 rounded-full"
          >
            <X className="h-8 w-8" />
          </Button>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4">
          <Progress value={progressPercentage} className="h-3 bg-gray-200" />
        </div>

        {/* Goals Summary */}
        {goals.length > 0 && (
          <div className="mt-4 flex items-center gap-2 bg-amber-50 rounded-xl p-3">
            <Trophy className="h-6 w-6 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {completedGoals} of {goals.length} goals achieved
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 overflow-hidden">
        {incompleteTasks.length === 0 ? (
          // All Done State
          <div className="text-center animate-in zoom-in duration-500">
            <div className="text-9xl mb-6 animate-bounce">🎊</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">All Done!</h2>
            <p className="text-xl text-gray-600 mb-8">You completed all your tasks!</p>
            <Button
              onClick={onClose}
              size="lg"
              className="h-16 px-12 text-xl rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-xl"
            >
              <Check className="h-6 w-6 mr-3" />
              Finish
            </Button>
          </div>
        ) : currentTask ? (
          // Task Card
          <div className="w-full max-w-md animate-in slide-in-from-right duration-300">
            {/* Card Counter */}
            <div className="text-center mb-4">
              <span className="text-lg font-bold text-gray-700">
                Task {currentTaskIndex + 1} of {incompleteTasks.length}
              </span>
            </div>

            {/* Main Task Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-gray-100">
              {/* Task Emoji/Icon */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                  <span className="text-5xl">
                    {currentTask.emoji || '📋'}
                  </span>
                </div>
              </div>

              {/* Task Name */}
              <h3 className="text-3xl font-bold text-gray-900 text-center mb-3">
                {currentTask.name}
              </h3>

              {/* Task Description */}
              {currentTask.description && (
                <p className="text-lg text-gray-600 text-center mb-6">
                  {currentTask.description}
                </p>
              )}

              {/* Task Type Badge */}
              <div className="flex justify-center mb-6">
                {currentTask.type === TaskType.SIMPLE && (
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    ✓ Simple Task
                  </span>
                )}
                {currentTask.type === TaskType.MULTIPLE_CHECKIN && (
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    ✔️ Check-in ({currentTask.completionCount || 0}/9)
                  </span>
                )}
                {currentTask.type === TaskType.PROGRESS && (
                  <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                    📊 Progress Tracker
                  </span>
                )}
              </div>

              {/* Progress Input for PROGRESS type */}
              {currentTask.type === TaskType.PROGRESS && (
                <div className="mb-6">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={progressValue}
                    onChange={(e) => setProgressValue(e.target.value)}
                    placeholder={`Enter ${currentTask.unit || 'value'}`}
                    className="w-full h-20 text-3xl text-center font-bold border-4 border-gray-200 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  />
                  <p className="text-center text-sm text-gray-500 mt-2">
                    {currentTask.unit || 'units'}
                  </p>
                </div>
              )}

              {/* Complete Button */}
              <Button
                onClick={handleComplete}
                disabled={isPending}
                className="w-full h-20 text-2xl font-bold rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-xl disabled:opacity-50 transition-all transform active:scale-95"
              >
                <Check className="h-8 w-8 mr-3" />
                Complete Task
              </Button>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-6">
              <Button
                onClick={handlePrevious}
                disabled={currentTaskIndex === 0}
                variant="outline"
                className="flex-1 h-16 text-lg font-semibold rounded-2xl border-2 disabled:opacity-30"
              >
                <ChevronLeft className="h-6 w-6 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentTaskIndex === incompleteTasks.length - 1}
                variant="outline"
                className="flex-1 h-16 text-lg font-semibold rounded-2xl border-2 disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-6 w-6 ml-2" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Active Goals Footer */}
      {activeGoals.length > 0 && incompleteTasks.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Active Goals
          </h4>
          <div className="space-y-2">
            {activeGoals.slice(0, 2).map((goal) => (
              <div key={goal.id} className="flex items-center gap-3">
                <span className="text-xl">{goal.icon || '🎯'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{goal.name}</p>
                  <Progress
                    value={goal.progress?.percentage || 0}
                    className="h-2 mt-1"
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {Math.round(goal.progress?.percentage || 0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
