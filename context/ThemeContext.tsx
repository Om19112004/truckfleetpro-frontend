import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  primary: string;
  primaryDark: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  input: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  // Soft tint backgrounds for badges/icon chips (paired with the solid tone above).
  primarySoft: string;
  successSoft: string;
  warningSoft: string;
  dangerSoft: string;
  infoSoft: string;
  // Stronger border for emphasis (dividers that need to stand out slightly more).
  borderStrong: string;
  // Scrim behind sheets/drawers/modals.
  overlay: string;
  // Constant shadow tint used across both themes (opacity is varied per-platform at the call site).
  shadow: string;
};

const lightColors: ThemeColors = {
  background: '#F2F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#0B7285',
  primaryDark: '#075985',
  text: '#12212B',
  textSecondary: '#52636D',
  textMuted: '#84939B',
  border: '#D9E2E6',
  input: '#F7FAFB',
  success: '#138A72',
  warning: '#C47A16',
  danger: '#C54848',
  info: '#187C9B',
  primarySoft: '#E2F3F1',
  successSoft: '#E4F5EF',
  warningSoft: '#FBF0DD',
  dangerSoft: '#FBECEC',
  infoSoft: '#E3F1F6',
  borderStrong: '#C3D1D6',
  overlay: 'rgba(15, 27, 32, 0.42)',
  shadow: '#0F1B20',
};

const darkColors: ThemeColors = {
  background: '#081317',
  surface: '#102126',
  surfaceElevated: '#162D33',
  card: '#12282E',
  primary: '#35B8B0',
  primaryDark: '#7AD6CB',
  text: '#F3F8F8',
  textSecondary: '#B6C8CA',
  textMuted: '#769093',
  border: '#25434A',
  input: '#0C1C20',
  success: '#47C99E',
  warning: '#E5B75D',
  danger: '#F08383',
  info: '#65C6D3',
  primarySoft: '#163B40',
  successSoft: '#123A34',
  warningSoft: '#3D3216',
  dangerSoft: '#3A2024',
  infoSoft: '#153238',
  borderStrong: '#345157',
  overlay: 'rgba(3, 9, 11, 0.62)',
  shadow: '#000000',
};

type ThemeContextType = {
  theme: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(
        'appTheme'
      );

      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.error('Load theme error:', error);
    }
  };

  const setTheme = async (newTheme: ThemeMode) => {
    try {
      setThemeState(newTheme);

      await AsyncStorage.setItem(
        'appTheme',
        newTheme
      );
    } catch (error) {
      console.error('Save theme error:', error);
    }
  };

  const isDark = theme === 'dark';

  const colors = isDark
    ? darkColors
    : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        isDark,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used inside ThemeProvider'
    );
  }

  return context;
}