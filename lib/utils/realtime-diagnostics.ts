/**
 * Realtime Diagnostics Utility
 * Run this in browser console to diagnose Realtime issues
 */

import { supabase } from '@/lib/realtime/supabase-realtime';

export async function diagnoseRealtime() {
  console.group('🔍 Supabase Realtime Diagnostics');

  // 1. Check Supabase connection
  console.log('\n1️⃣ Checking Supabase configuration...');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
  console.log('Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // 2. Check WebSocket connection
  console.log('\n2️⃣ Testing WebSocket connection...');
  const testChannel = supabase.channel('diagnostic-test');

  let wsConnected = false;
  let subscribed = false;

  testChannel.subscribe((status) => {
    console.log('WebSocket status:', status);
    if (status === 'SUBSCRIBED') {
      subscribed = true;
      console.log('✅ WebSocket connected and subscribed successfully');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('❌ WebSocket channel error');
    } else if (status === 'TIMED_OUT') {
      console.error('❌ WebSocket connection timed out');
    }
  });

  // Wait for connection
  await new Promise(resolve => setTimeout(resolve, 3000));

  if (!subscribed) {
    console.error('❌ Failed to subscribe - check:');
    console.error('   - Supabase project settings');
    console.error('   - Network/firewall blocking WebSocket');
    console.error('   - Browser blocking wss:// connections');
  }

  // 3. Test task_completions subscription
  console.log('\n3️⃣ Testing task_completions subscription...');
  const taskChannel = supabase
    .channel('task_completions_diagnostic')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'task_completions'
      },
      (payload) => {
        console.log('🎉 RECEIVED task completion event:', payload);
      }
    )
    .subscribe((status) => {
      console.log('task_completions subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to task_completions');
        console.log('📝 Now complete a task to test...');
      }
    });

  // 4. Check browser WebSocket support
  console.log('\n4️⃣ Checking browser support...');
  console.log('WebSocket support:', 'WebSocket' in window ? '✅' : '❌');

  // 5. List all active channels
  console.log('\n5️⃣ Active Realtime channels:');
  const channels = supabase.getChannels();
  console.log('Total channels:', channels.length);
  channels.forEach((ch, i) => {
    console.log(`Channel ${i + 1}:`, {
      topic: ch.topic,
      state: ch.state
    });
  });

  console.log('\n✨ Diagnostics complete. Keep this console open and try completing a task.');
  console.log('If you see "RECEIVED task completion event", Realtime is working!');
  console.groupEnd();

  // Return cleanup function
  return () => {
    testChannel.unsubscribe();
    taskChannel.unsubscribe();
    console.log('Diagnostic channels unsubscribed');
  };
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).diagnoseRealtime = diagnoseRealtime;
}
