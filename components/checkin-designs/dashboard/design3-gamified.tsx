'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, Star, Sparkles, Zap, Award, Crown } from 'lucide-react';
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

interface Design3GamifiedProps {
  personName: string;
  tasks: Task[];
  goals: Goal[];
  onComplete: (taskId: string, value?: string) => void;
  onClose: () => void;
  isPending: boolean;
}

/**
 * Dashboard Check-in Design 3: Gamified Celebration Design
 *
 * Features:
 * - Fun, game-like interface with achievements
 * - Animated star/coin rewards on completion
 * - Streak tracking and motivation
 * - Large emoji reactions
 * - Level/XP system visualization
 * - Optimized for kids with bright colors and celebrations
 */
export function Design3Gamified({
  personName,
  tasks,
  goals,
  onComplete,
  onClose,
  isPending,
}: Design3GamifiedProps) {
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});
  const [showReward, setShowReward] = useState(false);
  const [rewardType, setRewardType] = useState<'star' | 'coin' | 'trophy'>('star');
  const [confetti, setConfetti] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.isComplete).length;
  const completedGoals = goals.filter(g => g.progress?.achieved).length;

  // Calculate "level" and "XP" for gamification
  const level = Math.floor(completedCount / 3) + 1;
  const xpInLevel = completedCount % 3;
  const xpForNextLevel = 3;

  const incompleteTasks = tasks.filter(t => !t.isComplete);
  const completeTasks = tasks.filter(t => t.isComplete);

  const triggerReward = (type: 'star' | 'coin' | 'trophy' = 'star') => {
    setRewardType(type);
    setShowReward(true);

    // Create confetti
    const newConfetti = Array.from({ length: 15 }, (_, i) => ({
      id: Date.now() + i,
      emoji: ['⭐', '✨', '🎉', '🎊', '💫'][Math.floor(Math.random() * 5)],
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setConfetti(newConfetti);

    setTimeout(() => {
      setShowReward(false);
      setConfetti([]);
    }, 2000);
  };

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

    // Trigger reward animation
    if (completedCount + 1 === totalTasks) {
      triggerReward('trophy');
    } else if ((completedCount + 1) % 3 === 0) {
      triggerReward('coin');
    } else {
      triggerReward('star');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col overflow-hidden">
      {/* Reward Animation Overlay */}
      {showReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-in zoom-in duration-500">
            {rewardType === 'star' && (
              <div className="text-9xl animate-bounce drop-shadow-2xl">⭐</div>
            )}
            {rewardType === 'coin' && (
              <div className="text-9xl animate-spin drop-shadow-2xl">🪙</div>
            )}
            {rewardType === 'trophy' && (
              <div className="text-9xl animate-bounce drop-shadow-2xl">🏆</div>
            )}
            <div className="text-3xl font-black text-white mt-4 drop-shadow-lg">
              {rewardType === 'trophy' ? 'CHAMPION!' : rewardType === 'coin' ? 'LEVEL UP!' : 'AWESOME!'}
            </div>
          </div>

          {/* Confetti */}
          {confetti.map((conf) => (
            <div
              key={conf.id}
              className="absolute text-4xl animate-ping"
              style={{
                left: `${conf.x}%`,
                top: `${conf.y}%`,
                animationDuration: '2s',
              }}
            >
              {conf.emoji}
            </div>
          ))}
        </div>
      )}

      {/* Header with Level & XP */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 shadow-2xl px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center">
              <Crown className="h-7 w-7 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white drop-shadow-md">{personName}</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-yellow-100">Level {level}</span>
                <Zap className="h-4 w-4 text-yellow-200" />
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30"
          >
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* XP Bar */}
        <div className="bg-white/20 rounded-full p-1 backdrop-blur-sm">
          <div className="relative">
            <Progress
              value={(xpInLevel / xpForNextLevel) * 100}
              className="h-6 bg-white/30"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-white drop-shadow">
                {xpInLevel}/{xpForNextLevel} XP to Level {level + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-200" />
            <div>
              <div className="text-xs text-white/80 leading-none">Tasks</div>
              <div className="text-lg font-black text-white leading-none mt-0.5">
                {completedCount}/{totalTasks}
              </div>
            </div>
          </div>
          <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-200" />
            <div>
              <div className="text-xs text-white/80 leading-none">Goals</div>
              <div className="text-lg font-black text-white leading-none mt-0.5">
                {completedGoals}/{goals.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-4 py-4">
        {totalTasks === 0 || completedCount === totalTasks ? (
          // Victory Screen
          <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
            <div className="text-8xl mb-6 animate-bounce">🎊</div>
            <h2 className="text-4xl font-black text-white drop-shadow-lg mb-3">
              MISSION COMPLETE!
            </h2>
            <p className="text-xl text-white/90 mb-6">You're a superstar!</p>
            <div className="flex gap-3 mb-8">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl">
                <div className="text-4xl mb-2">⭐</div>
                <div className="text-2xl font-black text-gray-900">{completedCount}</div>
                <div className="text-xs text-gray-600">Stars Earned</div>
              </div>
              <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl">
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-2xl font-black text-gray-900">{completedGoals}</div>
                <div className="text-xs text-gray-600">Goals Met</div>
              </div>
            </div>
            <Button
              onClick={onClose}
              size="lg"
              className="h-16 px-12 text-xl font-black rounded-full bg-white text-purple-600 hover:bg-gray-100 shadow-2xl"
            >
              <Sparkles className="h-6 w-6 mr-2" />
              Finish
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {/* Incomplete Tasks - Primary Focus */}
            {incompleteTasks.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-white drop-shadow-md mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Let's Do This! ({incompleteTasks.length})
                </h2>
                {incompleteTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-3xl shadow-2xl p-5 mb-3 border-4 border-yellow-300"
                  >
                    {/* Task Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-3xl">{task.emoji || '🎯'}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 leading-tight mb-1">
                          {task.name}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Task Type Badge */}
                    <div className="mb-4">
                      {task.type === TaskType.SIMPLE && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                          <Check className="h-4 w-4" />
                          Quick Task
                        </span>
                      )}
                      {task.type === TaskType.MULTIPLE_CHECKIN && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                          <Star className="h-4 w-4" />
                          {task.completionCount || 0}/9 Check-ins
                        </span>
                      )}
                      {task.type === TaskType.PROGRESS && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                          <Zap className="h-4 w-4" />
                          Track Progress
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
                          placeholder="How many?"
                          className="w-full h-16 text-2xl text-center font-black border-4 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none bg-purple-50"
                        />
                        <p className="text-center text-sm text-gray-600 font-semibold mt-2">
                          {task.unit || 'units'}
                        </p>
                      </div>
                    )}

                    {/* Complete Button */}
                    <Button
                      onClick={() => handleComplete(task)}
                      disabled={isPending}
                      className="w-full h-16 text-xl font-black rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 shadow-xl disabled:opacity-50 transition-all transform active:scale-95"
                    >
                      <Check className="h-6 w-6 mr-2" />
                      Complete & Earn Star!
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Tasks - Celebration */}
            {completeTasks.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-white drop-shadow-md mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Completed! ({completeTasks.length})
                </h2>
                {completeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl shadow-lg p-4 mb-2 border-2 border-green-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                        <Check className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900">{task.name}</h3>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active Goals */}
            {goals.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-white drop-shadow-md mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Goals ({goals.length})
                </h2>
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className={`rounded-2xl p-4 shadow-lg ${
                        goal.progress?.achieved
                          ? 'bg-gradient-to-r from-yellow-200 to-orange-200 border-4 border-yellow-400'
                          : 'bg-white border-2 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{goal.icon || '🎯'}</span>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900">{goal.name}</h3>
                        </div>
                        {goal.progress?.achieved && (
                          <Award className="h-8 w-8 text-orange-600" />
                        )}
                      </div>
                      {!goal.progress?.achieved && (
                        <Progress
                          value={goal.progress?.percentage || 0}
                          className="h-3 bg-gray-200"
                        />
                      )}
                      <p className="text-sm font-bold text-gray-700 text-center mt-2">
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
  );
}
