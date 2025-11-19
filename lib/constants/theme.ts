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

/** Avatar colors - Organized by color family, darker tones */
export const AVATAR_COLORS = {
  /** Organized color palette grouped by hue */
  PALETTE: [
    // Reds & Pinks
    '#E57373', '#EF5350', '#F06292', '#EC407A', '#E91E63',
    '#D81B60', '#C2185B', '#AD1457', '#880E4F',

    // Oranges & Corals
    '#FF8A65', '#FF7043', '#FF6F00', '#F4511E', '#E64A19',
    '#D84315', '#BF360C', '#FF9800', '#FB8C00',

    // Yellows & Ambers
    '#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000',
    '#FF8F00', '#FF6F00', '#F9A825', '#F57F17',

    // Greens
    '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C',
    '#2E7D32', '#1B5E20', '#00C853', '#00B248',

    // Teals & Cyans
    '#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B',
    '#00695C', '#004D40', '#00BCD4', '#00ACC1',

    // Blues
    '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2',
    '#1565C0', '#0D47A1', '#03A9F4', '#039BE5',

    // Purples & Violets
    '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2',
    '#6A1B9A', '#4A148C', '#9575CD', '#7E57C2',

    // Neutrals & Browns
    '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037',
    '#90A4AE', '#78909C', '#607D8B', '#546E7A',
  ],
  /** Grouped colors for organized display */
  GROUPS: [
    {
      label: 'Reds & Pinks',
      colors: ['#E57373', '#EF5350', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F'],
    },
    {
      label: 'Oranges',
      colors: ['#FF8A65', '#FF7043', '#FF6F00', '#F4511E', '#E64A19', '#D84315', '#BF360C', '#FF9800', '#FB8C00'],
    },
    {
      label: 'Yellows',
      colors: ['#FFD54F', '#FFCA28', '#FFC107', '#FFB300', '#FFA000', '#FF8F00', '#FF6F00', '#F9A825', '#F57F17'],
    },
    {
      label: 'Greens',
      colors: ['#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20', '#00C853', '#00B248'],
    },
    {
      label: 'Teals & Cyans',
      colors: ['#4DB6AC', '#26A69A', '#009688', '#00897B', '#00796B', '#00695C', '#004D40', '#00BCD4', '#00ACC1'],
    },
    {
      label: 'Blues',
      colors: ['#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1', '#03A9F4', '#039BE5'],
    },
    {
      label: 'Purples',
      colors: ['#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C', '#9575CD', '#7E57C2'],
    },
    {
      label: 'Browns & Grays',
      colors: ['#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037', '#90A4AE', '#78909C', '#607D8B', '#546E7A'],
    },
  ],
  /** Default single color */
  DEFAULT: '#E57373',
  /** Child/Person default */
  CHILD: '#64B5F6',
  /** Routine default */
  ROUTINE: '#1976D2',
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