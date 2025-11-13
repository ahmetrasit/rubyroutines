/**
 * React Hook for Routine Real-time Updates
 * Automatically subscribes to routine changes for specified role
 */

import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { subscribeToRoutines, unsubscribe } from '@/lib/services/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeRoutines(roleId: string | undefined) {
  const utils = trpc.useUtils();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roleId) return;

    // Subscribe to real-time updates
    const channel = subscribeToRoutines(roleId, (event, payload) => {
      // Invalidate routine queries to refetch data
      utils.routine.invalidate();
      utils.person.invalidate();

      console.log(`Routine ${event}:`, payload);
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribe(channelRef.current);
      }
    };
  }, [roleId, utils]);

  return channelRef.current;
}
