'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Kiosk error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full bg-white border-2 border-red-300 rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-red-100 p-4 mb-4">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Kiosk Error</h2>
          <p className="text-sm text-gray-600 mb-6">
            {error.message || 'Unable to load kiosk mode. Please try again.'}
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Button onClick={() => reset()} size="lg" className="w-full">
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/kiosk'} variant="outline" size="lg" className="w-full">
              Back to Kiosk
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
