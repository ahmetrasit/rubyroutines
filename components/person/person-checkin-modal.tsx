'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Loader2 } from 'lucide-react';
import { TaskColumn } from '@/components/kiosk/task-column';
import { TaskType } from '@/lib/types/prisma-enums';
import { useToast } from '@/components/ui/toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { getResetPeriodStart } from '@/lib/services/reset-period';
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
  entryNumber?: number;
  summedValue?: number;
  isTeacherOnly?: boolean;
  routineName?: string;
  completions?: Array<{
    id: string;
    completedAt: Date;
    personId: string;
  }>;
}

interface PersonCheckinModalProps {
  personId: string;
  personName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PersonCheckinModal({ personId, personName, isOpen, onClose }: PersonCheckinModalProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: session } = trpc.auth.getSession.useQuery();

  // Fetch person details with routines and tasks
  const { data: person, isLoading: tasksLoading } = trpc.person.getById.useQuery(
    { id: personId },
    { enabled: isOpen && !!personId }
  );

  // Get current user's role from session to check if they're a teacher
  const currentRole = session?.user?.roles?.[0]; // Get the first role from the session

  // Get goals for this person to show real progress
  const { data: goals } = trpc.goal.list.useQuery(
    { roleId: currentRole?.id!, personId },
    { enabled: isOpen && !!currentRole?.id && !!personId }
  );

  const isTeacher = currentRole?.type === 'TEACHER';

  // Flatten all tasks from all routines assigned to this person
  const tasks: Task[] = person?.assignments?.flatMap((assignment: any) =>
    assignment.routine.tasks.map((task: any) => {
      // Get the reset period start for this routine
      const resetPeriodStart = getResetPeriodStart(
        assignment.routine.resetPeriod,
        assignment.routine.resetDay
      );

      // Filter completions by reset period (not just today)
      const periodCompletions = (task.completions || []).filter((c: any) => {
        return new Date(c.completedAt) >= resetPeriodStart;
      });

      const lastCompletion = periodCompletions[0];
      const isComplete = task.type === 'SIMPLE' && periodCompletions.length > 0;

      return {
        ...task,
        routineName: assignment.routine.name,
        isTeacherOnly: assignment.routine.isTeacherOnly || false,
        isComplete,
        completionCount: periodCompletions.length,
        entryNumber: lastCompletion?.entryNumber || periodCompletions.length,
        summedValue: lastCompletion?.summedValue || 0,
        completions: periodCompletions, // Pass period completions for undo functionality
      };
    })
  ) || [];

  const completeMutation = trpc.task.complete.useMutation({
    onSuccess: async () => {
      await utils.person.getById.refetch({ id: personId });
      // Invalidate goal queries to update progress bars in real-time
      await utils.goal.list.invalidate();
      await utils.goal.getGoalsForTask.invalidate();
      await utils.goal.getGoalsForRoutine.invalidate();
      toast({
        title: 'Success',
        description: 'Task completed!',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const undoMutation = trpc.task.undoCompletion.useMutation({
    onSuccess: async () => {
      await utils.person.getById.refetch({ id: personId });
      // Invalidate goal queries to update progress bars in real-time
      await utils.goal.list.invalidate();
      await utils.goal.getGoalsForTask.invalidate();
      await utils.goal.getGoalsForRoutine.invalidate();
      toast({
        title: 'Success',
        description: 'Task undone',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleComplete = (taskId: string, value?: string) => {
    completeMutation.mutate({
      taskId,
      personId,
      value,
    });
  };

  const handleCompleteWithAnimation = (taskId: string, value?: string) => {
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
    undoMutation.mutate({ completionId });
  };

  // REQUIREMENT #4 & WORKFLOW #1: Separate teacher-only tasks from regular tasks
  const regularTasks = tasks.filter((t) => !t.isTeacherOnly);
  const teacherOnlyTasks = tasks.filter((t) => t.isTeacherOnly);

  // Group regular tasks by type
  const simpleTasks = regularTasks
    .filter((t) => t.type === TaskType.SIMPLE)
    .sort((a, b) => {
      // First: incomplete tasks on top
      if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
      // Second: group by routine name
      const routineCompare = (a.routine?.name || '').localeCompare(b.routine?.name || '');
      if (routineCompare !== 0) return routineCompare;
      // Third: by task order within routine
      return (a.order || 0) - (b.order || 0);
    });

  const multiTasks = regularTasks
    .filter((t) => t.type === TaskType.MULTIPLE_CHECKIN)
    .sort((a, b) => {
      // First: tasks with 0 completions on top
      const aIncomplete = (a.completionCount || 0) === 0;
      const bIncomplete = (b.completionCount || 0) === 0;
      if (aIncomplete !== bIncomplete) return aIncomplete ? -1 : 1;
      // Second: group by routine name
      const routineCompare = (a.routine?.name || '').localeCompare(b.routine?.name || '');
      if (routineCompare !== 0) return routineCompare;
      // Third: by task order within routine
      return (a.order || 0) - (b.order || 0);
    });

  const progressTasks = regularTasks
    .filter((t) => t.type === TaskType.PROGRESS)
    .sort((a, b) => {
      // First: tasks with 0 progress on top
      const aIncomplete = (a.totalValue || 0) === 0;
      const bIncomplete = (b.totalValue || 0) === 0;
      if (aIncomplete !== bIncomplete) return aIncomplete ? -1 : 1;
      // Second: group by routine name
      const routineCompare = (a.routine?.name || '').localeCompare(b.routine?.name || '');
      if (routineCompare !== 0) return routineCompare;
      // Third: by task order within routine
      return (a.order || 0) - (b.order || 0);
    });

  // Group teacher-only tasks by type
  const teacherSimpleTasks = teacherOnlyTasks.filter((t) => t.type === TaskType.SIMPLE);
  const teacherMultiTasks = teacherOnlyTasks.filter((t) => t.type === TaskType.MULTIPLE_CHECKIN);
  const teacherProgressTasks = teacherOnlyTasks.filter((t) => t.type === TaskType.PROGRESS);

  // Calculate stats for Simple tasks
  const simpleCompleted = simpleTasks.filter((t) => t.isComplete).length;
  const simpleTotal = simpleTasks.length;

  // Calculate stats for Teacher-only Simple tasks
  const teacherSimpleCompleted = teacherSimpleTasks.filter((t) => t.isComplete).length;
  const teacherSimpleTotal = teacherSimpleTasks.length;

  // Goal statistics
  const activeGoals = goals?.filter(g => g.status === 'ACTIVE') || [];
  const goalCount = activeGoals.length;
  const goalsAccomplished = activeGoals.filter(g => g.progress?.achieved).length;
  const goalProgress = goalCount > 0 ? (goalsAccomplished / goalCount) * 100 : 0;

  // State for collapsible sections
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [simpleOpen, setSimpleOpen] = useState(false);
  const [multiOpen, setMultiOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [teacherNotesOpen, setTeacherNotesOpen] = useState(false);

  // State for progress task input values
  const [progressValues, setProgressValues] = useState<Record<string, string>>({});

  // State for animating tasks (visual feedback)
  const [animatingTasks, setAnimatingTasks] = useState<Set<string>>(new Set());

  // State for undo timers
  const [undoTimers, setUndoTimers] = useState<Record<string, number>>({});

  // Update undo timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimers: Record<string, number> = {};

      simpleTasks.forEach((task) => {
        if (task.type === TaskType.SIMPLE && task.completions && task.completions.length > 0) {
          const recentCompletion = task.completions.find((c) => c.personId === personId);
          if (recentCompletion && canUndoCompletion(recentCompletion.completedAt, task.type)) {
            newTimers[task.id] = getRemainingUndoTime(recentCompletion.completedAt);
          }
        }
      });

      setUndoTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [simpleTasks, personId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[420px] h-auto max-h-[90vh] p-0 gap-0 rounded-[24px]">
        {/* Header */}
        <div className="border-b border-[#ECEFF1] p-6 flex flex-col" style={{
          background: 'linear-gradient(135deg, rgba(77, 182, 172, 0.05), rgba(38, 166, 154, 0.05))'
        }}>
          <div className="flex items-center justify-between">
            <h1 className="text-[26px] font-bold leading-tight" style={{ color: '#1F2937' }}>
              {personName}'s Check-in
            </h1>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-5 w-5" />
            </Button>
          </div>
          {simpleCompleted > 0 && (
            <div className="mt-1 text-[15px] font-semibold" style={{ color: 'var(--warm-complete-secondary)' }}>
              ✨ {simpleCompleted} tasks done today
            </div>
          )}
          <div className="mt-1 text-[14px]" style={{ color: '#6B7280' }}>
            You're doing great!
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 bg-white" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {tasksLoading ? (
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
            <div className="space-y-3">
              {/* Goals Section */}
              <Collapsible open={goalsOpen} onOpenChange={setGoalsOpen}>
                <div className="border-2 border-gray-300 rounded-lg bg-white">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">🎯 Goals</h3>
                          {goalCount > 0 && (
                            <span className="text-sm text-gray-500">({goalCount})</span>
                          )}
                        </div>
                        <div className="mt-2">
                          <Progress value={goalProgress} max={100} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {goalCount > 0 ? (
                              `${goalsAccomplished} of ${goalCount} achieved (${Math.round(goalProgress)}%)`
                            ) : (
                              'No goals set'
                            )}
                          </p>
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
                      {goalCount > 0 ? (
                        <div className="space-y-2">
                          {activeGoals.map((goal) => (
                            <div key={goal.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{goal.name}</span>
                                {goal.progress?.achieved && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                    Achieved!
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={goal.progress?.percentage || 0}
                                  max={100}
                                  className="h-1.5 w-16"
                                />
                                <span className="text-xs text-gray-500">
                                  {Math.round(goal.progress?.percentage || 0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">
                          No goals have been set yet
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Simple Tasks Section */}
              {simpleTasks.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[12px] font-bold uppercase mb-3" style={{
                    color: '#374151',
                    letterSpacing: '0.5px'
                  }}>
                    CHECKLIST ({simpleCompleted}/{simpleTotal})
                  </h3>
                  <div className="space-y-[10px]">
                    {simpleTasks.map((task) => {
                      const undoTime = undoTimers[task.id];
                      const canUndo = task.isComplete && undoTime !== undefined && undoTime > 0;
                      const isLocked = task.isComplete && !canUndo;

                      return (
                        <button
                          key={task.id}
                          onClick={() => {
                            if (isLocked) return; // No action for locked tasks
                            task.isComplete ? handleUndo(task.completions?.[0]?.id!) : handleComplete(task.id);
                          }}
                          disabled={completeMutation.isPending || undoMutation.isPending}
                          className="w-full text-left rounded-[16px] p-[14px_16px] flex items-start gap-3 transition-all duration-[250ms]"
                          style={{
                            background: task.isComplete ? 'var(--warm-complete-bg)' : 'var(--warm-incomplete-bg)',
                            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: isLocked ? 'default' : 'pointer',
                            opacity: isLocked ? 0.7 : 1
                          }}
                        >
                          {/* C4 Rotating Square */}
                          <div
                            className="w-3 h-3 mt-1 flex-shrink-0 transition-all duration-[250ms]"
                            style={{
                              border: `2.5px solid ${task.isComplete ? 'var(--warm-complete-primary)' : 'var(--warm-incomplete-primary)'}`,
                              background: task.isComplete ? 'var(--warm-complete-primary)' : 'transparent',
                              transform: task.isComplete ? 'rotate(45deg)' : 'rotate(0deg)',
                              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div
                                className="font-semibold mb-0.5 leading-[1.3]"
                                style={{
                                  fontSize: task.name.length > 16 ? `${16 * (16 / task.name.length)}px` : '16px',
                                  color: task.isComplete ? 'var(--warm-complete-secondary)' : 'var(--warm-incomplete-secondary)'
                                }}
                              >
                                {task.name}
                              </div>
                              {canUndo && (
                                <div className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{
                                  background: 'rgba(77, 182, 172, 0.15)',
                                  color: 'var(--warm-complete-secondary)'
                                }}>
                                  {Math.floor(undoTime / 60)}:{(undoTime % 60).toString().padStart(2, '0')}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Multi Check-in Tasks Section */}
              {multiTasks.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[12px] font-bold uppercase mb-3" style={{
                    color: '#374151',
                    letterSpacing: '0.5px'
                  }}>
                    CHECK-INS ({multiTasks.length})
                  </h3>
                  <div className="space-y-[10px]">
                    {multiTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-[14px] p-[14px_16px] transition-all duration-1000"
                        style={{
                          background: animatingTasks.has(task.id) ? 'var(--warm-complete-bg)' : 'var(--warm-progress-bg)'
                        }}
                      >
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-[20px] flex-shrink-0">✔️</span>
                          <div
                            className="font-semibold"
                            style={{
                              fontSize: task.name.length > 16 ? `${15 * (16 / task.name.length)}px` : '15px',
                              color: 'var(--warm-progress-secondary)'
                            }}
                          >
                            {task.name}
                          </div>
                          <div className="text-[13px] font-semibold" style={{ color: 'var(--warm-progress-primary)' }}>
                            {task.completionCount || 0}x
                          </div>
                          {/* Goal Badges */}
                          {activeGoals
                            .filter((goal: any) => goal.taskLinks?.some((link: any) => link.taskId === task.id))
                            .map((goal: any) => (
                              <div
                                key={goal.id}
                                className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[12px] font-semibold whitespace-nowrap overflow-hidden"
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
                          <button
                            onClick={() => handleCompleteWithAnimation(task.id)}
                            disabled={completeMutation.isPending}
                            className="px-[14px] py-[6px] rounded-[10px] text-[13px] font-semibold bg-white transition-all duration-200 active:scale-95 ml-auto"
                            style={{
                              border: '1px solid var(--warm-progress-primary)',
                              color: 'var(--warm-progress-secondary)'
                            }}
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Tasks Section */}
              {progressTasks.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[12px] font-bold uppercase mb-3" style={{
                    color: '#374151',
                    letterSpacing: '0.5px'
                  }}>
                    PROGRESS ({progressTasks.length})
                  </h3>
                  <div className="space-y-[10px]">
                    {progressTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-[14px] p-[14px_16px] transition-all duration-1000"
                        style={{
                          background: animatingTasks.has(task.id) ? 'var(--warm-complete-bg)' : 'var(--warm-progress-bg)'
                        }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[20px] flex-shrink-0">📊</span>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-semibold"
                              style={{
                                fontSize: task.name.length > 16 ? `${15 * (16 / task.name.length)}px` : '15px',
                                color: 'var(--warm-progress-secondary)'
                              }}
                            >
                              {task.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={progressValues[task.id] || ''}
                            onChange={(e) => setProgressValues({ ...progressValues, [task.id]: e.target.value })}
                            placeholder="0"
                            className="flex-1 px-[10px] py-[6px] rounded-[8px] text-[13px] font-semibold text-center"
                            style={{
                              border: '1px solid var(--warm-progress-primary)',
                              color: 'var(--warm-progress-secondary)',
                              width: '70px'
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
                            className="px-[14px] py-[6px] rounded-[10px] text-[13px] font-semibold bg-white transition-all duration-200 active:scale-95"
                            style={{
                              border: '1px solid var(--warm-progress-primary)',
                              color: 'var(--warm-progress-secondary)'
                            }}
                          >
                            Add
                          </button>
                          <div className="text-[13px] font-semibold min-w-[70px] text-right" style={{ color: 'var(--warm-progress-primary)' }}>
                            {task.summedValue || task.totalValue || 0} {task.unit}
                          </div>
                        </div>

                        {/* Goal Badges */}
                        {activeGoals.filter((goal: any) => goal.taskLinks?.some((link: any) => link.taskId === task.id)).length > 0 && (
                          <div className="flex flex-wrap gap-2 ml-8">
                            {activeGoals
                              .filter((goal: any) => goal.taskLinks?.some((link: any) => link.taskId === task.id))
                              .map((goal: any) => (
                                <div
                                  key={goal.id}
                                  className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[12px] font-semibold whitespace-nowrap overflow-hidden"
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
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WORKFLOW #1: Teacher Notes Section - Only visible to teachers */}
              {isTeacher && teacherOnlyTasks.length > 0 && (
                <Collapsible open={teacherNotesOpen} onOpenChange={setTeacherNotesOpen}>
                  <div className="border-2 border-purple-400 rounded-lg bg-purple-50">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover:bg-purple-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-purple-900">📋 Teacher Notes</h3>
                            <span className="px-2 py-0.5 text-xs font-semibold bg-purple-200 text-purple-800 rounded-full">
                              Teacher Only
                            </span>
                          </div>
                          {teacherSimpleTotal > 0 && (
                            <div>
                              <Progress
                                value={teacherSimpleCompleted}
                                max={teacherSimpleTotal}
                                className="h-2 bg-purple-200"
                              />
                              <p className="text-xs text-purple-700 mt-1">
                                {teacherSimpleCompleted} of {teacherSimpleTotal} completed
                              </p>
                            </div>
                          )}
                        </div>
                        {teacherNotesOpen ? (
                          <ChevronDown className="h-5 w-5 text-purple-700 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-purple-700 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 pt-0 border-t border-purple-300">
                        {/* Teacher Simple Tasks */}
                        {teacherSimpleTasks.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-purple-900 mb-2">✓ Simple Tasks</h4>
                            <TaskColumn
                              title=""
                              tasks={teacherSimpleTasks}
                              personId={personId}
                              onComplete={handleComplete}
                              onUndo={handleUndo}
                              isPending={completeMutation.isPending || undoMutation.isPending}
                            />
                          </div>
                        )}

                        {/* Teacher Multi Check-in Tasks */}
                        {teacherMultiTasks.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-purple-900 mb-2">
                              ✔️ Check-ins ({teacherMultiTasks.length})
                            </h4>
                            <TaskColumn
                              title=""
                              tasks={teacherMultiTasks}
                              personId={personId}
                              onComplete={handleComplete}
                              onUndo={handleUndo}
                              isPending={completeMutation.isPending || undoMutation.isPending}
                            />
                          </div>
                        )}

                        {/* Teacher Progress Tasks */}
                        {teacherProgressTasks.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-purple-900 mb-2">
                              📊 Progress ({teacherProgressTasks.length})
                            </h4>
                            <TaskColumn
                              title=""
                              tasks={teacherProgressTasks}
                              personId={personId}
                              onComplete={handleComplete}
                              onUndo={handleUndo}
                              isPending={completeMutation.isPending || undoMutation.isPending}
                            />
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
