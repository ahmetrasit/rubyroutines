/**
 * useMutationWithToast Hook
 *
 * Wraps tRPC mutations with automatic toast notifications.
 * Reduces code duplication across the application.
 */

'use client';

import { useToast } from '@/components/ui/toast';
import type { UseTRPCMutationResult } from '@trpc/react-query/shared';

interface MutationCallbacks<TData = unknown, TError = unknown> {
  onSuccess?: (data: TData) => void | Promise<void>;
  onError?: (error: TError) => void | Promise<void>;
}

interface ToastMessages {
  loading?: string;
  success?: string;
  error?: string;
}

interface UseMutationWithToastOptions<TData = unknown, TError = unknown> {
  messages?: ToastMessages;
  callbacks?: MutationCallbacks<TData, TError>;
  invalidateQueries?: (() => void | Promise<void>)[];
  closeDialog?: () => void;
}

/**
 * Custom hook to add toast notifications to tRPC mutations
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
 *   invalidateQueries: [() => utils.person.list.invalidate()],
 *   closeDialog: () => setIsOpen(false),
 * });
 * ```
 */
export function useMutationWithToast<TData = unknown, TError extends Error = Error>(
  mutation: UseTRPCMutationResult<TData, TError, any, any>,
  options: UseMutationWithToastOptions<TData, TError> = {}
) {
  const { toast } = useToast();

  const {
    messages = {},
    callbacks = {},
    invalidateQueries = [],
    closeDialog,
  } = options;

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
 * Simplified version for common CRUD operations
 */
export function useCreateMutation<TData = unknown, TError extends Error = Error>(
  mutation: UseTRPCMutationResult<TData, TError, any, any>,
  options: {
    entityName: string;
    invalidateQueries?: (() => void | Promise<void>)[];
    closeDialog?: () => void;
    onSuccess?: (data: TData) => void | Promise<void>;
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
  });
}

export function useUpdateMutation<TData = unknown, TError extends Error = Error>(
  mutation: UseTRPCMutationResult<TData, TError, any, any>,
  options: {
    entityName: string;
    invalidateQueries?: (() => void | Promise<void>)[];
    closeDialog?: () => void;
    onSuccess?: (data: TData) => void | Promise<void>;
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
  });
}

export function useDeleteMutation<TData = unknown, TError extends Error = Error>(
  mutation: UseTRPCMutationResult<TData, TError, any, any>,
  options: {
    entityName: string;
    invalidateQueries?: (() => void | Promise<void>)[];
    onSuccess?: (data: TData) => void | Promise<void>;
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
  });
}
