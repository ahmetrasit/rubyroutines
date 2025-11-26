/**
 * useKioskRealtime Hook
 *
 * Provides instant updates for kiosk mode via Supabase Realtime
 * Replaces 10-15 second polling with <100ms updates
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';
import {
  subscribeToTaskCompletions,
  subscribeToKioskSession,
  unsubscribe
} from '@/lib/realtime/supabase-realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseKioskRealtimeOptions {
  personId: string | null;
  sessionId?: string;
  roleId?: string;
  onSessionTerminated?: () => void;
  onTaskCompleted?: () => void;
  enabled?: boolean; // Allow disabling realtime (e.g., for testing)
}

/**
 * Hook to enable realtime updates for kiosk mode
 *
 * @param options - Configuration options
 * @returns Object with connection status and manual refresh function
 */
export function useKioskRealtime(options: UseKioskRealtimeOptions) {
  const {
    personId,
    sessionId,
    onSessionTerminated,
    onTaskCompleted,
    enabled = true
  } = options;

  const utils = trpc.useUtils();
  const router = useRouter();

  // Store channel references for cleanup
  const taskCompletionsChannelRef = useRef<RealtimeChannel | null>(null);
  const sessionChannelRef = useRef<RealtimeChannel | null>(null);

  // Track connection status
  const isConnectedRef = useRef(false);

  // Store timeout for cleanup
  const invalidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store current values in refs to avoid stale closures and keep callbacks stable
  const personIdRef = useRef(personId);
  const sessionIdRef = useRef(sessionId);
  const utilsRef = useRef(utils);
  const onTaskCompletedRef = useRef(onTaskCompleted);
  const onSessionTerminatedRef = useRef(onSessionTerminated);

  personIdRef.current = personId;
  sessionIdRef.current = sessionId;
  utilsRef.current = utils;
  onTaskCompletedRef.current = onTaskCompleted;
  onSessionTerminatedRef.current = onSessionTerminated;

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
      // This prevents UI flicker when optimistic state is replaced with server data
      invalidationTimeoutRef.current = setTimeout(() => {
        // Use refs to get current values (avoids stale closures)
        const currentPersonId = personIdRef.current;
        const currentUtils = utilsRef.current;

        // Invalidate queries to refetch latest data
        if (currentPersonId) {
          // Invalidate person tasks query
          currentUtils.kiosk.getPersonTasks.invalidate({ personId: currentPersonId });

          // Invalidate person query (for updated timestamps)
          currentUtils.kiosk.getPerson.invalidate({ personId: currentPersonId });
        }

        // Call custom callback if provided
        onTaskCompletedRef.current?.();

        // Clear ref after completion
        invalidationTimeoutRef.current = null;
      }, 200); // 200ms delay allows optimistic updates to settle
    },
    [] // No dependencies - all values accessed via refs
  );

  /**
   * Handle session termination events from Realtime
   */
  const handleSessionTermination = useCallback(() => {
    // Clean up local storage
    localStorage.removeItem('kiosk_session');

    // Call custom callback if provided
    onSessionTerminatedRef.current?.();

    // Redirect to kiosk home
    router.push('/kiosk');
  }, [router]); // Only router as dependency (stable)

  /**
   * Handle session update events from Realtime
   */
  const handleSessionUpdate = useCallback(
    (payload: any) => {
      // Check if session was terminated
      if (payload.new?.is_active === false || payload.new?.terminated_at) {
        handleSessionTermination();
      }

      // Invalidate session query using ref values
      const currentSessionId = sessionIdRef.current;
      const currentUtils = utilsRef.current;
      if (currentSessionId) {
        currentUtils.kiosk.verifySession.invalidate({ code: currentSessionId });
      }
    },
    [handleSessionTermination] // Only handleSessionTermination (now stable)
  );

  /**
   * Handle subscription errors
   */
  const handleError = useCallback((error: Error) => {
    console.error('[useKioskRealtime] Subscription error:', error);
    isConnectedRef.current = false;

    // Fall back to polling if realtime fails
    // The existing refetchInterval will handle this automatically
  }, []); // No dependencies

  /**
   * Subscribe to realtime events
   */
  useEffect(() => {
    // Skip if disabled or no person selected
    if (!enabled || !personId) {
      return;
    }

    // Subscribe to task completions
    const taskChannel = subscribeToTaskCompletions(
      personId,
      handleTaskCompletion,
      handleError
    );
    taskCompletionsChannelRef.current = taskChannel;

    // Subscribe to session updates if session ID provided
    if (sessionId) {
      const sessionChannel = subscribeToKioskSession(
        sessionId,
        handleSessionUpdate,
        handleSessionTermination,
        handleError
      );
      sessionChannelRef.current = sessionChannel;
    }

    isConnectedRef.current = true;

    // Cleanup subscriptions on unmount or dependency change
    return () => {
      // Clear pending invalidation timeout
      if (invalidationTimeoutRef.current) {
        clearTimeout(invalidationTimeoutRef.current);
        invalidationTimeoutRef.current = null;
      }

      if (taskCompletionsChannelRef.current) {
        unsubscribe(taskCompletionsChannelRef.current);
        taskCompletionsChannelRef.current = null;
      }

      if (sessionChannelRef.current) {
        unsubscribe(sessionChannelRef.current);
        sessionChannelRef.current = null;
      }

      isConnectedRef.current = false;
    };
  }, [
    enabled,
    personId,
    sessionId,
    handleTaskCompletion,
    handleSessionUpdate,
    handleSessionTermination,
    handleError
  ]);

  /**
   * Manual refresh function (for pull-to-refresh, etc.)
   */
  const refresh = useCallback(() => {
    if (personId) {
      utils.kiosk.getPersonTasks.invalidate({ personId });
      utils.kiosk.getPerson.invalidate({ personId });
    }
    if (sessionId) {
      utils.kiosk.verifySession.invalidate({ code: sessionId });
    }
  }, [personId, sessionId, utils]);

  return {
    isConnected: isConnectedRef.current,
    refresh
  };
}
