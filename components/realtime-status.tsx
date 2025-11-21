'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WifiIcon } from '@heroicons/react/24/outline';

/**
 * Real-time Connection Status Indicator
 * Shows connection status for Supabase Realtime
 */
export function RealtimeStatus() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Create a test channel to monitor connection status
    const channel = supabase.channel('status_check');

    // Handle subscription with error catching
    try {
      channel
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setStatus('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setStatus('disconnected');
          } else {
            setStatus('connecting');
          }
        })
        .on('error', (error) => {
          console.log('Realtime connection error (expected if realtime is not configured):', error.message);
          setStatus('disconnected');
        });
    } catch (error) {
      // Silently handle connection errors - realtime might not be configured
      console.log('Realtime not available:', error);
      setStatus('disconnected');
    }

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        // Silently handle cleanup errors
        console.log('Error cleaning up realtime channel:', error);
      }
    };
  }, []);

  const statusColors = {
    connected: 'text-green-500',
    connecting: 'text-yellow-500',
    disconnected: 'text-red-500',
  };

  const statusLabels = {
    connected: 'Connected - Live updates active',
    connecting: 'Connecting to live updates...',
    disconnected: 'Disconnected - Live updates unavailable',
  };

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={statusLabels[status]}
        title={statusLabels[status]}
      >
        <WifiIcon className={`w-5 h-5 ${statusColors[status]} transition-colors`} />
      </button>

      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
          {statusLabels[status]}
          <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-900" />
        </div>
      )}
    </div>
  );
}
