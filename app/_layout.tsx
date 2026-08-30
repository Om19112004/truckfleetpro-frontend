import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="dashboard"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="add-truck"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="add-driver"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="settings"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </LanguageProvider>
    </ThemeProvider>
  );
}