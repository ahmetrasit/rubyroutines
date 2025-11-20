'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Check, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { TaskType } from '@/lib/types/prisma-enums';
import { getResetPeriodStart } from '@/lib/services/reset-period';
import { GRAY_SCALE } from '@/lib/constants/theme';

interface TeacherBulkCheckinProps {
  classroomId: string;
  classroomName: string;
  roleId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface StudentTask {
  studentId: string;
  studentName: string;
  studentAvatar: string;
  tasks: Array<{
    id: string;
    name: string;
    routineName: string;
    type: TaskType;
    isComplete: boolean;
    completionId?: string;
  }>;
}

export function TeacherBulkCheckin({
  classroomId,
  classroomName,
  roleId,
  isOpen,
  onClose
}: TeacherBulkCheckinProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get classroom members
  const { data: classroom, isLoading: classroomLoading } = trpc.group.getById.useQuery(
    { id: classroomId },
    { enabled: isOpen && !!classroomId }
  );

  // Get all persons for this role
  const { data: persons, isLoading: personsLoading } = trpc.person.list.useQuery(
    { roleId },
    { enabled: isOpen && !!roleId }
  );

  const isLoading = classroomLoading || personsLoading;

  // Get students (non-account owners) who are members of this classroom
  const students = persons?.filter(p =>
    !p.isAccountOwner &&
    classroom?.members?.some((m: any) => m.personId === p.id)
  ) || [];

  // State to track which students' tasks are loaded
  const [studentTasks, setStudentTasks] = useState<StudentTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  /**
   * Extracts teacher-only tasks from a person's data.
   * Processes tasks from teacher-only routines and determines their completion status
   * within the current reset period.
   *
   * @param personData - The person data with assignments
   * @returns Array of teacher-only tasks with completion status
   */
  const extractTeacherTasks = (personData: any): any[] => {
    return personData?.assignments
      ?.filter((assignment: any) => assignment.routine.isTeacherOnly)
      ?.flatMap((assignment: any) =>
        assignment.routine.tasks.map((task: any) => {
          // Determine the reset period for this routine
          const resetPeriodStart = getResetPeriodStart(
            assignment.routine.resetPeriod,
            assignment.routine.resetDay
          );

          // Filter completions to only those within the current reset period
          const periodCompletions = (task.completions || []).filter((c: any) => {
            return new Date(c.completedAt) >= resetPeriodStart;
          });

          // Simple tasks are complete if they have any completions in the period
          const isComplete = task.type === 'SIMPLE' && periodCompletions.length > 0;
          const completionId = periodCompletions[0]?.id;

          return {
            id: task.id,
            name: task.name,
            routineName: assignment.routine.name,
            type: task.type,
            isComplete,
            completionId,
          };
        })
      ) || [];
  };

  /**
   * Fetches and builds the complete student tasks array for all students.
   * Uses batch fetching to eliminate N+1 query problem.
   *
   * @param withLoading - Whether to manage the loading state (true for initial load, false for refetch)
   * @returns Array of StudentTask objects
   */
  const buildStudentTasksArray = async (withLoading = false): Promise<StudentTask[]> => {
    if (withLoading) {
      setTasksLoading(true);
    }

    if (students.length === 0) {
      if (withLoading) {
        setTasksLoading(false);
      }
      return [];
    }

    try {
      // Batch fetch all student data in a single query
      const studentIds = students.map(s => s.id);
      const batchPersonData = await utils.person.getBatch.fetch({ ids: studentIds });

      // Build the student tasks array from batch data
      const allStudentTasks: StudentTask[] = [];

      for (const student of students) {
        const personData = batchPersonData.find(p => p.id === student.id);

        if (personData) {
          const teacherOnlyTasks = extractTeacherTasks(personData);

          allStudentTasks.push({
            studentId: student.id,
            studentName: student.name,
            studentAvatar: student.avatar,
            tasks: teacherOnlyTasks,
          });
        } else {
          console.warn(`No data found for student ${student.id}`);
        }
      }

      if (withLoading) {
        setTasksLoading(false);
      }

      return allStudentTasks;
    } catch (error) {
      console.error('Failed to fetch batch student data:', error);

      if (withLoading) {
        setTasksLoading(false);
      }

      return [];
    }
  };

  // Fetch teacher-only tasks for all students on initial load
  useEffect(() => {
    if (!isOpen || students.length === 0) {
      setTasksLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      const tasks = await buildStudentTasksArray(true);
      setStudentTasks(tasks);
    };

    fetchInitialData();
  }, [students, isOpen]);

  // Get unique tasks across all students (for column headers)
  const uniqueTasks = Array.from(
    new Map(
      studentTasks
        .flatMap(st => st.tasks)
        .filter(t => t.type === TaskType.SIMPLE) // Only show simple tasks in bulk view
        .map(t => [t.id, { id: t.id, name: t.name, routineName: t.routineName }])
    ).values()
  );

  /**
   * Refetches all student data and rebuilds the student tasks array.
   * This function invalidates cached batch data, fetches fresh data,
   * and updates the component state.
   *
   * @returns Promise that resolves when all data has been refreshed
   */
  const refetchStudentTasks = async (): Promise<void> => {
    if (students.length === 0) return;

    // Invalidate cached batch data
    const studentIds = students.map(s => s.id);
    await utils.person.getBatch.invalidate({ ids: studentIds });

    // Rebuild the tasks array without managing loading state
    const tasks = await buildStudentTasksArray(false);
    setStudentTasks(tasks);
  };

  // Track pending operations for visual feedback
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  const completeMutation = trpc.task.complete.useMutation({
    onMutate: async ({ taskId, personId }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await utils.person.getBatch.cancel();

      // Snapshot the previous state for rollback
      const previousTasks = studentTasks;

      // Optimistically update the UI
      setStudentTasks(current =>
        current.map(student =>
          student.studentId === personId
            ? {
                ...student,
                tasks: student.tasks.map(task =>
                  task.id === taskId
                    ? { ...task, isComplete: true, completionId: 'optimistic-' + Date.now() }
                    : task
                ),
              }
            : student
        )
      );

      // Add to pending operations
      setPendingOperations(prev => new Set(prev).add(`${personId}-${taskId}`));

      // Return context for rollback
      return { previousTasks, taskId, personId };
    },
    onSuccess: async () => {
      // Refetch to sync with server state
      await refetchStudentTasks();

      // Invalidate goal queries for real-time progress updates
      utils.goal.list.invalidate();
      utils.goal.getGoalsForTask.invalidate();
      utils.goal.getGoalsForRoutine.invalidate();

      toast({
        title: 'Success',
        description: 'Task completed!',
        variant: 'success',
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state
      if (context?.previousTasks) {
        setStudentTasks(context.previousTasks);
      }

      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: (data, error, variables) => {
      // Remove from pending operations
      setPendingOperations(prev => {
        const next = new Set(prev);
        next.delete(`${variables.personId}-${variables.taskId}`);
        return next;
      });
    },
  });

  const undoMutation = trpc.task.undoCompletion.useMutation({
    onMutate: async ({ completionId }) => {
      // Cancel any outgoing refetches
      await utils.person.getBatch.cancel();

      // Find the task and student for this completion
      let targetStudentId: string | null = null;
      let targetTaskId: string | null = null;

      for (const student of studentTasks) {
        for (const task of student.tasks) {
          if (task.completionId === completionId) {
            targetStudentId = student.studentId;
            targetTaskId = task.id;
            break;
          }
        }
        if (targetStudentId) break;
      }

      if (!targetStudentId || !targetTaskId) {
        throw new Error('Task not found');
      }

      // Snapshot the previous state
      const previousTasks = studentTasks;

      // Optimistically update the UI
      setStudentTasks(current =>
        current.map(student =>
          student.studentId === targetStudentId
            ? {
                ...student,
                tasks: student.tasks.map(task =>
                  task.id === targetTaskId
                    ? { ...task, isComplete: false, completionId: undefined }
                    : task
                ),
              }
            : student
        )
      );

      // Add to pending operations
      setPendingOperations(prev => new Set(prev).add(`${targetStudentId}-${targetTaskId}`));

      // Return context for rollback
      return { previousTasks, studentId: targetStudentId, taskId: targetTaskId };
    },
    onSuccess: async () => {
      // Refetch to sync with server state
      await refetchStudentTasks();

      // Invalidate goal queries for real-time progress updates
      utils.goal.list.invalidate();
      utils.goal.getGoalsForTask.invalidate();
      utils.goal.getGoalsForRoutine.invalidate();

      toast({
        title: 'Success',
        description: 'Task undone',
        variant: 'success',
      });
    },
    onError: (error, variables, context) => {
      // Rollback to previous state
      if (context?.previousTasks) {
        setStudentTasks(context.previousTasks);
      }

      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: (data, error, variables, context) => {
      // Remove from pending operations
      if (context?.studentId && context?.taskId) {
        setPendingOperations(prev => {
          const next = new Set(prev);
          next.delete(`${context.studentId}-${context.taskId}`);
          return next;
        });
      }
    },
  });

  const handleTaskToggle = (studentId: string, taskId: string, isComplete: boolean, completionId?: string) => {
    if (isComplete && completionId && !completionId.startsWith('optimistic-')) {
      // Undo completion (ignore optimistic IDs)
      undoMutation.mutate({ completionId });
    } else if (!isComplete) {
      // Complete task
      completeMutation.mutate({
        taskId,
        personId: studentId,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between bg-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-purple-900">
              📋 Classroom Bulk Check-in
            </h2>
            <p className="text-sm text-purple-700 mt-1">
              {classroomName} • Complete teacher-only tasks for all students
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading || tasksLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
            </div>
          ) : studentTasks.length === 0 || uniqueTasks.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Teacher Tasks Yet</h2>
                <p className="text-gray-600">
                  Create teacher-only routines to track attendance, grades, and notes for your students.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-purple-100 sticky top-0 z-10">
                    <th className="border border-purple-300 px-4 py-3 text-left font-semibold text-purple-900 min-w-[200px]">
                      Student
                    </th>
                    {uniqueTasks.map(task => (
                      <th
                        key={task.id}
                        className="border border-purple-300 px-4 py-3 text-center font-semibold text-purple-900 min-w-[150px]"
                      >
                        <div className="text-sm">{task.name}</div>
                        <div className="text-xs font-normal text-purple-700 mt-1">
                          {task.routineName}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentTasks.map(student => (
                    <tr key={student.studentId} className="hover:bg-purple-50">
                      <td className="border border-gray-300 px-4 py-3">
                        <div className="flex items-center gap-3">
                          {student.studentAvatar && (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                              style={{
                                backgroundColor: JSON.parse(student.studentAvatar).color || GRAY_SCALE[200],
                              }}
                            >
                              {JSON.parse(student.studentAvatar).emoji || '👤'}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{student.studentName}</span>
                        </div>
                      </td>
                      {uniqueTasks.map(uniqueTask => {
                        const studentTask = student.tasks.find(t => t.id === uniqueTask.id);
                        const isComplete = studentTask?.isComplete || false;
                        const completionId = studentTask?.completionId;
                        const isPending = pendingOperations.has(`${student.studentId}-${uniqueTask.id}`);

                        return (
                          <td key={uniqueTask.id} className="border border-gray-300 px-4 py-3 text-center">
                            {studentTask ? (
                              <Button
                                variant={isComplete ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleTaskToggle(
                                  student.studentId,
                                  uniqueTask.id,
                                  isComplete,
                                  completionId
                                )}
                                disabled={isPending}
                                className={`
                                  ${isComplete
                                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                                    : "border-purple-300 text-purple-700 hover:bg-purple-100"
                                  }
                                  ${isPending ? "opacity-70" : ""}
                                  transition-all duration-150
                                `}
                              >
                                {isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isComplete ? (
                                  <>
                                    <Check className="h-4 w-4 mr-1" />
                                    Done
                                  </>
                                ) : (
                                  "Mark"
                                )}
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
