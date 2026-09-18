import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
};

/**
 * Shared status pill (e.g. "On road", "Expiring soon", "Live"). Every
 * status indicator in the app should render through this so tone,
 * spacing and dot styling stay identical everywhere.
 */
export function Badge({ label, tone = 'neutral', dot = true }: BadgeProps) {
  const { colors } = useTheme();
  const palette = getPalette(tone, colors);

  return (
    <View style={[styles.base, { backgroundColor: palette.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: palette.fg }]} />}
      <Text style={[typography.label, styles.text, { color: palette.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function getPalette(tone: BadgeTone, colors: ReturnType<typeof useTheme>['colors']) {
  switch (tone) {
    case 'success':
      return { bg: colors.successSoft, fg: colors.success };
    case 'warning':
      return { bg: colors.warningSoft, fg: colors.warning };
    case 'danger':
      return { bg: colors.dangerSoft, fg: colors.danger };
    case 'info':
      return { bg: colors.infoSoft, fg: colors.info };
    case 'primary':
      return { bg: colors.primarySoft, fg: colors.primary };
    case 'neutral':
    default:
      return { bg: colors.input, fg: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  text: {
    letterSpacing: 0.4,
  },
});
