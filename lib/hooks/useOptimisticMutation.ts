/**
 * useOptimisticMutation Hook
 *
 * Core wrapper for optimistic mutations with React Query.
 * Provides immediate UI updates with automatic rollback on errors.
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import type { UseTRPCMutationResult } from '@trpc/react-query/shared';
import { getQueryKey } from '@trpc/react-query';
import type { AnyRouter } from '@trpc/server';

export interface OptimisticMutationOptions<TData = unknown, TError = unknown, TVariables = unknown, TContext = unknown> {
  // Toast messages
  messages?: {
    loading?: string;
    success?: string;
    error?: string | ((error: TError) => string);
  };

  // Query keys to invalidate on success
  invalidateKeys?: unknown[][];

  // Manual cache update functions
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void | Promise<void>;
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void | Promise<void>;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => void | Promise<void>;

  // Disable optimistic behavior (fallback to regular mutation)
  disableOptimistic?: boolean;

  // Retry configuration
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
  retryDelay?: number | ((attemptIndex: number) => number);
}

/**
 * Enhanced mutation hook with optimistic updates
 *
 * @param mutation - The tRPC mutation result
 * @param options - Optimistic update configuration
 * @returns Enhanced mutation with optimistic behavior
 */
export function useOptimisticMutation<
  TData = unknown,
  TError extends Error = Error,
  TVariables = unknown,
  TContext = unknown
>(
  mutation: UseTRPCMutationResult<TData, TError, TVariables, any>,
  options: OptimisticMutationOptions<TData, TError, TVariables, TContext> = {}
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    messages = {},
    invalidateKeys = [],
    onMutate,
    onError,
    onSuccess,
    onSettled,
    disableOptimistic = false,
    retry = false,
  } = options;

  // Create the enhanced mutate function
  const mutate = async (variables: TVariables) => {
    let context: TContext | undefined;

    try {
      // Show loading toast if provided
      const loadingToastId = messages.loading
        ? toast({
            title: 'Loading',
            description: messages.loading,
          })
        : undefined;

      // If optimistic is disabled, just run the mutation normally
      if (disableOptimistic) {
        const result = await mutation.mutateAsync(variables);

        // Dismiss loading toast
        if (loadingToastId) {
          toast.dismiss(loadingToastId);
        }

        // Show success toast
        if (messages.success) {
          toast({
            title: 'Success',
            description: messages.success,
            variant: 'success',
          });
        }

        // Invalidate queries
        await Promise.all(
          invalidateKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
        );

        // Call success callback
        if (onSuccess) {
          await onSuccess(result, variables, undefined);
        }

        return result;
      }

      // Optimistic flow
      // 1. Cancel any outgoing refetches to prevent race conditions
      await Promise.all(
        invalidateKeys.map(key => queryClient.cancelQueries({ queryKey: key }))
      );

      // 2. Execute onMutate to update cache optimistically
      if (onMutate) {
        context = await onMutate(variables);
      }

      // 3. Execute the actual mutation
      const result = await mutation.mutateAsync(variables);

      // 4. Dismiss loading toast
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }

      // 5. Show success toast
      if (messages.success) {
        toast({
          title: 'Success',
          description: messages.success,
          variant: 'success',
        });
      }

      // 6. Call success callback
      if (onSuccess) {
        await onSuccess(result, variables, context);
      }

      // 7. Invalidate and refetch queries to ensure consistency
      await Promise.all(
        invalidateKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
      );

      // 8. Call settled callback
      if (onSettled) {
        await onSettled(result, null, variables, context);
      }

      return result;

    } catch (error) {
      const typedError = error as TError;

      // Show error toast
      const errorMessage =
        typeof messages.error === 'function'
          ? messages.error(typedError)
          : messages.error || typedError.message || 'An error occurred';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      // Call error callback for rollback
      if (onError) {
        await onError(typedError, variables, context);
      }

      // Call settled callback
      if (onSettled) {
        await onSettled(undefined, typedError, variables, context);
      }

      // Invalidate queries to refetch correct data
      await Promise.all(
        invalidateKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
      );

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
    reset: mutation.reset,
    status: mutation.status,
    // Expose original mutation for advanced use cases
    originalMutation: mutation,
  };
}

/**
 * Helper to generate a temporary ID for optimistic creates
 */
export function generateTempId(prefix = 'temp'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper to check if an ID is temporary
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp_');
}