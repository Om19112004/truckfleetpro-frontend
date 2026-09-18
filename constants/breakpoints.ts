import { useWindowDimensions } from 'react-native';

export const breakpoints = {
  tablet: 768,
  desktop: 1120,
} as const;

export type DeviceClass = 'phone' | 'tablet' | 'desktop';

export function classifyWidth(width: number): DeviceClass {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'phone';
}

/**
 * One shared source of truth for responsive layout decisions, instead of
 * every screen hand-rolling its own `windowWidth < 768` check.
 */
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const device = classifyWidth(width);

  return {
    width,
    device,
    isPhone: device === 'phone',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    // Convenience used by most screens today: "compact" phone layout vs. wider layout.
    isCompact: device === 'phone',
  };
}
