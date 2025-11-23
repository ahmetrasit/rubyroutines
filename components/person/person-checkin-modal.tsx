'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Loader2 } from 'lucide-react';
import { TaskType } from '@/lib/types/prisma-enums';
import { useToast } from '@/components/ui/toast';
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
  linkedGoals?: Array<{
    id: string;
    name: string;
    progress: { percentage: number; achieved: boolean };
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
  const [undoTimers, setUndoTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // State for tracking progress task input values
  const [progressInputValues, setProgressInputValues] = useState<Record<string, string>>({});

  // PersonCheckinModal always uses dashboard mode (mobile design)
  // Kiosk mode is used in a separate kiosk interface context
  const isKioskMode = false;

  // Clear progress input values when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setProgressInputValues({});
    }
  }, [isOpen]);

  const { data: session } = trpc.auth.getSession.useQuery();

  // Fetch person details with routines and tasks
  const { data: person, isLoading: tasksLoading } = trpc.person.getById.useQuery(
    { id: personId },
    { enabled: isOpen && !!personId }
  );

  // Get current user's role from session
  const currentRole = session?.user?.roles?.[0];

  // Get goals for this person
  const { data: goals } = trpc.goal.list.useQuery(
    { roleId: currentRole?.id!, personId },
    { enabled: isOpen && !!currentRole?.id && !!personId }
  );

  const isTeacher = currentRole?.type === 'TEACHER';

  // Flatten all tasks from all routines assigned to this person
  const tasks: Task[] = person?.assignments?.flatMap((assignment: any) =>
    assignment.routine.tasks.map((task: any) => {
      const resetPeriodStart = getResetPeriodStart(
        assignment.routine.resetPeriod,
        assignment.routine.resetDay
      );

      const periodCompletions = (task.completions || []).filter((c: any) => {
        return new Date(c.completedAt) >= resetPeriodStart;
      });

      const lastCompletion = periodCompletions[0];
      const isComplete = task.type === 'SIMPLE' && periodCompletions.length > 0;

      // Get linked goals for this task
      const taskGoals = goals?.filter((g: any) =>
        g.tasks?.some((t: any) => t.id === task.id)
      ).map((g: any) => ({
        id: g.id,
        name: g.name,
        progress: g.progress || { percentage: 0, achieved: false }
      })) || [];

      return {
        ...task,
        routineName: assignment.routine.name,
        isTeacherOnly: assignment.routine.isTeacherOnly || false,
        isComplete,
        completionCount: periodCompletions.length,
        entryNumber: lastCompletion?.entryNumber || periodCompletions.length,
        summedValue: lastCompletion?.summedValue || 0,
        completions: periodCompletions,
        linkedGoals: taskGoals,
      };
    })
  ) || [];

  const completeMutation = trpc.task.complete.useMutation({
    onSuccess: async () => {
      await utils.person.getById.refetch({ id: personId });
      await utils.goal.list.invalidate();
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
      await utils.goal.list.invalidate();
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

  const handleTaskClick = (task: Task) => {
    if (task.type !== TaskType.SIMPLE) return;

    if (task.isComplete && task.completions && task.completions[0]) {
      // Undo completion
      handleUndo(task.completions[0].id);
    } else {
      // Complete task
      handleComplete(task.id);
    }
  };

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

  const handleProgressUpdate = (taskId: string, value: string) => {
    if (!value || value.trim() === '') return;
    handleComplete(taskId, value);
  };

  // Separate teacher-only tasks from regular tasks
  const regularTasks = tasks.filter((t) => !t.isTeacherOnly);
  const teacherOnlyTasks = tasks.filter((t) => t.isTeacherOnly);

  // Group regular tasks by type
  const simpleTasks = regularTasks.filter((t) => t.type === TaskType.SIMPLE);
  const multiTasks = regularTasks.filter((t) => t.type === TaskType.MULTIPLE_CHECKIN);
  const progressTasks = regularTasks.filter((t) => t.type === TaskType.PROGRESS);

  // Calculate stats
  const simpleCompleted = simpleTasks.filter((t) => t.isComplete).length;
  const simpleTotal = simpleTasks.length;

  // Render dashboard mode (smartphone - A3 cards with C4 squares)
  const renderDashboardMode = () => (
    <>
      {/* Header */}
      <div className="warm-earth-header-dashboard">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="dashboard-title">{personName}'s Check-in</h2>
            {simpleCompleted > 0 && (
              <div className="dashboard-completed">✨ {simpleCompleted} tasks done today</div>
            )}
            <div className="dashboard-subtitle">You're doing great!</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content">
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
          <div className="space-y-5">
            {/* Simple Tasks */}
            {simpleTasks.length > 0 && (
              <div>
                <div className="dashboard-section-title">
                  CHECKLIST ({simpleCompleted}/{simpleTotal})
                </div>
                <div className="space-y-2.5">
                  {simpleTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`dashboard-task-card ${task.isComplete ? 'complete' : ''}`}
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="dashboard-square"></div>
                      <div className="dashboard-task-content">
                        <div className="dashboard-task-name">{task.name}</div>
                        {task.description && (
                          <div className="dashboard-task-desc">{task.description}</div>
                        )}
                        {task.linkedGoals && task.linkedGoals.length > 0 && (
                          <div className="dashboard-goal-progress">
                            <span className="dashboard-goal-badge">
                              🎯 {task.linkedGoals[0].name}
                            </span>
                            <div className="dashboard-goal-bar-container">
                              <div
                                className="dashboard-goal-bar-fill"
                                style={{ width: `${task.linkedGoals[0].progress.percentage}%` }}
                              ></div>
                            </div>
                            <span className="dashboard-goal-percent">
                              {Math.round(task.linkedGoals[0].progress.percentage)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multi Check-in Tasks */}
            {multiTasks.length > 0 && (
              <div>
                <div className="dashboard-section-title">CHECK-INS ({multiTasks.length})</div>
                <div className="space-y-2.5">
                  {multiTasks.map((task) => (
                    <div key={task.id} className="dashboard-progress-card">
                      <div className="dashboard-progress-emoji">✔️</div>
                      <div className="dashboard-progress-content">
                        <div className="dashboard-progress-name">{task.name}</div>
                        {task.description && (
                          <div className="dashboard-progress-desc">{task.description}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleComplete(task.id)}
                        disabled={completeMutation.isPending}
                        className="dashboard-progress-button"
                      >
                        +1
                      </Button>
                      <div className="dashboard-progress-value">
                        {task.completionCount || 0}x
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Tasks */}
            {progressTasks.length > 0 && (
              <div>
                <div className="dashboard-section-title">PROGRESS ({progressTasks.length})</div>
                <div className="space-y-2.5">
                  {progressTasks.map((task) => {
                    const inputValue = progressInputValues[task.id] || '';
                    return (
                      <div key={task.id} className="dashboard-progress-card">
                        <div className="dashboard-progress-emoji">📊</div>
                        <div className="dashboard-progress-content">
                          <div className="dashboard-progress-name">{task.name}</div>
                          {task.description && (
                            <div className="dashboard-progress-desc">{task.description}</div>
                          )}
                        </div>
                        <input
                          type="number"
                          value={inputValue}
                          onChange={(e) => setProgressInputValues(prev => ({ ...prev, [task.id]: e.target.value }))}
                          placeholder="0"
                          className="dashboard-progress-input"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            handleProgressUpdate(task.id, inputValue);
                            setProgressInputValues(prev => ({ ...prev, [task.id]: '' }));
                          }}
                          disabled={completeMutation.isPending || !inputValue}
                          className="dashboard-progress-button"
                        >
                          Add
                        </Button>
                        <div className="dashboard-progress-value">
                          {task.summedValue || 0} {task.unit || ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  // Render kiosk mode (tablet - with TaskColumn component and Warm Earth styling)
  const renderKioskMode = () => (
    <>
      {/* Kiosk Header */}
      <div className="warm-earth-header-kiosk">
        <div className="flex items-center justify-between">
          <h2 className="kiosk-title">{personName}'s Check-in</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Kiosk Content */}
      <div className="kiosk-content">
        {tasksLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin" style={{ color: 'var(--warm-complete-primary)' }} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--warm-text-primary)' }}>All done!</h2>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left Column: Simple Tasks */}
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--warm-text-primary)' }}>
                Simple Tasks ({simpleCompleted}/{simpleTotal})
              </h3>
              <div className="flex-1 overflow-y-auto pr-2">
                <TaskColumn
                  title=""
                  tasks={simpleTasks}
                  personId={personId}
                  onComplete={handleComplete}
                  onUndo={handleUndo}
                  isPending={completeMutation.isPending || undoMutation.isPending}
                />
              </div>
            </div>

            {/* Right Column: Multi Check-in and Progress */}
            <div className="flex flex-col gap-6 h-full">
              {/* Multi Check-in Tasks */}
              {multiTasks.length > 0 && (
                <div className="flex flex-col" style={{ maxHeight: '45%' }}>
                  <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--warm-text-primary)' }}>
                    Check-ins ({multiTasks.length})
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2">
                    <TaskColumn
                      title=""
                      tasks={multiTasks}
                      personId={personId}
                      onComplete={handleComplete}
                      onUndo={handleUndo}
                      isPending={completeMutation.isPending || undoMutation.isPending}
                    />
                  </div>
                </div>
              )}

              {/* Progress Tasks */}
              {progressTasks.length > 0 && (
                <div className="flex flex-col" style={{ maxHeight: multiTasks.length > 0 ? '45%' : '100%' }}>
                  <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--warm-text-primary)' }}>
                    Progress ({progressTasks.length})
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2">
                    <TaskColumn
                      title=""
                      tasks={progressTasks}
                      personId={personId}
                      onComplete={handleComplete}
                      onUndo={handleUndo}
                      isPending={completeMutation.isPending || undoMutation.isPending}
                    />
                  </div>
                </div>
              )}

              {/* Goals Overview */}
              {activeGoals.length > 0 && (
                <div className="flex flex-col" style={{ maxHeight: '30%' }}>
                  <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--warm-text-primary)' }}>
                    🎯 Goals ({goalCount})
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-2">
                      {activeGoals.map((goal) => (
                        <div
                          key={goal.id}
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: goal.progress?.achieved
                              ? 'var(--warm-complete-bg)'
                              : 'var(--warm-progress-bg)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold" style={{ color: 'var(--warm-text-primary)' }}>
                              {goal.name}
                            </span>
                            {goal.progress?.achieved && (
                              <span className="text-xs px-2 py-1 rounded-full" style={{
                                backgroundColor: 'var(--warm-complete-primary)',
                                color: 'white'
                              }}>
                                Achieved!
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{
                              backgroundColor: 'rgba(144, 202, 249, 0.2)'
                            }}>
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${goal.progress?.percentage || 0}%`,
                                  background: 'linear-gradient(90deg, var(--warm-progress-primary) 0%, var(--warm-progress-secondary) 100%)'
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold" style={{ color: 'var(--warm-progress-primary)' }}>
                              {Math.round(goal.progress?.percentage || 0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`warm-earth-modal ${isKioskMode ? 'kiosk-mode' : 'dashboard-mode'}`}
        style={{
          maxWidth: isKioskMode ? '95vw' : '420px',
          height: isKioskMode ? '90vh' : 'auto',
          maxHeight: '90vh',
          padding: 0,
          gap: 0,
        }}
      >
        {isKioskMode ? renderKioskMode() : renderDashboardMode()}
      </DialogContent>
    </Dialog>
  );
}
