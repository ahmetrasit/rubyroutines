/**
 * useNetworkStatus Hook
 *
 * Detects network status and connection quality.
 * Provides real-time network state for optimistic UI feedback.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export type NetworkStatus = 'online' | 'offline' | 'slow';

interface NetworkState {
  isOnline: boolean;
  status: NetworkStatus;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | undefined;
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData?: boolean;
}

interface UseNetworkStatusOptions {
  // Threshold for considering connection as slow (ms)
  slowThreshold?: number;
  // Enable connection quality detection
  detectQuality?: boolean;
  // Callback when status changes
  onStatusChange?: (status: NetworkStatus) => void;
  // Enable automatic query refetch on reconnect
  refetchOnReconnect?: boolean;
}

/**
 * Hook to monitor network status and quality
 */
export function useNetworkStatus(options: UseNetworkStatusOptions = {}) {
  const {
    slowThreshold = 2000,
    detectQuality = true,
    onStatusChange,
    refetchOnReconnect = true,
  } = options;

  const queryClient = useQueryClient();
  const [networkState, setNetworkState] = useState<NetworkState>(() => ({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    status: typeof window !== 'undefined' && navigator.onLine ? 'online' : 'offline',
    effectiveType: undefined,
    downlink: undefined,
    rtt: undefined,
    saveData: undefined,
  }));

  const pingTimeoutRef = useRef<NodeJS.Timeout>();

  // Get connection info from Network Information API
  const getConnectionInfo = useCallback(() => {
    if (typeof window === 'undefined') return {};

    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      return {
        effectiveType: connection.effectiveType as NetworkState['effectiveType'],
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }

    return {};
  }, []);

  // Detect slow connection by measuring fetch time
  const checkConnectionSpeed = useCallback(async () => {
    if (!detectQuality || !navigator.onLine) return 'offline' as NetworkStatus;

    try {
      const startTime = Date.now();
      const controller = new AbortController();

      // Timeout after slowThreshold
      const timeoutId = setTimeout(() => controller.abort(), slowThreshold);

      // Ping health check endpoint
      await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      // Consider slow if response takes longer than threshold
      return elapsed > slowThreshold ? 'slow' : 'online';
    } catch (error) {
      // If fetch fails or times out, consider it slow/offline
      if ((error as any)?.name === 'AbortError') {
        return 'slow';
      }
      return 'offline';
    }
  }, [detectQuality, slowThreshold]);

  // Update network state
  const updateNetworkState = useCallback(async () => {
    const isOnline = navigator.onLine;
    let status: NetworkStatus = isOnline ? 'online' : 'offline';

    // Check connection quality if online
    if (isOnline && detectQuality) {
      status = await checkConnectionSpeed();
    }

    const connectionInfo = getConnectionInfo();

    setNetworkState(prev => {
      const newState = {
        isOnline,
        status,
        ...connectionInfo,
      };

      // Notify status change
      if (prev.status !== status && onStatusChange) {
        onStatusChange(status);
      }

      return newState;
    });

    // Refetch queries on reconnect
    if (refetchOnReconnect && isOnline && !networkState.isOnline) {
      queryClient.refetchQueries();
    }
  }, [
    detectQuality,
    checkConnectionSpeed,
    getConnectionInfo,
    onStatusChange,
    refetchOnReconnect,
    queryClient,
    networkState.isOnline,
  ]);

  // Setup event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial check
    updateNetworkState();

    // Listen to online/offline events
    const handleOnline = () => updateNetworkState();
    const handleOffline = () => updateNetworkState();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to connection changes
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkState);
    }

    // Periodic quality check when online
    const interval = setInterval(() => {
      if (navigator.onLine && detectQuality) {
        updateNetworkState();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateNetworkState);
      }

      clearInterval(interval);

      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }
    };
  }, [updateNetworkState, detectQuality]);

  return {
    ...networkState,
    checkConnection: updateNetworkState,
  };
}

/**
 * Hook for offline queue management
 */
export function useOfflineQueue<T = any>() {
  const [queue, setQueue] = useState<T[]>([]);
  const { isOnline } = useNetworkStatus();

  // Add item to queue
  const enqueue = useCallback((item: T) => {
    setQueue(prev => [...prev, item]);
  }, []);

  // Remove item from queue
  const dequeue = useCallback((predicate?: (item: T) => boolean) => {
    if (!predicate) {
      setQueue(prev => prev.slice(1));
    } else {
      setQueue(prev => prev.filter(item => !predicate(item)));
    }
  }, []);

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Process queue when online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      // Notify that queue can be processed
      // This is where you'd process queued mutations
    }
  }, [isOnline, queue]);

  return {
    queue,
    enqueue,
    dequeue,
    clearQueue,
    isOnline,
    hasItems: queue.length > 0,
  };
}

/**
 * Simple hook for basic online/offline detection
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}