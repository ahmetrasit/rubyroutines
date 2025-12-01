'use client';

import { useEffect, useState, useCallback } from 'react';

export type AppMode = 'parent' | 'teacher' | 'principal' | 'admin';

const STORAGE_KEY = 'rubyroutines_last_mode';
const DEFAULT_MODE: AppMode = 'parent';

/**
 * Hook to track and persist the last used mode (parent/teacher/admin)
 * Uses localStorage for persistence across sessions
 */
export function useLastMode() {
  const [lastMode, setLastModeState] = useState<AppMode>(DEFAULT_MODE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'parent' || stored === 'teacher' || stored === 'principal' || stored === 'admin')) {
        setLastModeState(stored as AppMode);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage
  const setLastMode = useCallback((mode: AppMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
      setLastModeState(mode);
    }
  }, []);

  // Get home path based on last mode
  const getHomePath = useCallback(() => {
    return `/${lastMode}`;
  }, [lastMode]);

  return {
    lastMode,
    setLastMode,
    getHomePath,
    isLoaded,
  };
}

/**
 * Utility function to get last mode without hook (for server components or one-time reads)
 * Must be called client-side only
 */
export function getLastModeFromStorage(): AppMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (stored === 'parent' || stored === 'teacher' || stored === 'principal' || stored === 'admin')) {
    return stored as AppMode;
  }
  return DEFAULT_MODE;
}

/**
 * Utility function to save mode without hook
 * Must be called client-side only
 */
export function saveLastModeToStorage(mode: AppMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, mode);
  }
}
