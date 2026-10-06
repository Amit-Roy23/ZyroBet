/**
 * ZyroBet Border Radius Tokens
 */

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16, // Default card radius
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
