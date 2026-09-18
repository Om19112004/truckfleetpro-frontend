import { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';

type CardProps = {
  children: ReactNode;
  elevated?: boolean;
  padding?: keyof typeof spacing;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared card surface. `elevated` gives a slightly raised card (for hero /
 * highlighted content); the default is a flat bordered surface, matching
 * the bulk of today's cards.
 */
export function Card({ children, elevated = false, padding = 'lg', style }: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          borderColor: colors.border,
          padding: spacing[padding],
        },
        elevated && styles.elevatedShadow,
        elevated && { shadowColor: colors.shadow },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  elevatedShadow: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === 'web' ? 0.08 : 0,
    shadowRadius: Platform.OS === 'web' ? 20 : 0,
    elevation: Platform.OS === 'web' ? 0 : 3,
  },
});
