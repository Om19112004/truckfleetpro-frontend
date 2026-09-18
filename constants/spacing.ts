/**
 * Shared spacing scale. Every screen should pull gaps/paddings/margins from
 * here instead of inventing one-off numbers, so rhythm stays consistent
 * across the whole app.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export type SpacingKey = keyof typeof spacing;
