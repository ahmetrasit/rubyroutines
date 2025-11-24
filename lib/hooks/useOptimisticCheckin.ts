/**
 * useOptimisticCheckin Hook
 *
 * Specialized hook for optimistic task check-in operations.
 * Immediately updates task completion status with undo support.
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useOptimisticMutation, generateTempId } from './useOptimisticMutation';
import type { UseTRPCMutationResult } from '@trpc/react-query/shared';
import { TaskType } from '@/lib/types/prisma-enums';

interface TaskCompletion {
  id: string;
  taskId: string;
  personId: string;
  completedAt: Date;
  value?: number | null;
  summedValue?: number | null;
  entryNumber?: number | null;
}

interface Task {
  id: string;
  name: string;
  type: TaskType;
  targetValue?: number | null;
  unit?: string | null;
  isComplete?: boolean;
  completionCount?: number;
  progress?: number;
  totalValue?: number;
  entryNumber?: number;
  summedValue?: number;
  completions?: TaskCompletion[];
}

interface CheckinInput {
  taskId: string;
  personId: string;
  value?: string;
}

interface OptimisticCheckinOptions {
  // Person ID for cache updates
  personId: string;

  // Query keys
  personKey?: unknown[];

  // Toast messages
  messages?: {
    loading?: string;
    success?: string;
    error?: string;
  };

  // Callbacks
  onSuccess?: (data: TaskCompletion, variables: CheckinInput) => void | Promise<void>;
  onError?: (error: Error, variables: CheckinInput) => void | Promise<void>;

  // Celebration callback for completed tasks
  onCelebration?: () => void;
}

/**
 * Optimistic check-in hook with immediate UI feedback
 */
export function useOptimisticCheckin(
  mutation: UseTRPCMutationResult<TaskCompletion, Error, CheckinInput, any>,
  options: OptimisticCheckinOptions
) {
  const queryClient = useQueryClient();

  const {
    personId,
    personKey = [['person', 'getById'], { input: { id: personId }, type: 'query' }],
    messages = {},
    onSuccess,
    onError,
    onCelebration,
  } = options;

  return useOptimisticMutation(mutation, {
    messages: {
      loading: messages.loading,
      success: messages.success || 'Task completed!',
      error: messages.error || 'Failed to complete task',
    },

    invalidateKeys: [personKey],

    onMutate: async (variables: CheckinInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: personKey });

      // Debug logging
      console.log('🔍 [useOptimisticCheckin] Cache key being used:', personKey);

      // Get current person data
      const previousData = queryClient.getQueryData<any>(personKey);
      console.log('🔍 [useOptimisticCheckin] Current cache data exists:', !!previousData);

      if (previousData) {
        console.log('🎯 [useOptimisticCheckin] Applying optimistic update for task:', variables.taskId);
        // Create optimistic completion
        const tempCompletion: TaskCompletion = {
          id: generateTempId('completion'),
          taskId: variables.taskId,
          personId: variables.personId,
          completedAt: new Date(),
          value: variables.value ? parseInt(variables.value, 10) : null,
          summedValue: null,
          entryNumber: null,
        };

        // Update person data optimistically
        queryClient.setQueryData(personKey, (old: any) => {
          if (!old) return old;

          const updatedAssignments = old.assignments?.map((assignment: any) => {
            const updatedTasks = assignment.routine.tasks.map((task: Task) => {
              if (task.id === variables.taskId) {
                // Update task based on type
                const updatedTask = { ...task };

                if (task.type === TaskType.SIMPLE) {
                  updatedTask.isComplete = true;
                  updatedTask.completionCount = 1;
                  updatedTask.completions = [tempCompletion];
                } else if (task.type === TaskType.MULTIPLE_CHECKIN) {
                  const currentCount = task.completionCount || 0;
                  updatedTask.completionCount = currentCount + 1;
                  updatedTask.isComplete = task.targetValue
                    ? currentCount + 1 >= task.targetValue
                    : false;
                  updatedTask.completions = [
                    tempCompletion,
                    ...(task.completions || []),
                  ];
                } else if (task.type === TaskType.PROGRESS) {
                  const currentTotal = task.totalValue || 0;
                  const newTotal = currentTotal + (variables.value ? parseInt(variables.value, 10) : 0);
                  updatedTask.totalValue = newTotal;
                  updatedTask.progress = task.targetValue
                    ? (newTotal / task.targetValue) * 100
                    : 0;
                  updatedTask.isComplete = task.targetValue
                    ? newTotal >= task.targetValue
                    : false;
                  updatedTask.summedValue = newTotal;
                  updatedTask.entryNumber = (task.entryNumber || 0) + 1;
                  updatedTask.completions = [
                    tempCompletion,
                    ...(task.completions || []),
                  ];
                }

                // Trigger celebration if task is now complete
                if (updatedTask.isComplete && !task.isComplete && onCelebration) {
                  setTimeout(onCelebration, 100);
                }

                return updatedTask;
              }
              return task;
            });

            return {
              ...assignment,
              routine: {
                ...assignment.routine,
                tasks: updatedTasks,
              },
            };
          });

          return {
            ...old,
            assignments: updatedAssignments,
          };
        });
      }

      return { previousData };
    },

    onSuccess: async (data: TaskCompletion, variables: CheckinInput) => {
      console.log('✅ [useOptimisticCheckin] Mutation successful, updating with real data:', data.id);
      // Replace temp completion with real one
      queryClient.setQueryData(personKey, (old: any) => {
        if (!old) return old;

        const updatedAssignments = old.assignments?.map((assignment: any) => {
          const updatedTasks = assignment.routine.tasks.map((task: Task) => {
            if (task.id === variables.taskId) {
              // Replace temp completion with real data
              const updatedCompletions = task.completions?.map((c: TaskCompletion) =>
                c.id.startsWith('temp_') ? data : c
              ) || [data];

              return {
                ...task,
                completions: updatedCompletions,
                entryNumber: data.entryNumber,
                summedValue: data.summedValue,
              };
            }
            return task;
          });

          return {
            ...assignment,
            routine: {
              ...assignment.routine,
              tasks: updatedTasks,
            },
          };
        });

        return {
          ...old,
          assignments: updatedAssignments,
        };
      });

      // Call user's onSuccess
      if (onSuccess) {
        await onSuccess(data, variables);
      }
    },

    onError: async (error: Error, variables: CheckinInput, context: any) => {
      // Rollback optimistic update
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(personKey, context.previousData);
      }

      // Call user's onError
      if (onError) {
        await onError(error, variables);
      }
    },
  });
}

/**
 * Optimistic undo hook for task completions
 */
export function useOptimisticUndo(
  mutation: UseTRPCMutationResult<any, Error, { completionId: string }, any>,
  options: {
    personId: string;
    messages?: {
      loading?: string;
      success?: string;
      error?: string;
    };
  }
) {
  const queryClient = useQueryClient();
  const { personId, messages = {} } = options;
  const personKey = [['person', 'getById'], { input: { id: personId }, type: 'query' }];

  return useOptimisticMutation(mutation, {
    messages: {
      loading: messages.loading,
      success: messages.success || 'Task completion undone',
      error: messages.error || 'Failed to undo completion',
    },

    invalidateKeys: [personKey],

    onMutate: async (variables: { completionId: string }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: personKey });

      // Get current person data
      const previousData = queryClient.getQueryData<any>(personKey);

      if (previousData) {
        // Remove completion optimistically
        queryClient.setQueryData(personKey, (old: any) => {
          if (!old) return old;

          const updatedAssignments = old.assignments?.map((assignment: any) => {
            const updatedTasks = assignment.routine.tasks.map((task: Task) => {
              const hasCompletion = task.completions?.some(
                (c) => c.id === variables.completionId
              );

              if (hasCompletion) {
                const completionToRemove = task.completions?.find(
                  (c) => c.id === variables.completionId
                );
                const filteredCompletions = task.completions?.filter(
                  (c) => c.id !== variables.completionId
                ) || [];

                const updatedTask = { ...task, completions: filteredCompletions };

                // Update task state based on type
                if (task.type === TaskType.SIMPLE) {
                  updatedTask.isComplete = false;
                  updatedTask.completionCount = 0;
                } else if (task.type === TaskType.MULTIPLE_CHECKIN) {
                  updatedTask.completionCount = Math.max(0, (task.completionCount || 1) - 1);
                  updatedTask.isComplete = false;
                } else if (task.type === TaskType.PROGRESS && completionToRemove?.value) {
                  const newTotal = Math.max(0, (task.totalValue || 0) - completionToRemove.value);
                  updatedTask.totalValue = newTotal;
                  updatedTask.summedValue = newTotal;
                  updatedTask.entryNumber = Math.max(0, (task.entryNumber || 1) - 1);
                  updatedTask.progress = task.targetValue
                    ? (newTotal / task.targetValue) * 100
                    : 0;
                  updatedTask.isComplete = false;
                }

                return updatedTask;
              }
              return task;
            });

            return {
              ...assignment,
              routine: {
                ...assignment.routine,
                tasks: updatedTasks,
              },
            };
          });

          return {
            ...old,
            assignments: updatedAssignments,
          };
        });
      }

      return { previousData };
    },

    onError: async (_error: Error, _variables: any, context: any) => {
      // Rollback optimistic update
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(personKey, context.previousData);
      }
    },
  });
}