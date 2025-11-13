'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface SessionTimeoutProps {
  expiresAt: Date;
  onTimeout: () => void;
  warningSeconds?: number;
}

export function SessionTimeout({
  expiresAt,
  onTimeout,
  warningSeconds = 120, // 2 minutes warning by default
}: SessionTimeoutProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));

      setTimeRemaining(remaining);
      setShowWarning(remaining > 0 && remaining <= warningSeconds);

      if (remaining === 0) {
        clearInterval(interval);
        onTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onTimeout, warningSeconds]);

  if (!showWarning) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white py-3 px-6 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
        <AlertTriangle className="h-5 w-5 animate-pulse" />
        <p className="font-semibold">
          Session expires in {minutes}:{seconds.toString().padStart(2, '0')}
        </p>
        <AlertTriangle className="h-5 w-5 animate-pulse" />
      </div>
    </div>
  );
}
