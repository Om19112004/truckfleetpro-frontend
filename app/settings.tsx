import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Language, useLanguage } from '../context/LanguageContext';

export default function SettingsScreen() {
  const { theme, colors, isDark, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const styles = createStyles(colors, isDark);

  const handleLogout = async () => {
    try {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(
          language === 'hi'
            ? 'क्या आप इस अकाउंट से लॉग आउट करना चाहते हैं?'
            : 'Are you sure you want to log out of this account?'
        );

        if (!confirmed) {
          return;
        }

        await AsyncStorage.multiRemove(['authToken', 'user']);
        router.replace('/');
        return;
      }

      Alert.alert(
        language === 'hi' ? 'लॉग आउट करें?' : 'Log out?',
        language === 'hi'
          ? 'क्या आप इस अकाउंट से लॉग आउट करना चाहते हैं?'
          : 'Are you sure you want to log out of this account?',
        [
          {
            text: language === 'hi' ? 'रद्द करें' : 'Cancel',
            style: 'cancel',
          },
          {
            text: language === 'hi' ? 'लॉग आउट' : 'Log out',
            style: 'destructive',
            onPress: async () => {
              try {
                await AsyncStorage.multiRemove(['authToken', 'user']);
                router.replace('/');
              } catch (error) {
                console.error('Logout error:', error);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>{t.settings}</Text>
            <Text style={styles.subtitle}>
              Customize your TruckFleet Pro experience
            </Text>
          </View>
        </View>

        {/* Profile / Account */}
        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <Ionicons
              name="business"
              size={25}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              Fleet Owner
            </Text>

            <Text style={styles.profileRole}>
              TruckFleet Pro Account
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.textMuted}
          />
        </View>

        {/* Appearance */}
        <Text style={styles.sectionLabel}>
          {t.appearance.toUpperCase()}
        </Text>

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: isDark ? '#172F4A' : '#EAF2FF' },
              ]}
            >
              <Ionicons
                name="color-palette-outline"
                size={21}
                color={colors.primary}
              />
            </View>

            <View style={styles.settingHeaderText}>
              <Text style={styles.settingTitle}>
                {t.chooseTheme}
              </Text>

              <Text style={styles.settingDescription}>
                {isDark ? 'Dark theme selected' : 'Light theme selected'}
              </Text>
            </View>
          </View>

          <View style={styles.optionsRow}>
            <ThemeOption
              icon="sunny-outline"
              label={t.light}
              selected={theme === 'light'}
              colors={colors}
              onPress={() => setTheme('light')}
            />

            <ThemeOption
              icon="moon-outline"
              label={t.dark}
              selected={theme === 'dark'}
              colors={colors}
              onPress={() => setTheme('dark')}
            />
          </View>
        </View>

        {/* Language */}
        <Text style={styles.sectionLabel}>
          {t.language.toUpperCase()}
        </Text>

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: isDark ? '#193238' : '#E8F8F5' },
              ]}
            >
              <Ionicons
                name="language-outline"
                size={21}
                color={colors.success}
              />
            </View>

            <View style={styles.settingHeaderText}>
              <Text style={styles.settingTitle}>
                {t.chooseLanguage}
              </Text>

              <Text style={styles.settingDescription}>
                {language === 'en'
                  ? 'English selected'
                  : 'हिंदी चुनी गई है'}
              </Text>
            </View>
          </View>

          <View style={styles.optionsRow}>
            <LanguageOption
              flag="🇬🇧"
              label={t.english}
              selected={language === 'en'}
              colors={colors}
              onPress={() => setLanguage('en')}
            />

            <LanguageOption
              flag="🇮🇳"
              label={t.hindi}
              selected={language === 'hi'}
              colors={colors}
              onPress={() => setLanguage('hi')}
            />
          </View>
        </View>

        {/* Other settings */}
        <Text style={styles.sectionLabel}>
          {t.settings.toUpperCase()}
        </Text>

        <View style={styles.menuCard}>
          <SettingMenuItem
            icon="log-out-outline"
            title={language === 'hi' ? 'लॉग आउट' : 'Logout'}
            subtitle={
              language === 'hi'
                ? 'इस अकाउंट से साइन आउट करें'
                : 'Sign out from this account'
            }
            color="#DC2626"
            colors={colors}
            onPress={handleLogout}
          />
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <View style={styles.appLogo}>
            <Ionicons
              name="car-sport"
              size={22}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.appName}>
            TruckFleet Pro
          </Text>

          <Text style={styles.appVersion}>
            Smart Fleet Management
          </Text>

          <Text style={styles.versionNumber}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ThemeOption({
  icon,
  label,
  selected,
  colors,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        optionStyles.option,
        {
          backgroundColor: selected
            ? colors.primary
            : colors.input,
          borderColor: selected
            ? colors.primary
            : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={19}
        color={selected ? '#FFFFFF' : colors.textSecondary}
      />

      <Text
        style={[
          optionStyles.optionText,
          {
            color: selected
              ? '#FFFFFF'
              : colors.text,
          },
        ]}
      >
        {label}
      </Text>

      {selected && (
        <View style={optionStyles.check}>
          <Ionicons
            name="checkmark"
            size={12}
            color={colors.primary}
          />
        </View>
      )}
    </Pressable>
  );
}

function LanguageOption({
  flag,
  label,
  selected,
  colors,
  onPress,
}: {
  flag: string;
  label: string;
  selected: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        optionStyles.option,
        {
          backgroundColor: selected
            ? colors.primary
            : colors.input,
          borderColor: selected
            ? colors.primary
            : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text style={optionStyles.flag}>{flag}</Text>

      <Text
        style={[
          optionStyles.optionText,
          {
            color: selected
              ? '#FFFFFF'
              : colors.text,
          },
        ]}
      >
        {label}
      </Text>

      {selected && (
        <View style={optionStyles.check}>
          <Ionicons
            name="checkmark"
            size={12}
            color={colors.primary}
          />
        </View>
      )}
    </Pressable>
  );
}

function SettingMenuItem({
  icon,
  title,
  subtitle,
  color,
  colors,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={optionStyles.menuItem}
      onPress={onPress}
    >
      <View
        style={[
          optionStyles.menuIcon,
          { backgroundColor: `${color}18` },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={color}
        />
      </View>

      <View style={optionStyles.menuText}>
        <Text
          style={[
            optionStyles.menuTitle,
            { color: colors.text },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            optionStyles.menuSubtitle,
            { color: colors.textMuted },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean
) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingTop: 48,
      paddingHorizontal: 18,
      paddingBottom: 45,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },

    backButton: {
      width: 43,
      height: 43,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 12,
    },

    headerText: {
      flex: 1,
    },

    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: -0.5,
    },

    subtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 4,
    },

    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 27,
    },

    profileIcon: {
      width: 49,
      height: 49,
      borderRadius: 16,
      backgroundColor: colors.primaryDark,
      alignItems: 'center',
      justifyContent: 'center',
    },

    profileInfo: {
      flex: 1,
      marginLeft: 12,
    },

    profileName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '900',
    },

    profileRole: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 3,
    },

    sectionLabel: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1.1,
      marginBottom: 9,
      marginLeft: 3,
    },

    settingCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 22,
    },

    settingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    settingIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    settingHeaderText: {
      flex: 1,
      marginLeft: 11,
    },

    settingTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '900',
    },

    settingDescription: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 3,
    },

    optionsRow: {
      flexDirection: 'row',
      gap: 9,
      marginTop: 15,
    },

    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },

    menuDivider: {
      height: 1,
      backgroundColor: colors.border,
    },

    appInfo: {
      alignItems: 'center',
      marginTop: 32,
    },

    appLogo: {
      width: 47,
      height: 47,
      borderRadius: 15,
      backgroundColor: colors.primaryDark,
      alignItems: 'center',
      justifyContent: 'center',
    },

    appName: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '900',
      marginTop: 10,
    },

    appVersion: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 3,
    },

    versionNumber: {
      color: colors.textMuted,
      fontSize: 8,
      marginTop: 8,
    },
  });

const optionStyles = StyleSheet.create({
  option: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  optionText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },

  flag: {
    fontSize: 17,
  },

  check: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  menuItem: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuText: {
    flex: 1,
    marginLeft: 11,
  },

  menuTitle: {
    fontSize: 12,
    fontWeight: '900',
  },

  menuSubtitle: {
    fontSize: 9,
    marginTop: 3,
  },
});