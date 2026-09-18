import type { TextStyle } from 'react-native';

/**
 * Shared type scale. Every screen should compose text styles from here
 * (spread into its own StyleSheet entries) instead of hand-picking a
 * fontSize/fontWeight pair per label, so hierarchy reads the same way
 * on every screen.
 */
export const typography: Record<string, TextStyle> = {
  display: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  h1: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  h2: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 15,
    fontWeight: '800',
  },
  bodyStrong: {
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '500',
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
};
