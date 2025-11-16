import { useState, useEffect } from 'react';

/**
 * Custom hook to detect page visibility using the Page Visibility API.
 * Returns true when the page is visible, false when hidden (tab in background).
 * Use this to pause expensive operations like polling when the page is not visible.
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Set initial state
    setIsVisible(!document.hidden);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
