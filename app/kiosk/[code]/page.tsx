'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SessionTimeout } from '@/components/kiosk/session-timeout';
import { TaskColumn } from '@/components/kiosk/task-column';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2, LogOut, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskType } from '@/lib/types/prisma-enums';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { canUndoCompletion, getRemainingUndoTime } from '@/lib/services/task-completion';
import { getResetPeriodStart } from '@/lib/services/reset-period';

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
  status?: string;
  isAccountOwner?: boolean;
}

const INACTIVITY_TIMEOUT = 60000; // 60 seconds (default, can be configured in admin settings)

export default function KioskModePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const [sessionData, setSessionData] = useState<any>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [lastCheckedAt, setLastCheckedAt] = useState<Date>(new Date());
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const isPageVisible = usePageVisibility();

  // State for collapsible sections (not used in Warm Earth kiosk)
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [simpleOpen, setSimpleOpen] = useState(false);
  const [multiOpen, setMultiOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);

  // State for Warm Earth kiosk
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});
  const [animatingTasks, setAnimatingTasks] = useState<Set<string>>(new Set());
  const [undoTimers, setUndoTimers] = useState<Record<string, number>>({});

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

  // Get kiosk settings (inactivity timeout)
  const { data: kioskSettings } = trpc.kiosk.getSettings.useQuery();
  const inactivityTimeout = kioskSettings?.inactivityTimeout || INACTIVITY_TIMEOUT;

  // Get persons to display: use group members if groups exist, otherwise use role persons
  // Filter out teachers/parents (named 'Me') to show only students/kids
  const groups = kioskData?.groups || [];
  const rolePersons = kioskData?.persons || [];
  const isIndividualCode = !!kioskData?.personId; // Check if this is an individual code

  let activePersons: Person[] = [];
  if (isIndividualCode) {
    // Individual code: only show the specific person
    activePersons = rolePersons.filter((p: Person) => p.id === kioskData.personId && p.status === 'ACTIVE');
  } else if (groups.length > 0) {
    // Group code: use members from groups (classroom/family members)
    const allMembers = groups.flatMap((g: any) => g.members || []);
    activePersons = allMembers
      .map((m: any) => m.person)
      .filter((p: Person) => p && p.status === 'ACTIVE' && !p.isAccountOwner);
  } else {
    // Role code: use persons from role (fallback)
    activePersons = rolePersons.filter((p: Person) => p.status === 'ACTIVE' && !p.isAccountOwner);
  }

  const selectedPerson = activePersons.find((p: Person) => p.id === selectedPersonId);

  const { data: personTasksData, isLoading: tasksLoading } = trpc.kiosk.getPersonTasks.useQuery(
    { kioskCodeId: sessionData?.codeId!, personId: selectedPersonId! },
    {
      enabled: !!sessionData && !!selectedPersonId,
      refetchInterval: false, // Disable auto refetch, will use optimized polling
    }
  );

  const tasks = personTasksData?.tasks || [];

  // Fetch goals for the selected person using kiosk endpoint
  const { data: goals } = trpc.kiosk.getPersonGoals.useQuery(
    {
      kioskCodeId: sessionData?.codeId!,
      personId: selectedPersonId!,
      roleId: kioskData?.roleId!
    },
    { enabled: !!sessionData?.codeId && !!selectedPersonId && !!kioskData?.roleId }
  );

  const activeGoals = (goals || []).sort((a, b) => {
    // First: Sort by completion status (incomplete first)
    const aComplete = (a.progress?.percentage || 0) >= 100;
    const bComplete = (b.progress?.percentage || 0) >= 100;
    if (aComplete !== bComplete) return aComplete ? 1 : -1;

    // Second: Sort alphanumerically by name
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

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

  // Optimized polling: check for updates every 15 seconds, pause when page not visible
  useEffect(() => {
    if (!sessionData?.codeId || !isPageVisible) return;

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
    }, 15000); // Check every 15 seconds (optimized from 10s)

    return () => clearInterval(interval);
  }, [sessionData?.codeId, lastCheckedAt, utils, isPageVisible]);

  const completeMutation = trpc.kiosk.completeTask.useMutation({
    onSuccess: () => {
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

  // Inactivity timer
  const resetInactivityTimer = useCallback(() => {
    setLastActivityTime(Date.now());
  }, []);

  const isGroupScope = !isIndividualCode && activePersons.length > 1;

  useEffect(() => {
    if (!selectedPersonId || !isGroupScope) return;

    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityTime;
      if (timeSinceActivity >= inactivityTimeout) {
        setSelectedPersonId(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedPersonId, lastActivityTime, isGroupScope, inactivityTimeout]);

  const handleComplete = (taskId: string, value?: string) => {
    if (!selectedPersonId) return;

    resetInactivityTimer();

    completeMutation.mutate({
      kioskCodeId: sessionData!.codeId,
      taskId,
      personId: selectedPersonId,
      value,
    });
  };

  const handleCompleteWithAnimation = (taskId: string, value?: string) => {
    if (!selectedPersonId) return;

    // Trigger animation
    setAnimatingTasks(prev => new Set(prev).add(taskId));

    // Complete the task
    handleComplete(taskId, value);

    // Remove animation after 1 second
    setTimeout(() => {
      setAnimatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 1000);
  };

  const handleUndo = (completionId: string) => {
    resetInactivityTimer();
    undoMutation.mutate({ kioskCodeId: sessionData!.codeId, completionId });
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

  // Auto-select person for individual codes
  useEffect(() => {
    if (isIndividualCode && activePersons.length === 1 && !selectedPersonId) {
      setSelectedPersonId(activePersons[0].id);
    }
  }, [isIndividualCode, activePersons, selectedPersonId]);

  // Update undo timers every second for simple tasks
  useEffect(() => {
    if (!tasks.length) return;

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
      <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="h-[calc(100vh-3rem)] flex gap-6 items-center justify-center">
          {/* Screen Part 1: Person List - Only visible in group scope */}
          {isGroupScope && (
            <div className={`${selectedPersonId ? 'w-1/3' : 'w-2/3 max-w-6xl mx-auto'} border-4 border-blue-500 rounded-2xl bg-white p-6 overflow-auto transition-all duration-300`}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Who is checking-in?</h2>
                <Button variant="outline" onClick={handleExit} size="lg" className="px-4" aria-label="Exit kiosk mode">
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <div className={`grid gap-3 ${selectedPersonId ? 'grid-cols-2' : 'grid-cols-4'} transition-all`}>
                {activePersons.map((person: Person) => {
                  const { avatarColor, avatarEmoji } = getAvatarData(person.avatar);
                  const isSelected = selectedPersonId === person.id;
                  const progress = getPersonProgress(person.id);

                  return (
                    <button
                      key={person.id}
                      onClick={() => handlePersonSelect(person.id)}
                      aria-label={`Select ${person.name}. Progress: ${progress.completed} of ${progress.total} tasks completed`}
                      aria-pressed={isSelected}
                      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 border-4 overflow-hidden ${
                        isSelected ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      {/* Color bar on top */}
                      <div className={selectedPersonId ? 'h-2' : 'h-3'} style={{ backgroundColor: avatarColor }} />

                      <div className={selectedPersonId ? 'p-2' : 'p-4'}>
                        <div className="flex flex-col items-center mb-2">
                          <div
                            className={`rounded-full flex items-center justify-center mb-2 ${
                              selectedPersonId ? 'w-12 h-12 text-2xl' : 'w-20 h-20 text-4xl'
                            }`}
                            style={{ backgroundColor: avatarColor + '30' }}
                          >
                            {avatarEmoji}
                          </div>
                          <h3 className={`font-bold text-gray-900 text-center ${selectedPersonId ? 'text-sm' : 'text-lg'}`}>
                            {person.name}
                          </h3>
                        </div>

                        {/* Progress bar */}
                        <div
                          className={`w-full bg-gray-200 rounded-full overflow-hidden border-2 ${selectedPersonId ? 'h-1' : 'h-2'}`}
                          style={{ borderColor: darkenColor(avatarColor) }}
                          role="progressbar"
                          aria-valuenow={Math.round(progress.percentage)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Task completion progress: ${progress.completed} of ${progress.total} tasks`}
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
            <div className={`${isGroupScope ? 'w-2/3' : 'w-full'} h-full flex flex-col gap-4`}>
              {/* Screen Part 2: Current Person (Top 1/5) */}
              <div
                className="flex-shrink-0 border-4 rounded-2xl bg-white p-4 flex items-center justify-between min-h-[80px]"
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

              {/* Screen Part 3: Tasks (Bottom 4/5) - Split by type horizontally */}
              <div
                className="flex-1 min-h-0 border-4 rounded-2xl bg-white p-4 overflow-auto"
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
                      <h2 className="text-2xl font-bold text-gray-900">All done!</h2>
                    </div>
                  </div>
                ) : (
                  (() => {
                    // Group tasks by type and sort
                    const simpleTasks = tasks
                      .filter((t: Task) => t.type === TaskType.SIMPLE)
                      .sort((a: Task, b: Task) => {
                        // First: incomplete tasks on top
                        if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
                        // Second: group by routine name
                        const routineCompare = ((a as any).routine?.name || '').localeCompare((b as any).routine?.name || '');
                        if (routineCompare !== 0) return routineCompare;
                        // Third: by task order within routine
                        return ((a as any).order || 0) - ((b as any).order || 0);
                      });

                    const multiTasks = tasks
                      .filter((t: Task) => t.type === TaskType.MULTIPLE_CHECKIN)
                      .sort((a: Task, b: Task) => {
                        // First: tasks with 0 completions on top
                        const aIncomplete = (a.completionCount || 0) === 0;
                        const bIncomplete = (b.completionCount || 0) === 0;
                        if (aIncomplete !== bIncomplete) return aIncomplete ? -1 : 1;
                        // Second: group by routine name
                        const routineCompare = ((a as any).routine?.name || '').localeCompare((b as any).routine?.name || '');
                        if (routineCompare !== 0) return routineCompare;
                        // Third: by task order within routine
                        return ((a as any).order || 0) - ((b as any).order || 0);
                      });

                    const progressTasks = tasks
                      .filter((t: Task) => t.type === TaskType.PROGRESS)
                      .sort((a: Task, b: Task) => {
                        // First: tasks with 0 progress on top
                        const aIncomplete = (a.totalValue || 0) === 0;
                        const bIncomplete = (b.totalValue || 0) === 0;
                        if (aIncomplete !== bIncomplete) return aIncomplete ? -1 : 1;
                        // Second: group by routine name
                        const routineCompare = ((a as any).routine?.name || '').localeCompare((b as any).routine?.name || '');
                        if (routineCompare !== 0) return routineCompare;
                        // Third: by task order within routine
                        return ((a as any).order || 0) - ((b as any).order || 0);
                      });

                    // Combine multi and progress tasks for right column
                    const recordProgressTasks = [...multiTasks, ...progressTasks].sort((a: Task, b: Task) => {
                      // First: group by routine name
                      const routineCompare = ((a as any).routine?.name || '').localeCompare((b as any).routine?.name || '');
                      if (routineCompare !== 0) return routineCompare;
                      // Second: alphanumeric by task name
                      return a.name.localeCompare(b.name, undefined, { numeric: true });
                    });

                    return (
                      <div className="h-full grid grid-cols-2 gap-5 overflow-hidden">
                        {/* LEFT COLUMN: Checklist (Simple tasks only) */}
                        <div className="flex flex-col overflow-hidden">
                          <h2 className="text-[36px] font-bold mb-4" style={{ color: '#37474F' }}>
                            🌍 Checklist
                          </h2>
                          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start">
                            {simpleTasks.map((task) => {
                              const undoTime = undoTimers[task.id];
                              const canUndo = task.isComplete && undoTime !== undefined && undoTime > 0;
                              const isLocked = task.isComplete && !canUndo;

                              return (
                                <div
                                  key={task.id}
                                  className="rounded-[12px] p-[16px] transition-all duration-1000"
                                  style={{
                                    background: animatingTasks.has(task.id)
                                      ? '#DDD5D0'
                                      : (task.isComplete ? '#DDD5D0' : '#FAF8F7'),
                                    opacity: isLocked ? 0.7 : 1,
                                    cursor: isLocked ? 'default' : 'pointer'
                                  }}
                                  onClick={() => {
                                    if (isLocked || completeMutation.isPending) return;
                                    task.isComplete ? handleUndo(task.completions?.[0]?.id!) : handleComplete(task.id);
                                  }}
                                >
                                  <div className="flex items-start gap-4">
                                    {/* C4 Rotating Square */}
                                    <div
                                      className="w-3 h-3 mt-2 flex-shrink-0 transition-all duration-[250ms]"
                                      style={{
                                        border: `2.5px solid ${task.isComplete ? 'var(--warm-complete-primary)' : 'var(--warm-incomplete-primary)'}`,
                                        background: task.isComplete ? 'var(--warm-complete-primary)' : 'transparent',
                                        transform: task.isComplete ? 'rotate(45deg)' : 'rotate(0deg)',
                                        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                                      }}
                                    />

                                    {/* Task Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2 flex-wrap flex-1">
                                          <span
                                            className="text-[28px] font-semibold leading-tight"
                                            style={{
                                              color: task.isComplete ? 'var(--warm-complete-secondary)' : '#37474F',
                                              textDecoration: task.isComplete ? 'line-through' : 'none'
                                            }}
                                          >
                                            {task.name}
                                          </span>
                                          {task.description && (
                                            <>
                                              <span className="text-[24px]" style={{ color: '#607D8B' }}>•</span>
                                              <span
                                                className="text-[26px] leading-tight"
                                                style={{
                                                  color: '#607D8B',
                                                  opacity: task.isComplete ? 0.6 : 1
                                                }}
                                              >
                                                {task.description}
                                              </span>
                                            </>
                                          )}
                                        </div>

                                        {/* Undo timer */}
                                        {canUndo && (
                                          <div className="text-[20px] font-semibold px-3 py-1 rounded-md flex-shrink-0" style={{
                                            background: 'rgba(77, 182, 172, 0.15)',
                                            color: 'var(--warm-complete-secondary)'
                                          }}>
                                            {Math.floor(undoTime / 60)}:{(undoTime % 60).toString().padStart(2, '0')}
                                          </div>
                                        )}
                                      </div>

                                      {/* Inline Goal Progress Bar */}
                                      {activeGoals
                                        .filter((goal: any) => goal.taskLinks?.some((link: any) => link.taskId === task.id))
                                        .map((goal: any) => (
                                          <div key={goal.id} className="flex items-center gap-3 mt-2">
                                            <div
                                              className="inline-flex items-center gap-1 px-3 py-1 rounded-[16px] text-[22px] font-semibold whitespace-nowrap"
                                              style={{
                                                background: task.isComplete ? 'var(--warm-complete-primary)' : 'var(--warm-incomplete-primary)',
                                                color: 'white'
                                              }}
                                            >
                                              🎯 {goal.name}
                                            </div>
                                            <div className="flex-1 h-1.5 rounded-sm overflow-hidden" style={{
                                              background: '#D7CCC8'
                                            }}>
                                              <div
                                                className="h-full rounded-sm transition-all duration-300"
                                                style={{
                                                  width: `${goal.progress?.percentage || 0}%`,
                                                  background: 'linear-gradient(90deg, var(--warm-complete-primary), var(--warm-complete-secondary))'
                                                }}
                                              />
                                            </div>
                                            <div className="text-[22px] font-bold min-w-[48px] text-right" style={{
                                              color: '#607D8B'
                                            }}>
                                              {Math.round(goal.progress?.percentage || 0)}%
                                            </div>
                                          </div>
                                        ))
                                      }
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Split into Progress (top) and Goals (bottom) */}
                        <div className="flex flex-col gap-5 overflow-hidden">
                          {/* TOP: Record Progress (Multi + Progress tasks, 40vh max-height) */}
                          {recordProgressTasks.length > 0 && (
                            <div className="flex flex-col" style={{ maxHeight: '40vh' }}>
                              <h2 className="text-[36px] font-bold mb-4" style={{ color: '#37474F' }}>
                                📊 Record Progress
                              </h2>
                              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start">
                                {recordProgressTasks.map((task) => {
                                  const isMulti = task.type === TaskType.MULTIPLE_CHECKIN;
                                  const isProgress = task.type === TaskType.PROGRESS;

                                  return (
                                    <div
                                      key={task.id}
                                      className="rounded-[12px] p-[16px] flex items-center gap-4 transition-all duration-1000"
                                      style={{
                                        background: animatingTasks.has(task.id) ? '#DDD5D0' : '#FAF8F7'
                                      }}
                                    >
                                      {/* Task Name */}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[28px] font-semibold leading-tight" style={{ color: '#37474F' }}>
                                          {task.name}
                                        </div>
                                        {task.description && (
                                          <div className="text-[22px] leading-tight mt-1" style={{ color: '#607D8B' }}>
                                            {task.description}
                                          </div>
                                        )}
                                      </div>

                                      {/* Multi-checkin: Counter + Button */}
                                      {isMulti && (
                                        <>
                                          <div className="text-[24px] font-semibold min-w-[48px] text-right" style={{ color: '#607D8B' }}>
                                            {task.completionCount || 0}x
                                          </div>
                                          <button
                                            onClick={() => handleCompleteWithAnimation(task.id)}
                                            disabled={completeMutation.isPending}
                                            className="px-4 py-2 rounded-[10px] text-[22px] font-semibold text-white transition-all duration-200 active:scale-95"
                                            style={{
                                              background: 'var(--warm-complete-primary)',
                                              minHeight: '48px',
                                              minWidth: '70px'
                                            }}
                                          >
                                            +1
                                          </button>
                                        </>
                                      )}

                                      {/* Progress: Input + Button + Total */}
                                      {isProgress && (
                                        <>
                                          <input
                                            type="number"
                                            min="1"
                                            max="99"
                                            value={progressValues[task.id] || ''}
                                            onChange={(e) => setProgressValues({ ...progressValues, [task.id]: e.target.value })}
                                            placeholder="0"
                                            className="px-3 py-2 rounded-[10px] text-[24px] font-semibold text-center"
                                            style={{
                                              border: '2px solid #D7CCC8',
                                              color: '#37474F',
                                              width: '70px',
                                              minHeight: '48px'
                                            }}
                                          />
                                          <button
                                            onClick={() => {
                                              const value = progressValues[task.id];
                                              if (!value || parseInt(value, 10) <= 0) {
                                                toast({ title: 'Error', description: 'Please enter a value', variant: 'destructive' });
                                                return;
                                              }
                                              handleCompleteWithAnimation(task.id, value);
                                              setProgressValues({ ...progressValues, [task.id]: '' });
                                            }}
                                            disabled={completeMutation.isPending}
                                            className="px-4 py-2 rounded-[10px] text-[22px] font-semibold text-white transition-all duration-200 active:scale-95"
                                            style={{
                                              background: 'var(--warm-complete-primary)',
                                              minHeight: '48px',
                                              minWidth: '70px'
                                            }}
                                          >
                                            Add
                                          </button>
                                          <div className="text-[22px] font-semibold min-w-[80px] text-right" style={{ color: '#607D8B' }}>
                                            {task.summedValue || task.totalValue || 0} {task.unit}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* BOTTOM: Goals Overview (flex remaining space) */}
                          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                            <h2
                              className="text-[36px] font-bold mb-4 cursor-pointer flex items-center gap-3"
                              style={{ color: '#37474F' }}
                              onClick={() => setGoalsOpen(!goalsOpen)}
                            >
                              🎯 Goals Overview
                              <span className="text-[28px]">{goalsOpen ? '▼' : '▶'}</span>
                            </h2>
                            {goalsOpen && (
                              <div className="flex-1 overflow-y-auto space-y-4">
                                {activeGoals.length === 0 ? (
                                  <div className="text-center py-12">
                                    <p className="text-[24px]" style={{ color: '#607D8B' }}>
                                      No active goals yet
                                    </p>
                                  </div>
                                ) : (
                                  activeGoals.map((goal: any) => (
                                    <div
                                      key={goal.id}
                                      className="rounded-[12px] p-[20px]"
                                      style={{ background: '#FAF8F7' }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-[28px]">🎯</span>
                                        <h3 className="text-[28px] font-semibold" style={{ color: '#37474F' }}>
                                          {goal.name}
                                        </h3>
                                        <div className="flex-1 h-1.5 rounded-sm overflow-hidden" style={{ background: '#D7CCC8' }}>
                                          <div
                                            className="h-full rounded-sm transition-all duration-300"
                                            style={{
                                              width: `${goal.progress?.percentage || 0}%`,
                                              background: 'linear-gradient(90deg, var(--warm-complete-primary), var(--warm-complete-secondary))'
                                            }}
                                          />
                                        </div>
                                        <div className="text-[22px] font-bold min-w-[48px] text-right" style={{ color: '#607D8B' }}>
                                          {Math.round(goal.progress?.percentage || 0)}%
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
