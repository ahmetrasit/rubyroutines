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
  const { data: session } = trpc.auth.getSession.useQuery();

  // Fetch person details with routines and tasks
  const { data: person, isLoading: tasksLoading } = trpc.person.getById.useQuery(
    { id: personId },
    { enabled: isOpen && !!personId }
  );

  // Get current user's role to check if they're a teacher
  const { data: currentRole } = trpc.role.list.useQuery(undefined, {
    enabled: isOpen && !!session?.user?.id,
    select: (roles) => roles.find((r) => r.userId === session?.user?.id),
  });

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

  // State for collapsible sections
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [simpleOpen, setSimpleOpen] = useState(false);
  const [multiOpen, setMultiOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [teacherNotesOpen, setTeacherNotesOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{personName}'s Check-in</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
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
