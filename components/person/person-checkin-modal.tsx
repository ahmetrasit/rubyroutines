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

  // Determine if we're in kiosk mode (tablet) or dashboard mode (smartphone)
  const [isKioskMode, setIsKioskMode] = useState(false);

  useEffect(() => {
    const checkMode = () => {
      setIsKioskMode(window.innerWidth >= 768);
    };

    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, []);
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

  const handleUndo = (completionId: string) => {
    undoMutation.mutate({ completionId });
  };

  // REQUIREMENT #4 & WORKFLOW #1: Separate teacher-only tasks from regular tasks
  const regularTasks = tasks.filter((t) => !t.isTeacherOnly);
  const teacherOnlyTasks = tasks.filter((t) => t.isTeacherOnly);

  // Group regular tasks by type
  const simpleTasks = regularTasks.filter((t) => t.type === TaskType.SIMPLE);
  const multiTasks = regularTasks.filter((t) => t.type === TaskType.MULTIPLE_CHECKIN);
  const progressTasks = regularTasks.filter((t) => t.type === TaskType.PROGRESS);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-[95vw] h-[90vh] p-0 gap-0 warm-earth-checkin ${isKioskMode ? 'kiosk-mode' : 'dashboard-mode'}`}>
        {/* Header */}
        <div className="warm-earth-header p-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold" style={{ color: 'var(--warm-text-primary)' }}>
              {personName}'s Check-in
            </h2>
            <div className="text-sm mt-1" style={{ color: 'var(--warm-complete-secondary)' }}>
              {simpleCompleted > 0 && `✨ ${simpleCompleted} tasks done today`}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: 'var(--warm-background)' }}>
          {tasksLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--warm-complete-primary)' }} />
            </div>
          ) : tasks.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="font-bold" style={{ color: 'var(--warm-text-primary)' }}>All done!</h2>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Goals Section */}
              <Collapsible open={goalsOpen} onOpenChange={setGoalsOpen}>
                <div className="warm-section">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-4 flex items-center justify-between hover:opacity-90 transition-opacity rounded-t-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold" style={{ color: 'var(--warm-text-primary)' }}>🎯 Goals</h3>
                          {goalCount > 0 && (
                            <span className="text-sm" style={{ color: 'var(--warm-text-secondary)' }}>({goalCount})</span>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="warm-goal-bar-container">
                            <div className="warm-goal-bar-fill" style={{ width: `${goalProgress}%` }}></div>
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--warm-text-secondary)' }}>
                            {goalCount > 0 ? (
                              `${goalsAccomplished} of ${goalCount} achieved (${Math.round(goalProgress)}%)`
                            ) : (
                              'No goals set'
                            )}
                          </p>
                        </div>
                      </div>
                      {goalsOpen ? (
                        <ChevronDown className="h-5 w-5 flex-shrink-0 ml-2" style={{ color: 'var(--warm-text-secondary)' }} />
                      ) : (
                        <ChevronRight className="h-5 w-5 flex-shrink-0 ml-2" style={{ color: 'var(--warm-text-secondary)' }} />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 pt-0 border-t" style={{ borderColor: 'var(--warm-border-light)' }}>
                      {goalCount > 0 ? (
                        <div className="space-y-2">
                          {activeGoals.map((goal) => (
                            <div key={goal.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--warm-task-incomplete-bg)' }}>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium" style={{ color: 'var(--warm-text-primary)' }}>{goal.name}</span>
                                {goal.progress?.achieved && (
                                  <span className="text-xs px-2 py-0.5 rounded" style={{
                                    backgroundColor: 'var(--warm-complete-bg)',
                                    color: 'var(--warm-complete-secondary)'
                                  }}>
                                    Achieved!
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="warm-goal-bar-container h-1.5 w-16">
                                  <div className="warm-goal-bar-fill" style={{ width: `${goal.progress?.percentage || 0}%` }}></div>
                                </div>
                                <span className="warm-goal-percent text-xs">
                                  {Math.round(goal.progress?.percentage || 0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--warm-text-secondary)' }}>
                          No goals have been set yet
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Simple Tasks Section */}
              {simpleTasks.length > 0 && (
                <Collapsible open={simpleOpen} onOpenChange={setSimpleOpen}>
                  <div className="warm-section">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover:opacity-90 transition-opacity rounded-t-lg">
                        <div className="flex-1">
                          <h3 className="font-bold mb-2" style={{ color: 'var(--warm-text-primary)' }}>
                            ✓ Simple Tasks
                          </h3>
                          <div>
                            <div className="warm-goal-bar-container">
                              <div className="warm-goal-bar-fill" style={{ width: `${(simpleCompleted / simpleTotal) * 100}%` }}></div>
                            </div>
                            <p className="text-xs mt-1" style={{ color: 'var(--warm-text-secondary)' }}>
                              {simpleCompleted} of {simpleTotal} completed
                            </p>
                          </div>
                        </div>
                        {simpleOpen ? (
                          <ChevronDown className="h-5 w-5 flex-shrink-0 ml-2" style={{ color: 'var(--warm-text-secondary)' }} />
                        ) : (
                          <ChevronRight className="h-5 w-5 flex-shrink-0 ml-2" style={{ color: 'var(--warm-text-secondary)' }} />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 pt-0 border-t" style={{ borderColor: 'var(--warm-border-light)' }}>
                        <TaskColumn
                          title=""
                          tasks={simpleTasks}
                          personId={personId}
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
                  <div className="warm-section">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover:opacity-90 transition-opacity rounded-t-lg">
                        <div className="flex-1">
                          <h3 className="font-bold" style={{ color: 'var(--warm-text-primary)' }}>
                            ✔️ Check-ins ({multiTasks.length})
                          </h3>
                        </div>
                        {multiOpen ? (
                          <ChevronDown className="h-5 w-5 flex-shrink-0 ml-2" style={{ color: 'var(--warm-text-secondary)' }} />
                        ) : (
                          <ChevronRight className="h-5 w-5 flex-shrink-0 ml-2" style={{ color: 'var(--warm-text-secondary)' }} />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 pt-0 border-t" style={{ borderColor: 'var(--warm-border-light)' }}>
                        <TaskColumn
                          title=""
                          tasks={multiTasks}
                          personId={personId}
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
                  <div className="warm-section">
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover:opacity-90 transition-opacity rounded-t-lg">
                        <div className="flex-1">
                          <h3 className="font-bold" style={{ color: 'var(--warm-text-primary)' }}>
                            📊 Progress ({progressTasks.length})
                          </h3>
                        </div>
                        {progressOpen ? (
                          <ChevronDown className="h-5 w-5 flex-shrink-0 ml-2" style={{ color: 'var(--warm-text-secondary)' }} />
                        ) : (
                          <ChevronRight className="h-5 w-5 flex-shrink-0 ml-2" style={{ color: 'var(--warm-text-secondary)' }} />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 pt-0 border-t" style={{ borderColor: 'var(--warm-border-light)' }}>
                        <TaskColumn
                          title=""
                          tasks={progressTasks}
                          personId={personId}
                          onComplete={handleComplete}
                          onUndo={handleUndo}
                          isPending={completeMutation.isPending || undoMutation.isPending}
                        />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
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
