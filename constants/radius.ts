/**
 * Shared corner-radius scale. Keeps cards, buttons, inputs, and chips
 * visually related instead of each screen picking its own radius.
 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export type RadiusKey = keyof typeof radius;
