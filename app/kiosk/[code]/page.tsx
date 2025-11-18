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

  // State for collapsible sections
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [simpleOpen, setSimpleOpen] = useState(false);
  const [multiOpen, setMultiOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);

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
                    // Group tasks by type
                    const simpleTasks = tasks.filter((t: Task) => t.type === TaskType.SIMPLE);
                    const multiTasks = tasks.filter((t: Task) => t.type === TaskType.MULTIPLE_CHECKIN);
                    const progressTasks = tasks.filter((t: Task) => t.type === TaskType.PROGRESS);

                    // Calculate stats for Simple tasks
                    const simpleCompleted = simpleTasks.filter((t: Task) => t.isComplete).length;
                    const simpleTotal = simpleTasks.length;

                    return (
                      <div className="space-y-3">
                        {/* Goals Section */}
                        <Collapsible open={goalsOpen} onOpenChange={setGoalsOpen}>
                          <div className="border-2 border-gray-300 rounded-lg bg-white">
                            <CollapsibleTrigger asChild>
                              <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900">🎯 Goals</h3>
                                    <span className="text-sm text-gray-500">(Coming soon)</span>
                                  </div>
                                  <div className="mt-2">
                                    <Progress value={0} max={100} className="h-2" />
                                    <p className="text-xs text-gray-500 mt-1">0% Complete</p>
                                  </div>
                                </div>
                                {goalsOpen ? (
                                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                                )}
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="p-4 pt-0 border-t">
                                <p className="text-sm text-gray-500 text-center py-8">
                                  Goal tracking coming soon...
                                </p>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>

                        {/* Simple Tasks Section */}
                        {simpleTasks.length > 0 && (
                          <Collapsible open={simpleOpen} onOpenChange={setSimpleOpen}>
                            <div className="border-2 border-gray-300 rounded-lg bg-white">
                              <CollapsibleTrigger asChild>
                                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">✓ Simple Tasks</h3>
                                    <div>
                                      <Progress value={simpleCompleted} max={simpleTotal} className="h-2" />
                                      <p className="text-xs text-gray-500 mt-1">
                                        {simpleCompleted} of {simpleTotal} completed
                                      </p>
                                    </div>
                                  </div>
                                  {simpleOpen ? (
                                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                                  )}
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="p-4 pt-0 border-t">
                                  <TaskColumn
                                    title=""
                                    tasks={simpleTasks}
                                    personId={selectedPersonId!}
                                    onComplete={handleComplete}
                                    onUndo={handleUndo}
                                    isPending={completeMutation.isPending || undoMutation.isPending}
                                  />
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        )}

                        {/* Multi Check-in Tasks Section */}
                        {multiTasks.length > 0 && (
                          <Collapsible open={multiOpen} onOpenChange={setMultiOpen}>
                            <div className="border-2 border-gray-300 rounded-lg bg-white">
                              <CollapsibleTrigger asChild>
                                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900">
                                      ✔️ Check-ins ({multiTasks.length})
                                    </h3>
                                  </div>
                                  {multiOpen ? (
                                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                                  )}
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="p-4 pt-0 border-t">
                                  <TaskColumn
                                    title=""
                                    tasks={multiTasks}
                                    personId={selectedPersonId!}
                                    onComplete={handleComplete}
                                    onUndo={handleUndo}
                                    isPending={completeMutation.isPending || undoMutation.isPending}
                                  />
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        )}

                        {/* Progress Tasks Section */}
                        {progressTasks.length > 0 && (
                          <Collapsible open={progressOpen} onOpenChange={setProgressOpen}>
                            <div className="border-2 border-gray-300 rounded-lg bg-white">
                              <CollapsibleTrigger asChild>
                                <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900">
                                      📊 Progress ({progressTasks.length})
                                    </h3>
                                  </div>
                                  {progressOpen ? (
                                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                                  )}
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="p-4 pt-0 border-t">
                                  <TaskColumn
                                    title=""
                                    tasks={progressTasks}
                                    personId={selectedPersonId!}
                                    onComplete={handleComplete}
                                    onUndo={handleUndo}
                                    isPending={completeMutation.isPending || undoMutation.isPending}
                                  />
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        )}
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
