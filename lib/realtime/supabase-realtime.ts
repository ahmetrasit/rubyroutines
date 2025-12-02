/**
 * Supabase Realtime Connection Manager
 *
 * Provides realtime subscriptions for kiosk updates
 * Replaces polling with instant updates via Supabase Realtime
 */

'use client';

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Use the singleton Supabase client to avoid multiple GoTrueClient instances
export const supabase = createClient();

/**
 * Subscribe to task completions for a specific person
 * Triggers callback when new completions are inserted
 */
export function subscribeToTaskCompletions(
  personId: string,
  onInsert: (payload: any) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`task_completions:${personId}`)
    // OPTIMIZATION: Filter at database level to reduce message volume by 99%
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'task_completions',
        filter: `personId=eq.${personId}` // Database-side filter (camelCase column name)
      },
      (payload) => {
        // Payload is already filtered to this person's completions
        onInsert(payload);
      }
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel error:', error);
        onError?.(new Error('Failed to subscribe to task completions'));
      } else if (status === 'TIMED_OUT') {
        console.error('[Realtime] Subscription timed out');
        onError?.(new Error('Subscription timed out'));
      }
    });

  return channel;
}

/**
 * Subscribe to kiosk session updates
 * Triggers callback when session is terminated or updated
 */
export function subscribeToKioskSession(
  sessionId: string,
  onUpdate: (payload: any) => void,
  onDelete: (payload: any) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`kiosk_session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'kiosk_sessions',
        filter: `id=eq.${sessionId}`
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'kiosk_sessions',
        filter: `id=eq.${sessionId}`
      },
      (payload) => {
        onDelete(payload);
      }
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel error:', error);
        onError?.(new Error('Failed to subscribe to kiosk session'));
      } else if (status === 'TIMED_OUT') {
        console.error('[Realtime] Subscription timed out');
        onError?.(new Error('Subscription timed out'));
      }
    });

  return channel;
}

/**
 * Subscribe to role-level updates (for multi-person kiosks)
 * Triggers when any person in the role has updates
 */
export function subscribeToRoleUpdates(
  roleId: string,
  onUpdate: (payload: any) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`role_updates:${roleId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'roles',
        filter: `id=eq.${roleId}`
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'people',
        filter: `roleId=eq.${roleId}`
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Channel error:', error);
        onError?.(new Error('Failed to subscribe to role updates'));
      } else if (status === 'TIMED_OUT') {
        console.error('[Realtime] Subscription timed out');
        onError?.(new Error('Subscription timed out'));
      }
    });

  return channel;
}

/**
 * Unsubscribe from a channel and clean up
 * Synchronous to work properly in React cleanup functions
 */
export function unsubscribe(channel: RealtimeChannel): void {
  // removeChannel returns a promise but we don't need to await it
  // Supabase handles cleanup internally
  supabase.removeChannel(channel);
}

/**
 * Check if Realtime is connected and working
 */
export function isRealtimeConnected(): boolean {
  // Check if any channels are connected
  const channels = supabase.getChannels();
  return channels.some(ch => ch.state === 'joined');
}
