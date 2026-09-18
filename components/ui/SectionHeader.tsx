import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
};

/**
 * Shared "Section title / subtitle" header with an optional trailing
 * element (a "View all" link, a live chip, etc.) so every list section
 * across the app reads with the same rhythm.
 */
export function SectionHeader({ title, subtitle, trailing }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <Text style={[typography.h2, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  textCol: {
    flexShrink: 1,
  },
});
