/**
 * useOptimisticDelete Hook
 *
 * Specialized hook for optimistic delete operations.
 * Immediately removes items from cache with rollback on error.
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useOptimisticMutation } from './useOptimisticMutation';
import type { UseTRPCMutationResult } from '@trpc/react-query/shared';

interface OptimisticDeleteOptions<TItem, TDeleteInput> {
  // Query keys to update
  listKey?: unknown[];

  // Get item ID from delete input
  getId: (input: TDeleteInput) => string;

  // Optional: Custom filter for complex delete scenarios
  filterItem?: (item: TItem, input: TDeleteInput) => boolean;

  // Toast messages
  messages?: {
    loading?: string;
    success?: string;
    error?: string;
  };

  // Entity name for default messages
  entityName?: string;

  // Additional keys to invalidate
  invalidateKeys?: unknown[][];

  // Callbacks
  onSuccess?: (data: any, variables: TDeleteInput) => void | Promise<void>;
  onError?: (error: Error, variables: TDeleteInput) => void | Promise<void>;

  // Close dialog after success
  closeDialog?: () => void;
}

/**
 * Optimistic delete hook with automatic cache management
 */
export function useOptimisticDelete<TItem = any, TDeleteInput = any>(
  mutation: UseTRPCMutationResult<any, Error, TDeleteInput, any>,
  options: OptimisticDeleteOptions<TItem, TDeleteInput>
) {
  const queryClient = useQueryClient();

  const {
    listKey,
    getId,
    filterItem,
    messages = {},
    entityName = 'Item',
    invalidateKeys = [],
    onSuccess,
    onError,
    closeDialog,
  } = options;

  const allInvalidateKeys = [
    ...(listKey ? [listKey] : []),
    ...invalidateKeys,
  ];

  return useOptimisticMutation(mutation, {
    messages: {
      loading: messages.loading,
      success: messages.success || `${entityName} deleted successfully`,
      error: messages.error || `Failed to delete ${entityName.toLowerCase()}`,
    },

    invalidateKeys: allInvalidateKeys,

    onMutate: async (variables: TDeleteInput) => {
      // Cancel any outgoing refetches
      if (listKey) {
        await queryClient.cancelQueries({ queryKey: listKey });
      }

      const itemId = getId(variables);

      // Snapshot previous data for rollback
      const previousData = listKey
        ? queryClient.getQueryData<TItem[]>(listKey)
        : undefined;

      // Find the item to be deleted for potential restoration
      let deletedItem: TItem | undefined;

      // Remove from list
      if (listKey) {
        queryClient.setQueryData<TItem[]>(listKey, (old) => {
          if (!old) return old;

          if (filterItem) {
            // Use custom filter
            const filtered = old.filter((item) => !filterItem(item, variables));
            deletedItem = old.find((item) => filterItem(item, variables));
            return filtered;
          } else {
            // Default: filter by ID
            deletedItem = old.find((item: any) => item.id === itemId);
            return old.filter((item: any) => item.id !== itemId);
          }
        });
      }

      return { previousData, deletedItem };
    },

    onSuccess: async (data: any, variables: TDeleteInput) => {
      // Call user's onSuccess
      if (onSuccess) {
        await onSuccess(data, variables);
      }

      // Close dialog if provided
      if (closeDialog) {
        closeDialog();
      }
    },

    onError: async (error: Error, variables: TDeleteInput, context: any) => {
      // Rollback optimistic delete
      if (context?.previousData !== undefined && listKey) {
        queryClient.setQueryData(listKey, context.previousData);
      }

      // Call user's onError
      if (onError) {
        await onError(error, variables);
      }
    },
  });
}

/**
 * Soft delete hook (marks as inactive instead of removing)
 */
export function useOptimisticSoftDelete<TItem = any, TDeleteInput = any>(
  mutation: UseTRPCMutationResult<TItem, Error, TDeleteInput, any>,
  options: OptimisticDeleteOptions<TItem, TDeleteInput> & {
    // Update item to mark as deleted/inactive
    markAsDeleted: (item: TItem) => TItem;
  }
) {
  const queryClient = useQueryClient();

  const {
    listKey,
    getId,
    markAsDeleted,
    ...restOptions
  } = options;

  return useOptimisticMutation(mutation, {
    messages: restOptions.messages,
    invalidateKeys: restOptions.invalidateKeys || [],

    onMutate: async (variables: TDeleteInput) => {
      if (!listKey) return;

      // Cancel queries
      await queryClient.cancelQueries({ queryKey: listKey });

      const itemId = getId(variables);
      const previousData = queryClient.getQueryData<TItem[]>(listKey);

      // Mark item as deleted instead of removing
      queryClient.setQueryData<TItem[]>(listKey, (old) => {
        if (!old) return old;

        return old.map((item: any) => {
          if (item.id === itemId) {
            return markAsDeleted(item);
          }
          return item;
        });
      });

      return { previousData };
    },

    onError: async (_error: Error, _variables: TDeleteInput, context: any) => {
      // Rollback
      if (context?.previousData !== undefined && listKey) {
        queryClient.setQueryData(listKey, context.previousData);
      }
    },
  });
}

/**
 * Batch delete hook
 */
export function useOptimisticBatchDelete<TItem = any, TDeleteInput = any>(
  mutation: UseTRPCMutationResult<any, Error, TDeleteInput[], any>,
  options: Omit<OptimisticDeleteOptions<TItem, TDeleteInput>, 'getId'> & {
    // Get IDs from batch input
    getIds: (inputs: TDeleteInput[]) => string[];
  }
) {
  const queryClient = useQueryClient();

  const {
    listKey,
    getIds,
    ...restOptions
  } = options;

  return useOptimisticMutation(mutation, {
    messages: restOptions.messages,
    invalidateKeys: restOptions.invalidateKeys || [],

    onMutate: async (variables: TDeleteInput[]) => {
      if (!listKey) return;

      // Cancel queries
      await queryClient.cancelQueries({ queryKey: listKey });

      const ids = getIds(variables);
      const previousData = queryClient.getQueryData<TItem[]>(listKey);

      // Remove all items optimistically
      queryClient.setQueryData<TItem[]>(listKey, (old) => {
        if (!old) return old;
        return old.filter((item: any) => !ids.includes(item.id));
      });

      return { previousData };
    },

    onError: async (_error: Error, _variables: TDeleteInput[], context: any) => {
      // Rollback
      if (context?.previousData !== undefined && listKey) {
        queryClient.setQueryData(listKey, context.previousData);
      }
    },
  });
}