/**
 * Supabase Realtime Service
 * Provides real-time subscriptions for task completions, routines, and more
 */

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface TaskCompletionPayload {
  id: string;
  task_id: string;
  person_id: string;
  completed_at: string;
  completed_by_role_id: string;
  notes?: string;
}

export interface RoutinePayload {
  id: string;
  role_id: string;
  name: string;
  description?: string;
  status: string;
  updated_at: string;
}

export interface TaskPayload {
  id: string;
  routine_id: string;
  name: string;
  description?: string;
  order_index: number;
  status: string;
  updated_at: string;
}

/**
 * Subscribe to task completions for specific persons
 */
export function subscribeToTaskCompletions(
  personIds: string[],
  callback: (event: RealtimeEvent, payload: TaskCompletionPayload) => void
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase
    .channel('task_completions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'task_completions',
        filter: `person_id=in.(${personIds.join(',')})`,
      },
      (payload) => {
        const event = payload.eventType as RealtimeEvent;
        const data = payload.new as TaskCompletionPayload;
        callback(event, data);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to routine changes for specific role
 */
export function subscribeToRoutines(
  roleId: string,
  callback: (event: RealtimeEvent, payload: RoutinePayload) => void
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase
    .channel(`routines_${roleId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'routines',
        filter: `role_id=eq.${roleId}`,
      },
      (payload) => {
        const event = payload.eventType as RealtimeEvent;
        const data = payload.new as RoutinePayload;
        callback(event, data);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to task changes for specific routine
 */
export function subscribeToTasks(
  routineId: string,
  callback: (event: RealtimeEvent, payload: TaskPayload) => void
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase
    .channel(`tasks_${routineId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `routine_id=eq.${routineId}`,
      },
      (payload) => {
        const event = payload.eventType as RealtimeEvent;
        const data = payload.new as TaskPayload;
        callback(event, data);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  const supabase = createClient();
  await supabase.removeChannel(channel);
}

/**
 * Get connection status
 */
export function getConnectionStatus(channel: RealtimeChannel): string {
  return channel.state;
}
