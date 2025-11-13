'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString(),
    }));
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Cookie Preferences
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We use cookies to enhance your experience, analyze site usage, and remember your preferences.
              By clicking "Accept All", you consent to our use of cookies.{' '}
              <Link
                href="/cookies"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Learn more
              </Link>
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={acceptNecessary}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              aria-label="Accept only necessary cookies"
            >
              Necessary Only
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              aria-label="Accept all cookies"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if user has given consent for specific cookie types
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState({
    necessary: true,
    functional: false,
    analytics: false,
  });

  useEffect(() => {
    const storedConsent = localStorage.getItem('cookie-consent');
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);
        setConsent({
          necessary: parsed.necessary ?? true,
          functional: parsed.functional ?? false,
          analytics: parsed.analytics ?? false,
        });
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
      }
    }
  }, []);

  return consent;
}
