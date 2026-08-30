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
};

const lightColors: ThemeColors = {
  background: '#F3F6FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  input: '#F8FAFC',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0891B2',
};

const darkColors: ThemeColors = {
  background: '#07111F',
  surface: '#0D1B2A',
  surfaceElevated: '#122337',
  card: '#102235',
  primary: '#3B82F6',
  primaryDark: '#60A5FA',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#7C8DA3',
  border: '#1E344B',
  input: '#0A1828',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#22D3EE',
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