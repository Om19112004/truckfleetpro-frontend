import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { FleetHero } from '../FleetHero';
import { MAIN_NAV, SETTINGS_ROUTE } from './navigation';
const SIDEBAR_WIDTH = 272;

type SidebarProps = {
  variant: 'persistent' | 'overlay';
  activeRoute: string;
  language: 'en' | 'hi';
  onNavigate?: () => void; // called after any nav press, so the overlay can close itself
};

export function Sidebar({ variant, activeRoute, language, onNavigate }: SidebarProps) {
  const { colors } = useTheme();
  const hi = language === 'hi';
  const styles = createStyles(colors);

  const entrance = useSharedValue(variant === 'persistent' ? 1 : 0);

  useEffect(() => {
    if (variant === 'overlay') {
      entrance.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    }
  }, [variant]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateX: (1 - entrance.value) * -16 }],
  }));

  const navigate = (route: string) => {
    router.push(route as any);
    onNavigate?.();
  };

  const containerStyle = [
    styles.base,
    variant === 'persistent' ? styles.persistent : styles.overlay,
  ];

  return (
    <Animated.View style={[containerStyle, variant === 'overlay' && entranceStyle]}>
      <View style={styles.brand}>
        <View style={styles.brandLogo}>
          <MaterialCommunityIcons name="truck-fast" size={21} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.brandName}>
            TruckFleet<Text style={{ color: colors.primary }}> Pro</Text>
          </Text>
          <Text style={styles.brandCaption}>
            {hi ? 'फ्लीट मैनेजमेंट' : 'FLEET MANAGEMENT'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>{hi ? 'मुख्य मेनू' : 'MAIN MENU'}</Text>

      {MAIN_NAV.map((item) => {
        const active = item.route === activeRoute;
        return (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              styles.navItem,
              active && styles.navItemActive,
              pressed && styles.pressed,
            ]}
            onPress={() => navigate(item.route)}
          >
            {item.iconSet === 'material' ? (
              <MaterialCommunityIcons
                name={item.icon as any}
                size={18}
                color={active ? '#FFFFFF' : colors.textSecondary}
              />
            ) : (
              <Ionicons
                name={item.icon as any}
                size={18}
                color={active ? '#FFFFFF' : colors.textSecondary}
              />
            )}
            <Text style={[styles.navItemText, active && styles.navItemTextActive]}>
              {hi ? item.labelHi : item.labelEn}
            </Text>
          </Pressable>
        );
      })}

     
      <Pressable
        style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
        onPress={() => navigate(SETTINGS_ROUTE)}
      >
        <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.navItemText}>{hi ? 'सेटिंग्स' : 'Settings'}</Text>
      </Pressable>

      <View style={styles.bottomPanel}>
        <FleetHero compact />
        <Text style={styles.tagline}>
          {hi ? 'स्मार्ट फ्लीट। बेहतर नियंत्रण।' : 'Smart fleet. Better control.'}
        </Text>
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    base: {
      width: SIDEBAR_WIDTH,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    persistent: {
      height: '100%',
    },
    overlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 120,
      elevation: 12,
      shadowColor: colors.shadow,
      shadowOpacity: 0.22,
      shadowRadius: 26,
    },

    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: spacing.lg,
      marginBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    brandLogo: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandName: {
      ...typography.h3,
      color: colors.text,
    },
    brandCaption: {
      ...typography.eyebrow,
      color: colors.textMuted,
      marginTop: 2,
    },

    sectionLabel: {
      ...typography.eyebrow,
      color: colors.textMuted,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },

    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    navItemActive: {
      backgroundColor: colors.primary,
    },
    navItemText: {
      ...typography.bodyStrong,
      color: colors.textSecondary,
    },
    navItemTextActive: {
      color: '#FFFFFF',
    },
    pressed: {
      opacity: 0.72,
    },

    quickGrid: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    quickAction: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    quickIcon: {
      width: 30,
      height: 30,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickText: {
      ...typography.caption,
      color: colors.text,
      flexShrink: 1,
    },

    bottomPanel: {
      marginTop: 'auto',
      alignItems: 'center',
      paddingVertical: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.background,
    },
    tagline: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
    },
  });

export { SIDEBAR_WIDTH };
