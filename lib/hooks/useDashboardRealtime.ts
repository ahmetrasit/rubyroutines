/**
 * useDashboardRealtime Hook
 *
 * Provides instant updates for dashboard check-in via Supabase Realtime
 * Syncs task completions across kiosk and dashboard in real-time
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
  subscribeToTaskCompletions,
  unsubscribe
} from '@/lib/realtime/supabase-realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseDashboardRealtimeOptions {
  personIds: string[]; // Array of person IDs to monitor
  enabled?: boolean; // Allow disabling realtime
  onTaskCompleted?: () => void;
}

/**
 * Hook to enable realtime updates for dashboard mode
 *
 * @param options - Configuration options
 * @returns Object with connection status and manual refresh function
 */
export function useDashboardRealtime(options: UseDashboardRealtimeOptions) {
  const {
    personIds,
    enabled = true,
    onTaskCompleted
  } = options;

  const utils = trpc.useUtils();

  // Store channel references for cleanup (one per person)
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());

  // Store timeout for cleanup
  const invalidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle task completion events from Realtime
   */
  const handleTaskCompletion = useCallback(
    (payload: any) => {
      // Clear any pending timeout
      if (invalidationTimeoutRef.current) {
        clearTimeout(invalidationTimeoutRef.current);
      }

      // Add small delay to let optimistic updates complete first
      invalidationTimeoutRef.current = setTimeout(() => {
        // Invalidate all task-related queries
        utils.task.invalidate();
        utils.streak.invalidate();
        utils.goal.invalidate();

        // Invalidate person queries (used by checkin modals)
        // This is critical for dashboard checkin to update in real-time
        utils.person.invalidate();

        // Call custom callback if provided
        onTaskCompleted?.();

        // Clear ref after completion
        invalidationTimeoutRef.current = null;
      }, 200); // 200ms delay allows optimistic updates to settle
    },
    [utils, onTaskCompleted]
  );

  /**
   * Handle subscription errors
   */
  const handleError = useCallback((error: Error) => {
    console.error('[useDashboardRealtime] Subscription error:', error);
  }, []);

  /**
   * Subscribe to realtime events for all persons
   */
  useEffect(() => {
    // Skip if disabled or no persons
    if (!enabled || personIds.length === 0) {
      return;
    }

    // Subscribe to task completions for each person
    const newChannels = new Map<string, RealtimeChannel>();

    personIds.forEach((personId) => {
      const channel = subscribeToTaskCompletions(
        personId,
        handleTaskCompletion,
        handleError
      );
      newChannels.set(personId, channel);
    });

    channelsRef.current = newChannels;

    // Cleanup subscriptions on unmount or dependency change
    return () => {
      // Clear pending invalidation timeout
      if (invalidationTimeoutRef.current) {
        clearTimeout(invalidationTimeoutRef.current);
        invalidationTimeoutRef.current = null;
      }

      // Unsubscribe from all channels
      channelsRef.current.forEach((channel) => {
        unsubscribe(channel);
      });
      channelsRef.current.clear();
    };
  }, [
    enabled,
    JSON.stringify(personIds), // Use JSON.stringify for stable array comparison
    handleTaskCompletion,
    handleError
  ]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    utils.task.invalidate();
    utils.streak.invalidate();
    utils.goal.invalidate();
    utils.person.invalidate();
  }, [utils]);

  return {
    isConnected: channelsRef.current.size > 0,
    refresh
  };
}
