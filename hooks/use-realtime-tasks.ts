/**
 * React Hook for Task Real-time Updates
 * Automatically subscribes to task changes for specified routine
 */

import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { subscribeToTasks, unsubscribe } from '@/lib/services/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeTasks(routineId: string | undefined) {
  const utils = trpc.useUtils();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!routineId) return;

    // Subscribe to real-time updates
    const channel = subscribeToTasks(routineId, (event, payload) => {
      // Invalidate task queries to refetch data
      utils.task.invalidate();
      utils.routine.invalidate();

      console.log(`Task ${event}:`, payload);
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current);
      }
    };
  }, [routineId, utils]);

  return channelRef.current;
}
