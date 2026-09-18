import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';

type HeaderProps = {
  showMenuButton: boolean;
  menuOpen: boolean;
  onMenuPress: () => void;
  notificationCount: number;
  onNotificationsPress: () => void;
  onSettingsPress: () => void;
};

export function Header({
  showMenuButton,
  menuOpen,
  onMenuPress,
  notificationCount,
  onNotificationsPress,
  onSettingsPress,
}: HeaderProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.bar}>
      {showMenuButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={onMenuPress}
        >
          <Ionicons name={menuOpen ? 'close' : 'menu'} size={21} color={colors.text} />
        </Pressable>
      ) : (
        <View />
      )}

      <View style={styles.right}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={onNotificationsPress}
        >
          <Ionicons name="notifications-outline" size={19} color={colors.text} />
          {notificationCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={onSettingsPress}
        >
          <Ionicons name="settings-outline" size={19} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    bar: {
      height: Platform.OS === 'web' ? 68 : 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      zIndex: 100,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.7,
    },
    badge: {
      position: 'absolute',
      minWidth: 16,
      height: 16,
      paddingHorizontal: 3,
      borderRadius: 8,
      top: 4,
      right: 5,
      borderWidth: 1.5,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontWeight: '900',
    },
  });
