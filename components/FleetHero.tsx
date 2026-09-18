import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../constants/radius';

type FleetHeroProps = {
  /** Compact sizing for smaller placements (e.g. inside a hero card). */
  compact?: boolean;
};

/**
 * A single, lightweight fleet visual used across the app wherever the old
 * WebGL truck scene / exploded-truck scroll sequence / always-animated
 * highway loops used to live.
 *
 * Design intent: one purposeful entrance animation (fade + rise) plus a
 * single, cheap idle loop (a soft glow pulse behind the truck badge and a
 * slow drift on the route dashes). Everything runs on the native thread via
 * Reanimated, uses only opacity/transform, and there is no WebGL, no
 * requestAnimationFrame render loop, and no autoplay "driving" sequence.
 */
export function FleetHero({ compact = false }: FleetHeroProps) {
  const { colors } = useTheme();
  const size = compact ? 96 : 132;

  const entrance = useSharedValue(0);
  const glow = useSharedValue(0);
  const dash = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    dash.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false);
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 10 }, { scale: 0.94 + entrance.value * 0.06 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glow.value * 0.35,
    transform: [{ scale: 1 + glow.value * 0.08 }],
  }));

  const dashStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -dash.value * 24 }],
  }));

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, entranceStyle]}>
      <Animated.View
        style={[
          styles.glow,
          { width: size * 0.82, height: size * 0.82, borderRadius: size, backgroundColor: colors.primary },
          glowStyle,
        ]}
      />

      <View
        style={[
          styles.badge,
          {
            width: size * 0.62,
            height: size * 0.62,
            borderRadius: radius.lg,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <MaterialCommunityIcons name="truck-fast" size={size * 0.32} color="#FFFFFF" />
      </View>

      <View style={[styles.dashRow, { bottom: size * 0.08, width: size * 0.7 }]}>
        <Animated.View style={[styles.dashTrack, dashStyle]}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              style={[styles.dash, { backgroundColor: colors.primary }]}
            />
          ))}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashRow: {
    position: 'absolute',
    height: 3,
    overflow: 'hidden',
  },
  dashTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dash: {
    width: 10,
    height: 3,
    borderRadius: 2,
    opacity: 0.45,
  },
});
