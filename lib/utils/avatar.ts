/**
 * Avatar Utility Functions
 *
 * Centralized avatar parsing and generation utilities.
 */

import { AvatarData } from '@/lib/types/database';
import { AVATAR_COLORS } from '@/lib/constants/theme';

// Default color palette
export const PASTEL_COLORS = AVATAR_COLORS.PALETTE;

// Common emojis for avatar selection
export const COMMON_EMOJIS = [
  { emoji: '😀', name: 'smile', keywords: 'happy smile face' },
  { emoji: '😊', name: 'blush', keywords: 'happy blush smile' },
  { emoji: '😎', name: 'cool', keywords: 'cool sunglasses' },
  { emoji: '🤓', name: 'nerd', keywords: 'nerd glasses smart' },
  { emoji: '🥳', name: 'party', keywords: 'party celebrate happy' },
  { emoji: '😇', name: 'angel', keywords: 'angel halo good' },
  { emoji: '🤗', name: 'hug', keywords: 'hug friendly warm' },
  { emoji: '🤩', name: 'star', keywords: 'star eyes excited' },
  { emoji: '😺', name: 'cat', keywords: 'cat happy smile' },
  { emoji: '🐶', name: 'dog', keywords: 'dog puppy pet' },
  { emoji: '🐱', name: 'kitty', keywords: 'cat kitty pet' },
  { emoji: '🐭', name: 'mouse', keywords: 'mouse small cute' },
  { emoji: '🐹', name: 'hamster', keywords: 'hamster pet cute' },
  { emoji: '🐰', name: 'rabbit', keywords: 'rabbit bunny cute' },
  { emoji: '🦊', name: 'fox', keywords: 'fox animal orange' },
  { emoji: '🐻', name: 'bear', keywords: 'bear animal cute' },
  { emoji: '🐼', name: 'panda', keywords: 'panda bear cute' },
  { emoji: '🐨', name: 'koala', keywords: 'koala bear cute' },
  { emoji: '🐯', name: 'tiger', keywords: 'tiger animal' },
  { emoji: '🦁', name: 'lion', keywords: 'lion animal' },
  { emoji: '🐮', name: 'cow', keywords: 'cow animal farm' },
  { emoji: '🐷', name: 'pig', keywords: 'pig animal farm' },
  { emoji: '🐸', name: 'frog', keywords: 'frog animal green' },
  { emoji: '🐵', name: 'monkey', keywords: 'monkey animal' },
  { emoji: '🦄', name: 'unicorn', keywords: 'unicorn magic rainbow' },
  { emoji: '🐝', name: 'bee', keywords: 'bee insect honey' },
  { emoji: '🦋', name: 'butterfly', keywords: 'butterfly insect pretty' },
  { emoji: '🐙', name: 'octopus', keywords: 'octopus sea animal' },
  { emoji: '🌟', name: 'star', keywords: 'star shine bright' },
  { emoji: '⭐', name: 'gold star', keywords: 'star gold bright' },
  { emoji: '💫', name: 'dizzy', keywords: 'dizzy star sparkle' },
  { emoji: '🌈', name: 'rainbow', keywords: 'rainbow color bright' },
  { emoji: '🎈', name: 'balloon', keywords: 'balloon party celebrate' },
  { emoji: '🎨', name: 'art', keywords: 'art paint color' },
  { emoji: '🎭', name: 'theater', keywords: 'theater drama art' },
  { emoji: '🎪', name: 'circus', keywords: 'circus tent fun' },
  { emoji: '🎡', name: 'wheel', keywords: 'ferris wheel fun' },
  { emoji: '🎢', name: 'coaster', keywords: 'roller coaster fun' },
  { emoji: '🎸', name: 'guitar', keywords: 'guitar music rock' },
  { emoji: '🎹', name: 'piano', keywords: 'piano music keys' },
  { emoji: '🎺', name: 'trumpet', keywords: 'trumpet music brass' },
  { emoji: '🎻', name: 'violin', keywords: 'violin music string' },
  { emoji: '🥁', name: 'drum', keywords: 'drum music beat' },
  { emoji: '🎮', name: 'game', keywords: 'game video controller' },
  { emoji: '🧸', name: 'teddy', keywords: 'teddy bear toy' },
  { emoji: '🚀', name: 'rocket', keywords: 'rocket space ship' },
  { emoji: '🛸', name: 'ufo', keywords: 'ufo alien space' },
  { emoji: '🎯', name: 'target', keywords: 'target bullseye goal' },
  { emoji: '⚽', name: 'soccer', keywords: 'soccer ball sport' },
  { emoji: '🏀', name: 'basketball', keywords: 'basketball ball sport' },
  { emoji: '⚾', name: 'baseball', keywords: 'baseball ball sport' },
  { emoji: '🎾', name: 'tennis', keywords: 'tennis ball sport' },
  { emoji: '🏐', name: 'volleyball', keywords: 'volleyball ball sport' },
  { emoji: '🏈', name: 'football', keywords: 'football ball sport' },
  { emoji: '🥊', name: 'boxing', keywords: 'boxing glove sport' },
  { emoji: '🎓', name: 'graduate', keywords: 'graduate school education' },
  { emoji: '📚', name: 'books', keywords: 'books read study' },
  { emoji: '✏️', name: 'pencil', keywords: 'pencil write draw' },
  { emoji: '🖍️', name: 'crayon', keywords: 'crayon color draw' },
  { emoji: '🎒', name: 'backpack', keywords: 'backpack school bag' },
  { emoji: '👑', name: 'crown', keywords: 'crown king queen royal' },
  { emoji: '💎', name: 'gem', keywords: 'gem diamond jewel' },
  { emoji: '🌸', name: 'flower', keywords: 'flower blossom pink' },
  { emoji: '🌺', name: 'hibiscus', keywords: 'hibiscus flower tropical' },
  { emoji: '🌻', name: 'sunflower', keywords: 'sunflower flower yellow' },
] as const;

// Default values
const DEFAULT_COLOR = AVATAR_COLORS.DEFAULT; // Pastel pink
const DEFAULT_EMOJI = '😀';

/**
 * Parse avatar JSON string into AvatarData object
 *
 * @param avatarString - JSON string or null/undefined
 * @param fallbackName - Optional name to use for fallback emoji (first letter)
 * @returns Parsed avatar data with color and emoji
 */
export function parseAvatar(
  avatarString: string | null | undefined,
  fallbackName?: string
): AvatarData {
  // Default fallback emoji
  let fallbackEmoji = DEFAULT_EMOJI;
  if (fallbackName && fallbackName.length > 0) {
    fallbackEmoji = fallbackName.charAt(0).toUpperCase();
  }

  // If no avatar string, return defaults
  if (!avatarString) {
    return {
      color: DEFAULT_COLOR,
      emoji: fallbackEmoji,
    };
  }

  try {
    const parsed = JSON.parse(avatarString);

    return {
      color: parsed.color || DEFAULT_COLOR,
      emoji: parsed.emoji || fallbackEmoji,
    };
  } catch {
    // If parsing fails (e.g., old URL format), return defaults
    return {
      color: DEFAULT_COLOR,
      emoji: fallbackEmoji,
    };
  }
}

/**
 * Serialize avatar data to JSON string
 *
 * @param avatarData - Avatar data object
 * @returns JSON string
 */
export function serializeAvatar(avatarData: AvatarData): string {
  return JSON.stringify(avatarData);
}

/**
 * Get background color with opacity for avatar display
 *
 * @param color - Base color
 * @param opacity - Opacity value (e.g., '20' for 20%)
 * @returns Color string with opacity
 */
export function getAvatarBackgroundColor(
  color: string,
  opacity: string = '20'
): string {
  return `${color}${opacity}`;
}

/**
 * Validate avatar color
 *
 * @param color - Color to validate
 * @returns True if color is valid
 */
export function isValidAvatarColor(color: string): boolean {
  return PASTEL_COLORS.includes(color as typeof PASTEL_COLORS[number]);
}

/**
 * Generate random avatar data
 *
 * @returns Random avatar data
 */
export function generateRandomAvatar(): AvatarData {
  const randomColor = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)] || '#E3F2FD';
  const randomEmoji = COMMON_EMOJIS[Math.floor(Math.random() * COMMON_EMOJIS.length)] || { emoji: '😀', name: 'smile', keywords: '' };

  return {
    color: randomColor,
    emoji: randomEmoji.emoji,
  };
}
