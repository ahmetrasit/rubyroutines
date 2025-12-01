/**
 * React Hook for Task Completion Real-time Updates
 * Automatically subscribes to task completion changes for specified persons
 */

import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { subscribeToTaskCompletions, unsubscribe } from '@/lib/services/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeTaskCompletions(personIds: string[]) {
  const utils = trpc.useUtils();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!personIds.length) return;

    // Subscribe to real-time updates
    const channel = subscribeToTaskCompletions(personIds, (event, payload) => {
      // Invalidate relevant queries to refetch data
      utils.task.invalidate();
      utils.streak.invalidate();

      // Optionally, you can also update the cache directly for instant UI updates
      // This is more advanced and requires careful cache management
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current);
      }
    };
  }, [JSON.stringify(personIds), utils]);

  return channelRef.current;
}
