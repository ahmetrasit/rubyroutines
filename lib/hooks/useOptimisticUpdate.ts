/**
 * useOptimisticUpdate Hook
 *
 * Specialized hook for optimistic update operations.
 * Immediately updates items in cache with rollback on error.
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useOptimisticMutation } from './useOptimisticMutation';
import type { UseTRPCMutationResult } from '@trpc/react-query/shared';

interface OptimisticUpdateOptions<TItem, TUpdateInput> {
  // Query keys to update
  listKey?: unknown[];
  itemKey?: unknown[];

  // Get item ID from update input
  getId: (input: TUpdateInput) => string;

  // Update item with new data
  updateItem: (item: TItem, input: TUpdateInput) => TItem;

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
  onSuccess?: (data: TItem, variables: TUpdateInput) => void | Promise<void>;
  onError?: (error: Error, variables: TUpdateInput) => void | Promise<void>;

  // Close dialog after success
  closeDialog?: () => void;
}

/**
 * Optimistic update hook with automatic cache management
 */
export function useOptimisticUpdate<TItem = any, TUpdateInput = any>(
  mutation: UseTRPCMutationResult<TItem, Error, TUpdateInput, any>,
  options: OptimisticUpdateOptions<TItem, TUpdateInput>
) {
  const queryClient = useQueryClient();

  const {
    listKey,
    itemKey,
    getId,
    updateItem,
    messages = {},
    entityName = 'Item',
    invalidateKeys = [],
    onSuccess,
    onError,
    closeDialog,
  } = options;

  const allInvalidateKeys = [
    ...(listKey ? [listKey] : []),
    ...(itemKey ? [itemKey] : []),
    ...invalidateKeys,
  ];

  return useOptimisticMutation(mutation, {
    messages: {
      loading: messages.loading,
      success: messages.success || `${entityName} updated successfully`,
      error: messages.error || `Failed to update ${entityName.toLowerCase()}`,
    },

    invalidateKeys: allInvalidateKeys,

    onMutate: async (variables: TUpdateInput) => {
      // Cancel any outgoing refetches
      if (listKey) await queryClient.cancelQueries({ queryKey: listKey });
      if (itemKey) await queryClient.cancelQueries({ queryKey: itemKey });

      const itemId = getId(variables);
      const previousData: any = {};

      // Update in list
      if (listKey) {
        previousData.list = queryClient.getQueryData<TItem[]>(listKey);

        queryClient.setQueryData<TItem[]>(listKey, (old) => {
          if (!old) return old;

          return old.map((item: any) => {
            if (item.id === itemId) {
              return updateItem(item, variables);
            }
            return item;
          });
        });
      }

      // Update single item query
      if (itemKey) {
        previousData.item = queryClient.getQueryData<TItem>(itemKey);

        queryClient.setQueryData<TItem>(itemKey, (old) => {
          if (!old) return old;
          return updateItem(old, variables);
        });
      }

      return previousData;
    },

    onSuccess: async (data: TItem, variables: TUpdateInput) => {
      // Update cache with server response
      const itemId = getId(variables);

      if (listKey) {
        queryClient.setQueryData<TItem[]>(listKey, (old) => {
          if (!old) return old;

          return old.map((item: any) => {
            if (item.id === itemId) {
              return data;
            }
            return item;
          });
        });
      }

      if (itemKey) {
        queryClient.setQueryData<TItem>(itemKey, data);
      }

      // Call user's onSuccess
      if (onSuccess) {
        await onSuccess(data, variables);
      }

      // Close dialog if provided
      if (closeDialog) {
        closeDialog();
      }
    },

    onError: async (error: Error, variables: TUpdateInput, context: any) => {
      // Rollback optimistic updates
      if (context?.list !== undefined && listKey) {
        queryClient.setQueryData(listKey, context.list);
      }

      if (context?.item !== undefined && itemKey) {
        queryClient.setQueryData(itemKey, context.item);
      }

      // Call user's onError
      if (onError) {
        await onError(error, variables);
      }
    },
  });
}

/**
 * Helper hook for batch updates
 */
export function useOptimisticBatchUpdate<TItem = any, TUpdateInput = any>(
  mutation: UseTRPCMutationResult<TItem[], Error, TUpdateInput[], any>,
  options: Omit<OptimisticUpdateOptions<TItem, TUpdateInput>, 'getId'> & {
    // Get IDs from batch input
    getIds: (inputs: TUpdateInput[]) => string[];
  }
) {
  const queryClient = useQueryClient();

  const {
    listKey,
    getIds,
    updateItem,
    ...restOptions
  } = options;

  return useOptimisticMutation(mutation, {
    messages: restOptions.messages,
    invalidateKeys: restOptions.invalidateKeys || [],

    onMutate: async (variables: TUpdateInput[]) => {
      if (!listKey) return;

      // Cancel queries
      await queryClient.cancelQueries({ queryKey: listKey });

      const ids = getIds(variables);
      const previousData = queryClient.getQueryData<TItem[]>(listKey);

      // Update all items optimistically
      queryClient.setQueryData<TItem[]>(listKey, (old) => {
        if (!old) return old;

        return old.map((item: any) => {
          const index = ids.indexOf(item.id);
          if (index >= 0) {
            return updateItem(item, variables[index]);
          }
          return item;
        });
      });

      return { previousData };
    },

    onError: async (_error: Error, _variables: TUpdateInput[], context: any) => {
      // Rollback
      if (context?.previousData !== undefined && listKey) {
        queryClient.setQueryData(listKey, context.previousData);
      }
    },
  });
}

/**
 * Helper for partial updates (patches)
 */
export function useOptimisticPatch<TItem = any, TPatchInput = any>(
  mutation: UseTRPCMutationResult<TItem, Error, TPatchInput, any>,
  options: Omit<OptimisticUpdateOptions<TItem, TPatchInput>, 'updateItem'> & {
    // Apply patch to item
    applyPatch?: (item: TItem, patch: TPatchInput) => TItem;
  }
) {
  const applyPatch = options.applyPatch || ((item: any, patch: any) => ({
    ...item,
    ...patch,
    id: item.id, // Preserve ID
  }));

  return useOptimisticUpdate(mutation, {
    ...options,
    updateItem: applyPatch,
  });
}