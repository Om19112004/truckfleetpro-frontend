import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared action button. Every screen should use this instead of a bespoke
 * Pressable + Text pair, so press/disabled/loading feedback and visual
 * weight are identical everywhere.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const palette = getPalette(variant, colors);
  const height = size === 'sm' ? 40 : 50;
  const paddingHorizontal = size === 'sm' ? spacing.lg : spacing.xl;

  const content: ReactNode = loading ? (
    <ActivityIndicator size="small" color={palette.contentColor} />
  ) : (
    <>
      {icon && iconPosition === 'left' && (
        <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={palette.contentColor} />
      )}
      <Text
        style={[
          typography.bodyStrong,
          { color: palette.contentColor, fontSize: size === 'sm' ? 13 : 14 },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {icon && iconPosition === 'right' && (
        <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={palette.contentColor} />
      )}
    </>
  );

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          paddingHorizontal,
          backgroundColor: palette.background,
          borderWidth: palette.borderWidth,
          borderColor: palette.borderColor,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.contentRow}>{content}</View>
    </Pressable>
  );
}

function getPalette(variant: ButtonVariant, colors: ReturnType<typeof useTheme>['colors']) {
  switch (variant) {
    case 'primary':
      return { background: colors.primary, borderWidth: 0, borderColor: 'transparent', contentColor: '#FFFFFF' };
    case 'danger':
      return { background: colors.danger, borderWidth: 0, borderColor: 'transparent', contentColor: '#FFFFFF' };
    case 'secondary':
      return { background: colors.surface, borderWidth: 1, borderColor: colors.border, contentColor: colors.text };
    case 'ghost':
      return { background: 'transparent', borderWidth: 0, borderColor: 'transparent', contentColor: colors.primary };
    default:
      return { background: colors.primary, borderWidth: 0, borderColor: 'transparent', contentColor: '#FFFFFF' };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
