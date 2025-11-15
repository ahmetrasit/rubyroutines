'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SessionTimeout } from '@/components/kiosk/session-timeout';
import { ConfettiCelebration } from '@/components/kiosk/confetti-celebration';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2, LogOut, Check, Plus, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface Person {
  id: string;
  name: string;
  avatar?: string | null;
}

const INACTIVITY_TIMEOUT = 30000; // 30 seconds

export default function KioskModePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const [sessionData, setSessionData] = useState<any>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});
  const [undoTimers, setUndoTimers] = useState<Record<string, number>>({});
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [lastCheckedAt, setLastCheckedAt] = useState<Date>(new Date());
  const { toast } = useToast();
  const utils = trpc.useUtils();

  useEffect(() => {
    // Verify session from localStorage
    const stored = localStorage.getItem('kiosk_session');
    if (!stored) {
      router.push('/kiosk');
      return;
    }

    try {
      const session = JSON.parse(stored);
      if (session.code !== code) {
        router.push('/kiosk');
        return;
      }

      // Check if session expired
      const expiresAt = new Date(session.expiresAt);
      if (expiresAt <= new Date()) {
        localStorage.removeItem('kiosk_session');
        router.push('/kiosk');
        return;
      }

      setSessionData(session);
    } catch (error) {
      router.push('/kiosk');
    }
  }, [code, router]);

  const { data: kioskData, isLoading: kioskLoading } = trpc.kiosk.validateCode.useQuery(
    { code },
    { enabled: !!sessionData }
  );

  // Get selected person from the kiosk data instead of using authenticated endpoint
  const persons = kioskData?.persons || [];
  const activePersons = persons.filter((p: any) => p.status === 'ACTIVE');
  const selectedPerson = activePersons.find((p: Person) => p.id === selectedPersonId);

  const { data: personTasksData, isLoading: tasksLoading } = trpc.kiosk.getPersonTasks.useQuery(
    { kioskCodeId: sessionData?.codeId!, personId: selectedPersonId! },
    {
      enabled: !!sessionData && !!selectedPersonId,
      refetchInterval: false, // Disable auto refetch, will use optimized polling
    }
  );

  const tasks = personTasksData?.tasks || [];

  // Fetch tasks for all persons for progress calculation
  const personTaskQueries = activePersons.map((person: Person) =>
    trpc.kiosk.getPersonTasks.useQuery(
      { kioskCodeId: sessionData?.codeId!, personId: person.id },
      {
        enabled: !!sessionData && !!sessionData.codeId,
        refetchInterval: false, // Disable auto refetch, will use optimized polling
      }
    )
  );

  // Optimized polling: check for updates every 10 seconds
  useEffect(() => {
    if (!sessionData?.codeId) return;

    const interval = setInterval(async () => {
      try {
        const result = await utils.kiosk.checkRoleUpdates.fetch({
          kioskCodeId: sessionData.codeId,
          lastCheckedAt
        });

        if (result.hasUpdates) {
          // Invalidate all queries to refetch fresh data
          utils.kiosk.getPersonTasks.invalidate();
          setLastCheckedAt(result.lastUpdatedAt);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [sessionData?.codeId, lastCheckedAt, utils]);

  const completeMutation = trpc.kiosk.completeTask.useMutation({
    onSuccess: () => {
      setShowCelebration(true);
      utils.kiosk.getPersonTasks.invalidate();
      setLastCheckedAt(new Date()); // Update timestamp to prevent redundant refetch
      resetInactivityTimer();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const undoMutation = trpc.kiosk.undoCompletion.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task completion undone',
        variant: 'success',
      });
      utils.kiosk.getPersonTasks.invalidate();
      setLastCheckedAt(new Date()); // Update timestamp to prevent redundant refetch
      resetInactivityTimer();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const interval = setInterval(() => {
      const newTimers: Record<string, number> = {};

      tasks.forEach((task: Task) => {
        if (task.type === TaskType.SIMPLE && task.completions && task.completions.length > 0) {
          const recentCompletion = task.completions.find((c) => c.personId === selectedPersonId);
          if (recentCompletion && canUndoCompletion(recentCompletion.completedAt, task.type)) {
            newTimers[task.id] = getRemainingUndoTime(recentCompletion.completedAt);
          }
        }
      });

      setUndoTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks, selectedPersonId]);

  // Inactivity timer
  const resetInactivityTimer = useCallback(() => {
    setLastActivityTime(Date.now());
  }, []);

  const isGroupScope = activePersons.length > 1;

  useEffect(() => {
    if (!selectedPersonId || !isGroupScope) return;

    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityTime;
      if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
        setSelectedPersonId(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedPersonId, lastActivityTime, isGroupScope]);

  const handleComplete = (task: Task) => {
    if (!selectedPersonId) return;

    resetInactivityTimer();

    if (task.type === TaskType.PROGRESS) {
      const value = progressValues[task.id];
      if (!value || parseFloat(value) <= 0) {
        alert('Please enter a value');
        return;
      }
      completeMutation.mutate({
        kioskCodeId: sessionData!.codeId,
        taskId: task.id,
        personId: selectedPersonId,
        value,
      });
      setProgressValues({ ...progressValues, [task.id]: '' });
    } else {
      completeMutation.mutate({
        kioskCodeId: sessionData!.codeId,
        taskId: task.id,
        personId: selectedPersonId,
      });
    }
  };

  const handleUndo = (task: Task) => {
    resetInactivityTimer();
    const recentCompletion = task.completions?.find((c) => c.personId === selectedPersonId);
    if (recentCompletion) {
      undoMutation.mutate({ kioskCodeId: sessionData!.codeId, completionId: recentCompletion.id });
    }
  };

  const handleExit = () => {
    localStorage.removeItem('kiosk_session');
    router.push('/kiosk');
  };

  const handleTimeout = () => {
    handleExit();
  };

  const handlePersonSelect = (personId: string) => {
    setSelectedPersonId(personId);
    resetInactivityTimer();
  };

  const handleDone = () => {
    setSelectedPersonId(null);
  };

  const getAvatarData = (avatar?: string | null) => {
    let avatarColor = '#FFB3BA';
    let avatarEmoji = '👤';

    if (avatar) {
      try {
        const parsed = JSON.parse(avatar);
        avatarColor = parsed.color || avatarColor;
        avatarEmoji = parsed.emoji || avatarEmoji;
      } catch {
        // Ignore parse errors
      }
    }

    return { avatarColor, avatarEmoji };
  };

  const darkenColor = (color: string, amount: number = 0.3): string => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Darken by reducing each component
    const darkR = Math.round(r * (1 - amount));
    const darkG = Math.round(g * (1 - amount));
    const darkB = Math.round(b * (1 - amount));

    // Convert back to hex
    return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
  };

  const getPersonProgress = (personId: string) => {
    const personIndex = activePersons.findIndex((p: Person) => p.id === personId);
    if (personIndex === -1) return { completed: 0, total: 0, percentage: 100 };

    const taskData = personTaskQueries[personIndex]?.data;
    if (!taskData || !taskData.tasks) return { completed: 0, total: 0, percentage: 100 };

    const visibleTasks = taskData.tasks.filter((task: Task) =>
      task.type === TaskType.SIMPLE || task.type === TaskType.MULTIPLE_CHECKIN || task.type === TaskType.PROGRESS
    );

    if (visibleTasks.length === 0) return { completed: 0, total: 0, percentage: 100 };

    const completedTasks = visibleTasks.filter((task: Task) => {
      if (task.type === TaskType.SIMPLE) {
        return task.isComplete;
      }
      if (task.type === TaskType.MULTIPLE_CHECKIN) {
        return (task.completionCount || 0) > 0;
      }
      if (task.type === TaskType.PROGRESS) {
        return (task.progress || 0) >= 100;
      }
      return false;
    });

    const percentage = (completedTasks.length / visibleTasks.length) * 100;
    return { completed: completedTasks.length, total: visibleTasks.length, percentage };
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
                onChange={(e) => {
                  setProgressValues({ ...progressValues, [task.id]: e.target.value });
                  resetInactivityTimer();
                }}
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

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (kioskLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedPersonColor = selectedPerson ? getAvatarData(selectedPerson.avatar).avatarColor : '#6B7280';

  return (
    <>
      <SessionTimeout
        expiresAt={new Date(sessionData.expiresAt)}
        onTimeout={handleTimeout}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="h-[calc(100vh-3rem)] flex gap-6 items-center justify-center">
          {/* Screen Part 1: Person List (Left 2/3) - Only visible in group scope */}
          {isGroupScope && (
            <div className={`${selectedPersonId ? 'w-2/3' : 'w-full max-w-6xl'} border-4 border-blue-500 rounded-2xl bg-white p-6 overflow-auto`}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Who is checking-in?</h2>
                <Button variant="outline" onClick={handleExit} size="lg" className="px-4">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {activePersons.map((person: Person) => {
                  const { avatarColor, avatarEmoji } = getAvatarData(person.avatar);
                  const isSelected = selectedPersonId === person.id;
                  const progress = getPersonProgress(person.id);

                  return (
                    <button
                      key={person.id}
                      onClick={() => handlePersonSelect(person.id)}
                      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 border-4 overflow-hidden ${
                        isSelected ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      {/* Color bar on top */}
                      <div className="h-3" style={{ backgroundColor: avatarColor }} />

                      <div className="p-4">
                        <div className="flex flex-col items-center mb-3">
                          <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-3"
                            style={{ backgroundColor: avatarColor + '30' }}
                          >
                            {avatarEmoji}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 text-center">
                            {person.name}
                          </h3>
                        </div>

                        {/* Progress bar */}
                        <div
                          className="w-full h-2 bg-gray-200 rounded-full overflow-hidden border-2"
                          style={{ borderColor: darkenColor(avatarColor) }}
                        >
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${progress.percentage}%`,
                              backgroundColor: avatarColor
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right Side Container - Only show if person is selected or not group scope */}
          {(selectedPersonId || !isGroupScope) && (
            <div className={`${isGroupScope ? 'w-1/3' : 'w-full'} flex flex-col gap-6`}>
              {/* Screen Part 2: Current Person (Top 1/5) */}
              <div
                className="h-[20%] border-4 rounded-2xl bg-white p-6 flex items-center justify-between"
                style={{ borderColor: selectedPersonColor }}
              >
                {selectedPerson ? (
                  <div className="flex items-center gap-4">
                    {(() => {
                      const { avatarColor, avatarEmoji } = getAvatarData(selectedPerson.avatar);
                      return (
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                          style={{ backgroundColor: avatarColor + '30' }}
                        >
                          {avatarEmoji}
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedPerson.name}</h2>
                      <p className="text-gray-600">Currently checking in</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
                      👤
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-500">No person selected</h2>
                      <p className="text-gray-500">No person available</p>
                    </div>
                  </div>
                )}
                {isGroupScope ? (
                  <Button variant="default" onClick={handleDone} size="lg" className="px-4">
                    <Check className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleExit} size="lg" className="px-4">
                    <LogOut className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* Screen Part 3: Tasks (Bottom 4/5) */}
              <div
                className="h-[80%] border-4 rounded-2xl bg-white p-6 overflow-auto"
                style={{ borderColor: selectedPersonColor }}
                onClick={resetInactivityTimer}
                onScroll={resetInactivityTimer}
              >
                {!selectedPersonId ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="text-6xl mb-4">📋</div>
                      <p className="text-xl">No tasks available</p>
                    </div>
                  </div>
                ) : tasksLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎉</div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">All done!</h2>
                      <p className="text-gray-600">No tasks right now. Great job!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task: Task) => (
                      <div
                        key={task.id}
                        className="bg-gray-50 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
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
          )}
        </div>
      </div>
      <ConfettiCelebration
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
}
