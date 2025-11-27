/**
 * NetworkStatusIndicator Component
 *
 * Visual indicator for network connection status.
 * Shows when offline or experiencing slow connection.
 */

'use client';

import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NetworkStatusIndicatorProps {
  // Position of the indicator
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  // Only show when there are issues
  hideWhenOnline?: boolean;
  // Show detailed connection info
  showDetails?: boolean;
  // Custom className
  className?: string;
  // Compact mode (icon only)
  compact?: boolean;
}

export function NetworkStatusIndicator({
  position = 'bottom-right',
  hideWhenOnline = true,
  showDetails = false,
  className,
  compact = false,
}: NetworkStatusIndicatorProps) {
  const { status, isOnline, effectiveType, rtt, checkConnection } = useNetworkStatus({
    detectQuality: true,
    slowThreshold: 3000,
  });

  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine visibility
  useEffect(() => {
    if (hideWhenOnline) {
      setIsVisible(status !== 'online');
    } else {
      setIsVisible(true);
    }
  }, [status, hideWhenOnline]);

  // Auto-hide expanded view after 5 seconds
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isExpanded]);

  if (!isVisible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const statusConfig = {
    online: {
      icon: Wifi,
      label: 'Online',
      color: 'text-green-600 bg-green-100 border-green-200',
      pulseColor: 'bg-green-500',
    },
    slow: {
      icon: AlertCircle,
      label: 'Slow Connection',
      color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      pulseColor: 'bg-yellow-500',
    },
    offline: {
      icon: WifiOff,
      label: 'Offline',
      color: 'text-red-600 bg-red-100 border-red-200',
      pulseColor: 'bg-red-500',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-300',
        positionClasses[position],
        className
      )}
    >
      <div
        className={cn(
          'relative flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur-sm',
          config.color,
          compact && 'p-2',
          'cursor-pointer select-none'
        )}
        onClick={() => {
          if (showDetails) {
            setIsExpanded(!isExpanded);
          }
          checkConnection();
        }}
      >
        {/* Pulse indicator for offline/slow */}
        {status !== 'online' && (
          <span className="absolute -left-1 -top-1 flex h-3 w-3">
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                config.pulseColor
              )}
            />
            <span
              className={cn(
                'relative inline-flex h-3 w-3 rounded-full',
                config.pulseColor
              )}
            />
          </span>
        )}

        <Icon className="h-4 w-4" />

        {!compact && (
          <span className="text-sm font-medium">{config.label}</span>
        )}

        {/* Retry button for offline state */}
        {status === 'offline' && !compact && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              checkConnection();
            }}
            className="ml-2 text-xs underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>

      {/* Expanded details */}
      {showDetails && isExpanded && !compact && (
        <div
          className={cn(
            'absolute mt-2 w-64 rounded-lg border bg-white p-4 shadow-lg',
            'dark:bg-gray-800',
            position.includes('right') ? 'right-0' : 'left-0'
          )}
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status:</span>
              <span className="font-medium">{config.label}</span>
            </div>

            {effectiveType && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Connection:</span>
                <span className="font-medium uppercase">{effectiveType}</span>
              </div>
            )}

            {rtt !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Latency:</span>
                <span className="font-medium">{rtt}ms</span>
              </div>
            )}

            <div className="mt-3 border-t pt-2">
              <p className="text-xs text-gray-500">
                {status === 'offline'
                  ? 'Changes will be saved when you reconnect'
                  : status === 'slow'
                  ? 'Changes may take longer to save'
                  : 'All systems operational'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline network status badge for embedding in other components
 */
export function NetworkStatusBadge({ className }: { className?: string }) {
  const { status } = useNetworkStatus();

  if (status === 'online') return null;

  const statusConfig = {
    slow: {
      label: 'Slow',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    offline: {
      label: 'Offline',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  };

  const config = statusConfig[status as 'slow' | 'offline'];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

/**
 * Network-aware wrapper that shows content based on network status
 */
export function NetworkAware({
  children,
  fallback,
  showOfflineMessage = true,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showOfflineMessage?: boolean;
}) {
  const { isOnline } = useNetworkStatus();

  if (!isOnline) {
    if (fallback) return <>{fallback}</>;

    if (showOfflineMessage) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <WifiOff className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold">You're offline</h3>
          <p className="text-sm text-gray-500">
            Please check your internet connection and try again.
          </p>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}