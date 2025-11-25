'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SessionTimeout } from '@/components/kiosk/session-timeout';
import { TaskColumn } from '@/components/kiosk/task-column';
import { trpc } from '@/lib/trpc/client';
import { getQueryKey } from '@trpc/react-query';
import { useToast } from '@/components/ui/toast';
import { Loader2, LogOut, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskType } from '@/lib/types/prisma-enums';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { canUndoCompletion, getRemainingUndoTime } from '@/lib/services/task-completion';
import { getResetPeriodStart } from '@/lib/services/reset-period';
import { useOptimisticKioskCheckin, useOptimisticKioskUndo } from '@/lib/hooks/useOptimisticKioskCheckin';
import { useKioskRealtime } from '@/lib/hooks/useKioskRealtime';

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

  // Enable realtime updates for instant cross-device sync
  useKioskRealtime({
    personId: selectedPersonId,
    sessionId: sessionData?.sessionId,
    onSessionTerminated: () => {
      if (!sessionTerminatedRef.current) {
        sessionTerminatedRef.current = true;
        toast({
          title: 'Session Ended',
          description: 'This kiosk session has been terminated remotely.',
          variant: 'destructive',
        });
      }
    },
    enabled: !!selectedPersonId && !!sessionData?.sessionId,
  });

  // State for collapsible sections (not used in Warm Earth kiosk)
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [simpleOpen, setSimpleOpen] = useState(false);
  const [multiOpen, setMultiOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);

  // State for Warm Earth kiosk
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});
  const [animatingTasks, setAnimatingTasks] = useState<Set<string>>(new Set());
  const [undoTimers, setUndoTimers] = useState<Record<string, number>>({});

  // Dynamic layout state
  const [simpleTasksColumns, setSimpleTasksColumns] = useState<1 | 2>(2); // 1 or 2 columns for simple tasks
  const [multiTasksColumns, setMultiTasksColumns] = useState<1 | 2>(2); // 1 or 2 columns for multi tasks

  // Refs for measuring container heights
  const checklistContainerRef = useRef<HTMLDivElement>(null);
  const recordProgressContainerRef = useRef<HTMLDivElement>(null);

  // Track if session termination has been handled to prevent duplicate toasts
  const sessionTerminatedRef = useRef(false);

  // Reset session terminated flag when new session starts
  useEffect(() => {
    if (sessionData?.sessionId) {
      sessionTerminatedRef.current = false;
    }
  }, [sessionData?.sessionId]);

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

  // Validate session with server (check if remotely terminated)
  // Realtime handles instant updates, this is just a fallback
  const { data: sessionValidation, error: sessionError } = trpc.kiosk.validateSession.useQuery(
    { sessionId: sessionData?.sessionId || '' },
    {
      enabled: !!sessionData?.sessionId,
      refetchInterval: 60000, // Fallback check every 60 seconds (realtime handles instant updates)
    }
  );

  // Handle remote session termination
  useEffect(() => {
    if (sessionError || (sessionValidation && !sessionValidation.isValid)) {
      if (!sessionTerminatedRef.current) {
        sessionTerminatedRef.current = true;
        toast({
          title: 'Session Ended',
          description: 'This kiosk session has been terminated remotely.',
          variant: 'destructive',
        });
      }
      localStorage.removeItem('kiosk_session');
      router.push('/kiosk');
    }
  }, [sessionValidation, sessionError, router, toast]);

  // Heartbeat: Update session activity every 30 seconds
  const updateActivityMutation = trpc.kiosk.updateSessionActivity.useMutation();

  useEffect(() => {
    if (!sessionData?.sessionId) return;

    // Initial heartbeat
    updateActivityMutation.mutate({ sessionId: sessionData.sessionId });

    // Set up interval for heartbeat
    const heartbeatInterval = setInterval(() => {
      updateActivityMutation.mutate({ sessionId: sessionData.sessionId });
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [sessionData?.sessionId]);

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
    // Special case: if the person is an account owner, show error message
    const individualPerson = rolePersons.find((p: Person) => p.id === kioskData.personId && p.status === 'ACTIVE');
    if (individualPerson?.isAccountOwner) {
      // This is a kiosk code for the account owner - invalid for kiosk use
      activePersons = [];
    } else if (individualPerson) {
      activePersons = [individualPerson];
    }
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
      refetchInterval: 60000, // Fallback check every 60 seconds (realtime handles instant updates)
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

  // Get the actual tRPC query key for kiosk tasks
  const kioskTasksQueryKey = sessionData?.codeId && selectedPersonId
    ? getQueryKey(trpc.kiosk.getPersonTasks, { kioskCodeId: sessionData.codeId, personId: selectedPersonId }, 'query')
    : undefined;

  // Use optimistic mutations for instant UI feedback
  const baseCompleteMutation = trpc.kiosk.completeTask.useMutation();
  const completeMutation = useOptimisticKioskCheckin(baseCompleteMutation, {
    kioskCodeId: sessionData?.codeId!,
    personId: selectedPersonId!,
    kioskTasksKey: kioskTasksQueryKey,
    onSuccess: async (data: any) => {
      // Skip toast for cached completions - UI already shows completion state
      // This prevents redundant notifications when user double-clicks

      await utils.goal.list.invalidate();
      await utils.goal.getGoalsForTask.invalidate();
      await utils.goal.getGoalsForRoutine.invalidate();
      setLastCheckedAt(new Date());
      resetInactivityTimer();
    },
    onError: async (error: any) => {
      // Handle CONFLICT errors - use neutral tone for better UX
      if (error.data?.code === 'CONFLICT') {
        // Distinguish between duplicate requests and true conflicts
        const isLockTimeout = error.message?.includes('another device');
        toast({
          title: isLockTimeout ? 'Task unavailable' : 'Already completed',
          description: isLockTimeout
            ? 'Another device is completing this task'
            : 'This task has been completed',
          variant: 'default', // Use default variant, not destructive
        });
      } else if (error.data?.code === 'BAD_REQUEST') {
        // Handle max entries and validation errors
        toast({
          title: 'Unable to complete',
          description: error.message || 'Maximum entries reached for this period',
          variant: 'destructive',
        });
      }
    },
  });

  const baseUndoMutation = trpc.kiosk.undoCompletion.useMutation();
  const undoMutation = useOptimisticKioskUndo(baseUndoMutation, {
    kioskCodeId: sessionData?.codeId!,
    personId: selectedPersonId!,
    messages: {
      success: 'Task completion undone',
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

  // Calculate dynamic layout based on available space
  useEffect(() => {
    if (!selectedPersonId || !tasks.length) return;

    // Calculate after a short delay to ensure DOM is rendered
    const timeoutId = setTimeout(() => {
      // Calculate simple tasks layout
      if (checklistContainerRef.current) {
        const container = checklistContainerRef.current;
        const availableHeight = container.clientHeight;

        // Count simple tasks
        const simpleTaskCount = tasks.filter((t: Task) => t.type === TaskType.SIMPLE).length;

        // Estimate height per task (card height + gap)
        // Card: ~120px, gap: 12px
        const estimatedTaskHeight = 132;
        const totalHeightNeeded = simpleTaskCount * estimatedTaskHeight;

        // If all tasks fit in available height, use 1 column, otherwise 2
        setSimpleTasksColumns(totalHeightNeeded <= availableHeight ? 1 : 2);
      }

      // Calculate multi tasks layout
      if (recordProgressContainerRef.current) {
        const container = recordProgressContainerRef.current;
        const availableHeight = container.clientHeight;

        // Count multi and progress tasks
        const multiTaskCount = tasks.filter((t: Task) => t.type === TaskType.MULTIPLE_CHECKIN).length;
        const progressTaskCount = tasks.filter((t: Task) => t.type === TaskType.PROGRESS).length;

        // Estimate heights
        const multiTaskHeight = 120; // Approximate height of multi task card
        const progressTaskHeight = 120; // Approximate height of progress task card
        const gapHeight = 12;
        const sectionGap = 16; // Gap between multi and progress sections

        // Calculate total height if multi tasks are 1 per row
        const multiTasksHeightSingleColumn = multiTaskCount * (multiTaskHeight + gapHeight);
        const progressTasksHeight = progressTaskCount * (progressTaskHeight + gapHeight);
        const totalHeightNeeded = multiTasksHeightSingleColumn + progressTasksHeight + (multiTaskCount > 0 && progressTaskCount > 0 ? sectionGap : 0);

        // If all tasks fit in available height with multi at 1 per row, use 1 column for multi, otherwise 2
        setMultiTasksColumns(totalHeightNeeded <= availableHeight ? 1 : 2);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
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
              {activePersons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students or Kids Available</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    This kiosk requires students or kids to be added to the account.
                    Please ask your teacher or parent to add students/kids first.
                  </p>
                  <Button variant="outline" onClick={handleExit} size="lg" className="mt-6">
                    Exit Kiosk Mode
                  </Button>
                </div>
              ) : (
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
              )}
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
                ) : activePersons.length === 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
                      ⚠️
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-500">No Students/Kids Available</h2>
                      <p className="text-gray-500">Please add students or kids to use kiosk mode</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
                      👤
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-500">No person selected</h2>
                      <p className="text-gray-500">Select a person to continue</p>
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
                          <div
                            ref={checklistContainerRef}
                            className={`flex-1 overflow-y-auto gap-3 content-start ${simpleTasksColumns === 1 ? 'space-y-3' : 'grid grid-cols-2'}`}
                          >
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
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 flex-wrap flex-1">
                                          <span
                                            className="font-semibold leading-tight"
                                            style={{
                                              fontSize: task.name.length > 16 ? `${28 * (16 / task.name.length)}px` : '28px',
                                              color: task.isComplete ? 'var(--warm-complete-secondary)' : '#37474F',
                                              textDecoration: task.isComplete ? 'line-through' : 'none'
                                            }}
                                          >
                                            {task.name}
                                          </span>
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
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Record Progress */}
                        <div className="flex flex-col overflow-hidden">
                          {recordProgressTasks.length > 0 && (
                            <div className="flex flex-col flex-1 overflow-hidden">
                              <h2 className="text-[36px] font-bold mb-4" style={{ color: '#37474F' }}>
                                📊 Record Progress
                              </h2>
                              <div
                                ref={recordProgressContainerRef}
                                className="flex-1 overflow-y-auto space-y-4"
                              >
                                {/* Multi tasks - dynamic layout */}
                                {multiTasks.length > 0 && (
                                  <div className={multiTasksColumns === 1 ? 'space-y-3' : 'grid grid-cols-2 gap-3'}>
                                    {multiTasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className="rounded-[12px] p-[16px] flex items-center gap-4 transition-all duration-1000"
                                        style={{
                                          background: animatingTasks.has(task.id) ? '#DDD5D0' : '#FAF8F7'
                                        }}
                                      >
                                        {/* Task Name */}
                                        <div className="flex-1 min-w-0">
                                          <div
                                            className="font-semibold leading-tight"
                                            style={{
                                              fontSize: task.name.length > 16 ? `${28 * (16 / task.name.length)}px` : '28px',
                                              color: '#37474F'
                                            }}
                                          >
                                            {task.name}
                                          </div>

                                          {/* Subtitle and Goal Badges */}
                                          <div className="flex items-center flex-wrap gap-2 mt-1">
                                            <div className="text-[22px] leading-tight" style={{ color: '#607D8B' }}>
                                              {task.completionCount || 0}x
                                            </div>
                                            {activeGoals
                                              .filter((goal: any) => goal.taskLinks?.some((link: any) => link.taskId === task.id))
                                              .map((goal: any) => (
                                                <div
                                                  key={goal.id}
                                                  className="relative inline-flex items-center gap-1 px-3 py-1 rounded-[16px] text-[20px] font-semibold whitespace-nowrap overflow-hidden"
                                                  style={{
                                                    background: '#D7CCC8',
                                                    color: 'white'
                                                  }}
                                                >
                                                  {/* Progress fill */}
                                                  <div
                                                    className="absolute inset-0 transition-all duration-300"
                                                    style={{
                                                      width: `${goal.progress?.percentage || 0}%`,
                                                      background: 'linear-gradient(90deg, var(--warm-complete-primary), var(--warm-complete-secondary))'
                                                    }}
                                                  />
                                                  {/* Content */}
                                                  <span className="relative z-10">🎯 {goal.name}</span>
                                                </div>
                                              ))
                                            }
                                          </div>
                                        </div>

                                        {/* Multi-checkin: Button */}
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
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Progress tasks - 1 per row */}
                                {progressTasks.length > 0 && (
                                  <div className="space-y-3">
                                    {progressTasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className="rounded-[12px] p-[16px] flex items-center gap-4 transition-all duration-1000"
                                        style={{
                                          background: animatingTasks.has(task.id) ? '#DDD5D0' : '#FAF8F7'
                                        }}
                                      >
                                        {/* Task Name */}
                                        <div className="flex-1 min-w-0">
                                          <div
                                            className="font-semibold leading-tight"
                                            style={{
                                              fontSize: task.name.length > 16 ? `${28 * (16 / task.name.length)}px` : '28px',
                                              color: '#37474F'
                                            }}
                                          >
                                            {task.name}
                                          </div>

                                          {/* Subtitle and Goal Badges */}
                                          <div className="flex items-center flex-wrap gap-2 mt-1">
                                            <div className="text-[22px] leading-tight" style={{ color: '#607D8B' }}>
                                              {task.summedValue || task.totalValue || 0} {task.unit}
                                            </div>
                                            {activeGoals
                                              .filter((goal: any) => goal.taskLinks?.some((link: any) => link.taskId === task.id))
                                              .map((goal: any) => (
                                                <div
                                                  key={goal.id}
                                                  className="relative inline-flex items-center gap-1 px-3 py-1 rounded-[16px] text-[20px] font-semibold whitespace-nowrap overflow-hidden"
                                                  style={{
                                                    background: '#D7CCC8',
                                                    color: 'white'
                                                  }}
                                                >
                                                  {/* Progress fill */}
                                                  <div
                                                    className="absolute inset-0 transition-all duration-300"
                                                    style={{
                                                      width: `${goal.progress?.percentage || 0}%`,
                                                      background: 'linear-gradient(90deg, var(--warm-complete-primary), var(--warm-complete-secondary))'
                                                    }}
                                                  />
                                                  {/* Content */}
                                                  <span className="relative z-10">🎯 {goal.name}</span>
                                                </div>
                                              ))
                                            }
                                          </div>
                                        </div>

                                        {/* Progress: Input + Button */}
                                        <input
                                          type="number"
                                          min="1"
                                          max="999"
                                          value={progressValues[task.id] || ''}
                                          onChange={(e) => setProgressValues({ ...progressValues, [task.id]: e.target.value })}
                                          placeholder="0"
                                          className="px-3 py-2 rounded-[10px] text-[24px] font-semibold text-center"
                                          style={{
                                            border: '2px solid #D7CCC8',
                                            color: '#37474F',
                                            width: '90px',
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
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
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
