/**
 * useOptimisticKioskCheckin Hook
 *
 * Specialized hook for optimistic task check-in operations in kiosk mode.
 * Handles the different data structure returned by kiosk.getPersonTasks.
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

interface KioskCheckinInput {
  kioskCodeId: string;
  taskId: string;
  personId: string;
  value?: string;
}

interface OptimisticKioskCheckinOptions {
  // Kiosk code ID
  kioskCodeId: string;

  // Person ID for cache updates
  personId: string;

  // Query keys
  kioskTasksKey?: unknown[];

  // Toast messages
  messages?: {
    loading?: string;
    success?: string;
    error?: string;
  };

  // Callbacks
  onSuccess?: (data: TaskCompletion, variables: KioskCheckinInput) => void | Promise<void>;
  onError?: (error: Error, variables: KioskCheckinInput) => void | Promise<void>;

  // Celebration callback for completed tasks
  onCelebration?: () => void;
}

/**
 * Optimistic check-in hook for kiosk mode with immediate UI feedback
 */
export function useOptimisticKioskCheckin(
  mutation: UseTRPCMutationResult<TaskCompletion, Error, KioskCheckinInput, any>,
  options: OptimisticKioskCheckinOptions
) {
  const queryClient = useQueryClient();

  const {
    kioskCodeId,
    personId,
    kioskTasksKey = ['kiosk', 'getPersonTasks', { kioskCodeId, personId }],
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

    invalidateKeys: [kioskTasksKey],

    onMutate: async (variables: KioskCheckinInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: kioskTasksKey });

      // Get current kiosk tasks data
      const previousData = queryClient.getQueryData<any>(kioskTasksKey);

      if (previousData) {
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

        // Update kiosk tasks data optimistically
        queryClient.setQueryData(kioskTasksKey, (old: any) => {
          if (!old) return old;

          // Kiosk returns { person, tasks } structure
          const updatedTasks = old.tasks?.map((task: Task) => {
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
            ...old,
            tasks: updatedTasks,
          };
        });
      }

      return { previousData };
    },

    onSuccess: async (data: TaskCompletion, variables: KioskCheckinInput) => {
      // Replace temp completion with real one
      queryClient.setQueryData(kioskTasksKey, (old: any) => {
        if (!old) return old;

        const updatedTasks = old.tasks?.map((task: Task) => {
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
          ...old,
          tasks: updatedTasks,
        };
      });

      // Call user's onSuccess
      if (onSuccess) {
        await onSuccess(data, variables);
      }
    },

    onError: async (error: Error, variables: KioskCheckinInput, context: any) => {
      // Rollback optimistic update
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(kioskTasksKey, context.previousData);
      }

      // Call user's onError
      if (onError) {
        await onError(error, variables);
      }
    },
  });
}

/**
 * Optimistic undo hook for kiosk task completions
 */
export function useOptimisticKioskUndo(
  mutation: UseTRPCMutationResult<any, Error, { kioskCodeId: string; completionId: string }, any>,
  options: {
    kioskCodeId: string;
    personId: string;
    messages?: {
      loading?: string;
      success?: string;
      error?: string;
    };
  }
) {
  const queryClient = useQueryClient();
  const { kioskCodeId, personId, messages = {} } = options;
  const kioskTasksKey = ['kiosk', 'getPersonTasks', { kioskCodeId, personId }];

  return useOptimisticMutation(mutation, {
    messages: {
      loading: messages.loading,
      success: messages.success || 'Task completion undone',
      error: messages.error || 'Failed to undo completion',
    },

    invalidateKeys: [kioskTasksKey],

    onMutate: async (variables: { kioskCodeId: string; completionId: string }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: kioskTasksKey });

      // Get current kiosk tasks data
      const previousData = queryClient.getQueryData<any>(kioskTasksKey);

      if (previousData) {
        // Remove completion optimistically
        queryClient.setQueryData(kioskTasksKey, (old: any) => {
          if (!old) return old;

          const updatedTasks = old.tasks?.map((task: Task) => {
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
            ...old,
            tasks: updatedTasks,
          };
        });
      }

      return { previousData };
    },

    onError: async (_error: Error, _variables: any, context: any) => {
      // Rollback optimistic update
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(kioskTasksKey, context.previousData);
      }
    },
  });
}