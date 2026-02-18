/**
 * Design Tokens
 *
 * These tokens define the visual language of the application.
 * All values in this file are the single source of truth for the design system.
 *
 * DO NOT use arbitrary values in Tailwind classes (e.g., w-[347px], text-[#ff0000]).
 * ALWAYS use token-mapped values (e.g., w-64, text-danger-500).
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

/**
 * Primary color scale - Used for main actions, active states, and emphasis
 * Based on Indigo palette
 */
export const primary = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
  950: '#1e1b4b',
};

/**
 * Secondary color scale - Used for secondary actions and supporting elements
 * Based on Slate palette
 */
export const secondary = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

/**
 * Accent color scale - Used for success states and positive indicators
 * Based on Emerald palette
 */
export const accent = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
};

/**
 * Danger color scale - Used for errors, destructive actions, and warnings
 * Based on Red palette
 */
export const danger = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
};

/**
 * Warning color scale - Used for cautionary states and alerts
 * Based on Amber palette
 */
export const warning = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
};

/**
 * Info color scale - Used for informational states and neutral alerts
 * Based on Sky palette
 */
export const info = {
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
  950: '#082f49',
};

/**
 * Background colors - Used for page and container backgrounds
 */
export const background = {
  default: '#ffffff',
  subtle: '#f8fafc',
  muted: '#f1f5f9',
  dark: '#0f172a',
};

/**
 * Border colors - Used for borders and dividers
 */
export const border = {
  default: '#e2e8f0',
  subtle: '#f1f5f9',
  strong: '#cbd5e1',
};

/**
 * Text colors - Used for typography
 */
export const text = {
  primary: '#0f172a',
  secondary: '#475569',
  muted: '#94a3b8',
  inverse: '#ffffff',
  link: '#4f46e5',
  linkHover: '#4338ca',
};

/**
 * Chart colors - Used for data visualization
 */
export const chart = {
  1: '#6366f1',
  2: '#10b981',
  3: '#f59e0b',
  4: '#ef4444',
  5: '#0ea5e9',
  6: '#8b5cf6',
};

/**
 * Complete colors object for Tailwind config
 */
export const colors = {
  primary,
  secondary,
  accent,
  danger,
  warning,
  info,
  background,
  border,
  text,
  chart,
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  current: 'currentColor',
};

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

/**
 * Font families
 */
export const fontFamily = {
  sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
  mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
};

/**
 * Font sizes - Using Tailwind's default scale
 */
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],       // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
  '5xl': ['3rem', { lineHeight: '1' }],         // 48px
};

/**
 * Font weights
 */
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/**
 * Line heights
 */
export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
};

/**
 * Complete typography object for Tailwind config
 */
export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
};

// ============================================================================
// SPACING TOKENS
// ============================================================================

/**
 * Spacing scale - Based on 4px increments
 * Each unit represents 4px (0.25rem)
 */
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
};

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

/**
 * Border radius scale
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// ============================================================================
// SHADOW TOKENS
// ============================================================================

/**
 * Box shadows - Used for elevation and depth
 */
export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
  // Focus rings
  focus: '0 0 0 3px rgb(99 102 241 / 0.3)',
  focusDanger: '0 0 0 3px rgb(239 68 68 / 0.3)',
  focusAccent: '0 0 0 3px rgb(16 185 129 / 0.3)',
};

// ============================================================================
// TRANSITION TOKENS
// ============================================================================

/**
 * Transition durations
 */
export const transitionDuration = {
  DEFAULT: '150ms',
  fast: '75ms',
  normal: '150ms',
  slow: '300ms',
  slower: '500ms',
};

/**
 * Transition timing functions
 */
export const transitionTimingFunction = {
  DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

/**
 * Z-index scale for layering
 */
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
};

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

/**
 * Animation keyframes and durations
 */
export const animation = {
  spin: 'spin 1s linear infinite',
  ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  bounce: 'bounce 1s infinite',
  fadeIn: 'fadeIn 0.2s ease-out',
  fadeOut: 'fadeOut 0.2s ease-in',
  slideIn: 'slideIn 0.2s ease-out',
  slideOut: 'slideOut 0.2s ease-in',
};

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

/**
 * Button sizes
 */
export const buttonSizes = {
  sm: {
    paddingY: '0.375rem',  // 6px
    paddingX: '0.75rem',   // 12px
    fontSize: '0.875rem',  // 14px
    borderRadius: '0.375rem', // 6px
  },
  md: {
    paddingY: '0.5rem',    // 8px
    paddingX: '1rem',      // 16px
    fontSize: '0.875rem',  // 14px
    borderRadius: '0.5rem', // 8px
  },
  lg: {
    paddingY: '0.625rem',  // 10px
    paddingX: '1.25rem',   // 20px
    fontSize: '1rem',      // 16px
    borderRadius: '0.5rem', // 8px
  },
};

/**
 * Input sizes
 */
export const inputSizes = {
  sm: {
    paddingY: '0.375rem',  // 6px
    paddingX: '0.75rem',   // 12px
    fontSize: '0.875rem',  // 14px
  },
  md: {
    paddingY: '0.5rem',    // 8px
    paddingX: '1rem',      // 16px
    fontSize: '0.875rem',  // 14px
  },
  lg: {
    paddingY: '0.625rem',  // 10px
    paddingX: '1rem',      // 16px
    fontSize: '1rem',      // 16px
  },
};

/**
 * Modal sizes
 */
export const modalSizes = {
  sm: '24rem',   // 384px
  md: '28rem',   // 448px
  lg: '32rem',   // 512px
  xl: '36rem',   // 576px
  '2xl': '42rem', // 672px
  full: '100%',
};

// ============================================================================
// BREAKPOINTS
// ============================================================================

/**
 * Responsive breakpoints
 */
export const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
