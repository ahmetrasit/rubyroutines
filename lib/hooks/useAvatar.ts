/**
 * useAvatar Hook
 *
 * Memoized avatar parsing hook for better performance.
 */

'use client';

import { useMemo } from 'react';
import { parseAvatar, getAvatarBackgroundColor } from '@/lib/utils/avatar';
import type { AvatarData } from '@/lib/types/database';

interface UseAvatarOptions {
  avatarString: string | null | undefined;
  fallbackName?: string;
  opacity?: string;
}

interface UseAvatarReturn extends AvatarData {
  backgroundColor: string;
}

/**
 * Custom hook for parsing and memoizing avatar data
 *
 * @param options - Avatar options
 * @returns Parsed avatar data with background color
 *
 * @example
 * ```tsx
 * const { color, emoji, backgroundColor } = useAvatar({
 *   avatarString: person.avatar,
 *   fallbackName: person.name,
 * });
 * ```
 */
export function useAvatar(options: UseAvatarOptions): UseAvatarReturn {
  const { avatarString, fallbackName, opacity = '20' } = options;

  return useMemo(() => {
    const { color, emoji } = parseAvatar(avatarString, fallbackName);
    const backgroundColor = getAvatarBackgroundColor(color, opacity);

    return {
      color,
      emoji,
      backgroundColor,
    };
  }, [avatarString, fallbackName, opacity]);
}
