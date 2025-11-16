import { useState, useEffect } from 'react';

/**
 * Custom hook to detect page visibility using the Page Visibility API.
 * Returns true when the page is visible, false when hidden (tab in background).
 * Use this to pause expensive operations like polling when the page is not visible.
 *
 * @returns Boolean indicating if page is currently visible
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const isVisible = usePageVisibility();
 *
 *   useEffect(() => {
 *     if (!isVisible) return;
 *
 *     // Only poll when page is visible
 *     const interval = setInterval(() => {
 *       fetchData();
 *     }, 5000);
 *
 *     return () => clearInterval(interval);
 *   }, [isVisible]);
 * }
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API|Page Visibility API}
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
