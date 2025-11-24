/**
 * useOptimisticCreate Hook
 *
 * Specialized hook for optimistic create operations.
 * Immediately adds items to cache with temporary IDs.
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useOptimisticMutation, generateTempId, isTempId } from './useOptimisticMutation';
import type { UseTRPCMutationResult } from '@trpc/react-query/shared';

interface OptimisticCreateOptions<TItem, TCreateInput> {
  // Query key(s) for the list(s) to update - can be a single key or array of keys
  listKey: unknown[] | unknown[][];

  // Transform create input to item shape for cache
  createItem: (input: TCreateInput, tempId: string) => TItem;

  // Extract ID from the created item
  getId?: (item: TItem) => string;

  // Replace temporary item with server response
  replaceItem?: (tempItem: TItem, serverItem: TItem) => TItem;

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
  onSuccess?: (data: TItem, variables: TCreateInput) => void | Promise<void>;
  onError?: (error: Error, variables: TCreateInput) => void | Promise<void>;

  // Close dialog after success
  closeDialog?: () => void;
}

/**
 * Optimistic create hook with temporary ID management
 */
export function useOptimisticCreate<TItem = any, TCreateInput = any>(
  mutation: UseTRPCMutationResult<TItem, Error, TCreateInput, any>,
  options: OptimisticCreateOptions<TItem, TCreateInput>
) {
  const queryClient = useQueryClient();

  const {
    listKey,
    createItem,
    getId = (item: any) => item.id,
    replaceItem = (_, serverItem) => serverItem,
    messages = {},
    entityName = 'Item',
    invalidateKeys = [],
    onSuccess,
    onError,
    closeDialog,
  } = options;

  // Normalize listKey to always be an array of keys
  const listKeys = Array.isArray(listKey[0]) ? listKey as unknown[][] : [listKey as unknown[]];

  return useOptimisticMutation(mutation, {
    messages: {
      loading: messages.loading,
      success: messages.success || `${entityName} created successfully`,
      error: messages.error || `Failed to create ${entityName.toLowerCase()}`,
    },

    invalidateKeys: [...listKeys, ...invalidateKeys],

    onMutate: async (variables: TCreateInput) => {
      console.log('🔍 useOptimisticCreate.onMutate called');
      console.log('  listKeys:', JSON.stringify(listKeys, null, 2));
      console.log('  variables:', variables);

      // Cancel any outgoing refetches for all list keys
      for (const key of listKeys) {
        await queryClient.cancelQueries({ queryKey: key });
      }

      // Generate temporary ID
      const tempId = generateTempId(entityName.toLowerCase());
      console.log('  tempId:', tempId);

      // Create optimistic item
      const optimisticItem = createItem(variables, tempId);
      console.log('  optimisticItem:', optimisticItem);

      // Snapshot previous values for all keys
      const previousDataMap = new Map<unknown[], TItem[]>();
      for (const key of listKeys) {
        const data = queryClient.getQueryData<TItem[]>(key);
        if (data) {
          previousDataMap.set(key, data);
        }
      }

      // Optimistically update all lists
      for (const key of listKeys) {
        // Check if this is the personSharing.getAccessiblePersons query
        // Handle both old format and tRPC v11 format
        const isPersonSharingQuery =
          // Old format: ['personSharing', 'getAccessiblePersons', ...]
          (key[0] === 'personSharing' && key[1] === 'getAccessiblePersons') ||
          // tRPC v11 format: [['personSharing', 'getAccessiblePersons'], ...]
          (Array.isArray(key[0]) && key[0][0] === 'personSharing' && key[0][1] === 'getAccessiblePersons');

        console.log('  Processing key:', JSON.stringify(key));
        console.log('  Is personSharing query:', isPersonSharingQuery);

        const currentData = queryClient.getQueryData(key);
        console.log('  Current data for key:', currentData);

        if (isPersonSharingQuery) {
          // Handle the special structure of getAccessiblePersons
          queryClient.setQueryData(key, (old: any) => {
            console.log('    Old personSharing data:', old);
            if (!old) return {
              ownedPersons: [optimisticItem],
              sharedPersons: [],
              allPersons: [optimisticItem]
            };

            const newData = {
              ...old,
              ownedPersons: [...(old.ownedPersons || []), optimisticItem],
              allPersons: [...(old.allPersons || []), optimisticItem]
            };
            console.log('    New personSharing data:', newData);
            return newData;
          });
        } else {
          // Handle regular array queries
          queryClient.setQueryData<TItem[]>(key, (old) => {
            console.log('    Old array data:', old);
            if (!old) return [optimisticItem];
            const newData = [...old, optimisticItem];
            console.log('    New array data:', newData);
            return newData;
          });
        }
      }

      // Return context for rollback
      return { previousDataMap, tempId, optimisticItem };
    },

    onSuccess: async (data: TItem, variables: TCreateInput, context: any) => {
      if (context?.tempId) {
        // Replace temporary item with server response in all lists
        for (const key of listKeys) {
          // Check if this is the personSharing.getAccessiblePersons query
          // Handle both old format and tRPC v11 format
          const isPersonSharingQuery =
            // Old format: ['personSharing', 'getAccessiblePersons', ...]
            (key[0] === 'personSharing' && key[1] === 'getAccessiblePersons') ||
            // tRPC v11 format: [['personSharing', 'getAccessiblePersons'], ...]
            (Array.isArray(key[0]) && key[0][0] === 'personSharing' && key[0][1] === 'getAccessiblePersons');

          if (isPersonSharingQuery) {
            // Handle the special structure of getAccessiblePersons
            queryClient.setQueryData(key, (old: any) => {
              if (!old) return {
                ownedPersons: [data],
                sharedPersons: [],
                allPersons: [data]
              };

              const updateList = (list: TItem[]) => {
                return list.map((item) => {
                  const itemId = getId(item);
                  if (itemId === context.tempId) {
                    return replaceItem(item, data);
                  }
                  return item;
                });
              };

              return {
                ...old,
                ownedPersons: updateList(old.ownedPersons || []),
                allPersons: updateList(old.allPersons || [])
              };
            });
          } else {
            // Handle regular array queries
            queryClient.setQueryData<TItem[]>(key, (old) => {
              if (!old) return [data];

              return old.map((item) => {
                const itemId = getId(item);
                if (itemId === context.tempId) {
                  return replaceItem(item, data);
                }
                return item;
              });
            });
          }
        }
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

    onError: async (error: Error, variables: TCreateInput, context: any) => {
      // Rollback optimistic updates for all keys
      if (context?.previousDataMap) {
        for (const [key, data] of context.previousDataMap.entries()) {
          queryClient.setQueryData(key, data);
        }
      }

      // Call user's onError
      if (onError) {
        await onError(error, variables);
      }
    },
  });
}

/**
 * Helper hook for creating items in nested structures
 */
export function useOptimisticCreateNested<TParent = any, TItem = any, TCreateInput = any>(
  mutation: UseTRPCMutationResult<TItem, Error, TCreateInput, any>,
  options: OptimisticCreateOptions<TItem, TCreateInput> & {
    // Parent query key
    parentKey: unknown[];
    // Get the list from parent data
    getList: (parent: TParent) => TItem[];
    // Update parent with new list
    setList: (parent: TParent, list: TItem[]) => TParent;
  }
) {
  const queryClient = useQueryClient();

  const {
    parentKey,
    getList,
    setList,
    ...createOptions
  } = options;

  return useOptimisticCreate(mutation, {
    ...createOptions,

    onMutate: async (variables: TCreateInput) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: parentKey });
      await queryClient.cancelQueries({ queryKey: createOptions.listKey });

      // Generate temporary ID
      const tempId = generateTempId(createOptions.entityName?.toLowerCase());

      // Create optimistic item
      const optimisticItem = createOptions.createItem(variables, tempId);

      // Update parent data
      const previousParent = queryClient.getQueryData<TParent>(parentKey);

      if (previousParent) {
        const currentList = getList(previousParent);
        const newList = [...currentList, optimisticItem];
        const updatedParent = setList(previousParent, newList);

        queryClient.setQueryData(parentKey, updatedParent);
      }

      // Also update list if it exists
      const previousList = queryClient.getQueryData<TItem[]>(createOptions.listKey);
      if (previousList) {
        queryClient.setQueryData(createOptions.listKey, [...previousList, optimisticItem]);
      }

      return {
        previousParent,
        previousList,
        tempId,
        optimisticItem
      };
    },

    onError: async (error: Error, variables: TCreateInput, context: any) => {
      // Rollback parent
      if (context?.previousParent !== undefined) {
        queryClient.setQueryData(parentKey, context.previousParent);
      }

      // Rollback list
      if (context?.previousList !== undefined) {
        queryClient.setQueryData(createOptions.listKey, context.previousList);
      }

      if (createOptions.onError) {
        await createOptions.onError(error, variables);
      }
    },
  });
}