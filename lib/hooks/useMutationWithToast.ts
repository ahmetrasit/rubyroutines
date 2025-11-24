/**
 * useMutationWithToast Hook
 *
 * Wraps tRPC mutations with automatic toast notifications.
 * Now supports optimistic updates for instant UI feedback.
 * Reduces code duplication across the application.
 */

'use client';

import { useToast } from '@/components/ui/toast';
import { useQueryClient } from '@tanstack/react-query';
import type { UseTRPCMutationResult } from '@trpc/react-query/shared';
import { useOptimisticMutation } from './useOptimisticMutation';
import { useOptimisticCreate } from './useOptimisticCreate';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { useOptimisticDelete } from './useOptimisticDelete';

interface MutationCallbacks<TData = unknown, TError = unknown> {
  onSuccess?: (data: TData) => void | Promise<void>;
  onError?: (error: TError) => void | Promise<void>;
}

interface ToastMessages {
  loading?: string;
  success?: string;
  error?: string;
}

interface UseMutationWithToastOptions<TData = unknown, TError = unknown, TVariables = unknown> {
  messages?: ToastMessages;
  callbacks?: MutationCallbacks<TData, TError>;
  invalidateQueries?: (() => void | Promise<void>)[];
  closeDialog?: () => void;
  // New optimistic options
  optimistic?: boolean; // Enable optimistic updates
  optimisticConfig?: {
    // For list updates
    listKey?: unknown[];
    // For single item updates
    itemKey?: unknown[];
    // Create item from input
    createItem?: (input: TVariables, tempId: string) => TData;
    // Update item with input
    updateItem?: (item: TData, input: TVariables) => TData;
    // Get ID from input or item
    getId?: (input: TVariables | TData) => string;
  };
}

/**
 * Custom hook to add toast notifications to tRPC mutations
 * Now with optional optimistic update support
 *
 * @param mutation - The tRPC mutation result
 * @param options - Configuration options
 * @returns Mutation wrapper with toast handling
 *
 * @example
 * ```tsx
 * const createMutation = trpc.person.create.useMutation();
 * const { mutate, isLoading } = useMutationWithToast(createMutation, {
 *   messages: {
 *     loading: 'Creating person...',
 *     success: 'Person created successfully',
 *     error: 'Failed to create person',
 *   },
 *   optimistic: true, // Enable optimistic updates
 *   optimisticConfig: {
 *     listKey: ['person', 'list'],
 *     createItem: (input, tempId) => ({ ...input, id: tempId }),
 *   },
 *   invalidateQueries: [() => utils.person.list.invalidate()],
 *   closeDialog: () => setIsOpen(false),
 * });
 * ```
 */
export function useMutationWithToast<TData = unknown, TError extends Error = Error, TVariables = unknown>(
  mutation: UseTRPCMutationResult<TData, TError, TVariables, any>,
  options: UseMutationWithToastOptions<TData, TError, TVariables> = {}
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    messages = {},
    callbacks = {},
    invalidateQueries = [],
    closeDialog,
    optimistic = false,
    optimisticConfig = {},
  } = options;

  // If optimistic is enabled, use the optimistic mutation wrapper
  if (optimistic && optimisticConfig) {
    const invalidateKeys = invalidateQueries.map(() => optimisticConfig.listKey || []).filter(Boolean);

    return useOptimisticMutation(mutation, {
      messages,
      invalidateKeys,
      onMutate: optimisticConfig.createItem || optimisticConfig.updateItem
        ? async (variables: TVariables) => {
            if (optimisticConfig.listKey) {
              await queryClient.cancelQueries({ queryKey: optimisticConfig.listKey });
              const previousData = queryClient.getQueryData(optimisticConfig.listKey);

              if (optimisticConfig.createItem) {
                // Optimistic create
                const tempId = `temp_${Date.now()}`;
                const optimisticItem = optimisticConfig.createItem(variables, tempId);
                queryClient.setQueryData(optimisticConfig.listKey, (old: any) => {
                  if (!old) return [optimisticItem];
                  return Array.isArray(old) ? [...old, optimisticItem] : old;
                });
              } else if (optimisticConfig.updateItem && optimisticConfig.getId) {
                // Optimistic update
                const id = optimisticConfig.getId(variables);
                queryClient.setQueryData(optimisticConfig.listKey, (old: any) => {
                  if (!old || !Array.isArray(old)) return old;
                  return old.map((item: any) =>
                    item.id === id ? optimisticConfig.updateItem!(item, variables) : item
                  );
                });
              }

              return { previousData };
            }
          }
        : undefined,
      onSuccess: async (data: TData, variables: TVariables) => {
        // Invalidate queries
        await Promise.all(invalidateQueries.map(fn => fn()));

        // Call success callback
        if (callbacks.onSuccess) {
          await callbacks.onSuccess(data);
        }

        // Close dialog if provided
        if (closeDialog) {
          closeDialog();
        }
      },
      onError: async (error: TError, variables: TVariables, context: any) => {
        // Rollback on error
        if (context?.previousData && optimisticConfig.listKey) {
          queryClient.setQueryData(optimisticConfig.listKey, context.previousData);
        }

        // Call error callback
        if (callbacks.onError) {
          await callbacks.onError(error);
        }
      },
    });
  }

  // Legacy non-optimistic behavior

  const mutate = async (input: any) => {
    try {
      // Show loading toast if message provided
      if (messages.loading) {
        toast({
          title: 'Loading',
          description: messages.loading,
        });
      }

      const result = await mutation.mutateAsync(input);

      // Show success toast
      toast({
        title: 'Success',
        description: messages.success || 'Operation completed successfully',
        variant: 'success',
      });

      // Invalidate queries
      await Promise.all(invalidateQueries.map(fn => fn()));

      // Call success callback
      if (callbacks.onSuccess) {
        await callbacks.onSuccess(result);
      }

      // Close dialog if provided
      if (closeDialog) {
        closeDialog();
      }

      return result;
    } catch (error) {
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: 'Error',
        description: messages.error || errorMessage,
        variant: 'destructive',
      });

      // Call error callback
      if (callbacks.onError) {
        await callbacks.onError(error as TError);
      }

      throw error;
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading: mutation.isPending,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
  };
}

/**
 * Simplified version for common CRUD operations with optimistic support
 */
export function useCreateMutation<TData = unknown, TError extends Error = Error, TVariables = unknown>(
  mutation: UseTRPCMutationResult<TData, TError, TVariables, any>,
  options: {
    entityName: string;
    invalidateQueries?: (() => void | Promise<void>)[];
    closeDialog?: () => void;
    onSuccess?: (data: TData) => void | Promise<void>;
    // New optimistic options
    optimistic?: boolean;
    listKey?: unknown[];
    createItem?: (input: TVariables, tempId: string) => TData;
  }
) {
  return useMutationWithToast(mutation, {
    messages: {
      success: `${options.entityName} created successfully`,
    },
    invalidateQueries: options.invalidateQueries,
    closeDialog: options.closeDialog,
    callbacks: {
      onSuccess: options.onSuccess,
    },
    optimistic: options.optimistic,
    optimisticConfig: options.listKey && options.createItem
      ? {
          listKey: options.listKey,
          createItem: options.createItem,
        }
      : undefined,
  });
}

export function useUpdateMutation<TData = unknown, TError extends Error = Error, TVariables = unknown>(
  mutation: UseTRPCMutationResult<TData, TError, TVariables, any>,
  options: {
    entityName: string;
    invalidateQueries?: (() => void | Promise<void>)[];
    closeDialog?: () => void;
    onSuccess?: (data: TData) => void | Promise<void>;
    // New optimistic options
    optimistic?: boolean;
    listKey?: unknown[];
    updateItem?: (item: TData, input: TVariables) => TData;
    getId?: (input: TVariables) => string;
  }
) {
  return useMutationWithToast(mutation, {
    messages: {
      success: `${options.entityName} updated successfully`,
    },
    invalidateQueries: options.invalidateQueries,
    closeDialog: options.closeDialog,
    callbacks: {
      onSuccess: options.onSuccess,
    },
    optimistic: options.optimistic,
    optimisticConfig: options.listKey && options.updateItem && options.getId
      ? {
          listKey: options.listKey,
          updateItem: options.updateItem,
          getId: options.getId,
        }
      : undefined,
  });
}

export function useDeleteMutation<TData = unknown, TError extends Error = Error, TVariables = unknown>(
  mutation: UseTRPCMutationResult<TData, TError, TVariables, any>,
  options: {
    entityName: string;
    invalidateQueries?: (() => void | Promise<void>)[];
    onSuccess?: (data: TData) => void | Promise<void>;
    // New optimistic options
    optimistic?: boolean;
    listKey?: unknown[];
    getId?: (input: TVariables) => string;
  }
) {
  return useMutationWithToast(mutation, {
    messages: {
      success: `${options.entityName} deleted successfully`,
    },
    invalidateQueries: options.invalidateQueries,
    callbacks: {
      onSuccess: options.onSuccess,
    },
    optimistic: options.optimistic,
    optimisticConfig: options.listKey && options.getId
      ? {
          listKey: options.listKey,
          getId: options.getId,
        }
      : undefined,
  });
}
