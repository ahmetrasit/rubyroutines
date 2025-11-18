/**
 * Theme Constants
 *
 * Centralized color constants for the application.
 * Organized by purpose and usage context.
 */

/** Role-based colors for user modes and permissions */
export const ROLE_COLORS = {
  /** Parent role - Purple theme */
  PARENT: '#9333ea',
  /** Teacher role - Blue theme */
  TEACHER: '#3b82f6',
  /** Principal/Admin role - Amber theme */
  PRINCIPAL: '#f59e0b',
  /** Default role - Green theme */
  DEFAULT: '#10b981',
  /** Teacher-only features - Purple accent */
  TEACHER_ONLY: '#8B5CF6',
} as const;

/** Avatar colors - Soft pastel palette */
export const AVATAR_COLORS = {
  /** Default avatar colors array */
  PALETTE: [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
    '#E0BBE4', '#FFDFD3', '#FEC8D8', '#D4F1F4', '#C9E4DE',
    '#F7D9C4', '#FAACA8', '#DFE7FD', '#B4F8C8', '#FBE7C6',
    '#A0E7E5', '#FFAEBC', '#FBE4D8', '#D5AAFF', '#85E3FF',
    '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#FFE4CC',
    '#E6E6FA', '#FFE5B4', '#F0E68C', '#D8BFD8', '#FFE4E1',
    '#E0FFFF', '#F5DEB3'
  ],
  /** Default single color */
  DEFAULT: '#FFB3BA',
  /** Child/Person default */
  CHILD: '#BAE1FF',
  /** Routine default */
  ROUTINE: '#3B82F6',
} as const;

/** Semantic colors for UI feedback */
export const SEMANTIC_COLORS = {
  /** Success states */
  SUCCESS: {
    DEFAULT: '#10b981',
    DARK: '#059669',
    DARKER: '#047857',
  },
  /** Danger/Error states */
  DANGER: {
    DEFAULT: '#ef4444',
    DARK: '#dc2626',
    DARKER: '#b91c1c',
  },
  /** Warning states */
  WARNING: {
    DEFAULT: '#a855f7',
  },
  /** Info states */
  INFO: {
    DEFAULT: '#3b82f6',
    DARK: '#2563eb',
    DARKER: '#1d4ed8',
  },
} as const;

/** Gray scale for neutral UI elements */
export const GRAY_SCALE = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
} as const;

/** Primary brand colors */
export const BRAND_COLORS = {
  /** Primary sky blue theme */
  PRIMARY: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  /** App theme color */
  THEME: '#0ea5e9',
} as const;

/** Test data colors */
export const TEST_COLORS = {
  /** Test avatar colors */
  AVATAR: {
    PINK: '#FFB3BA',
    LIGHT_BLUE: '#B3E5FC',
    BEIGE: '#FFE5B4',
    GRAY: '#E0E0E0',
  },
} as const;

/** Type definitions for color values */
export type RoleColor = typeof ROLE_COLORS[keyof typeof ROLE_COLORS];
export type AvatarColor = typeof AVATAR_COLORS.PALETTE[number] | typeof AVATAR_COLORS.DEFAULT | typeof AVATAR_COLORS.CHILD | typeof AVATAR_COLORS.ROUTINE;
export type SemanticColor = typeof SEMANTIC_COLORS[keyof typeof SEMANTIC_COLORS];
export type GrayColor = typeof GRAY_SCALE[keyof typeof GRAY_SCALE];
export type BrandColor = typeof BRAND_COLORS.PRIMARY[keyof typeof BRAND_COLORS.PRIMARY] | typeof BRAND_COLORS.THEME;