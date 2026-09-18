import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useBreakpoint } from '../../constants/breakpoints';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

type AppShellProps = {
  activeRoute: string;
  language: 'en' | 'hi';
  notificationCount?: number;
  children: ReactNode;
};

/**
 * Shared frame for every top-level screen: sidebar navigation + top bar.
 * Desktop gets a persistent sidebar column; tablet/phone get an animated
 * overlay drawer toggled from the header. The screen itself still owns its
 * own scroll view / refresh control — this component only supplies the
 * chrome around it.
 */
export function AppShell({ activeRoute, language, notificationCount = 0, children }: AppShellProps) {
  const { colors } = useTheme();
  const { isDesktop } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <View style={[styles.root, isDesktop && styles.rootRow]}>
      {isDesktop ? (
        <Sidebar variant="persistent" activeRoute={activeRoute} language={language} />
      ) : (
        sidebarOpen && (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              style={[styles.backdrop, { backgroundColor: colors.overlay }]}
              onPress={closeSidebar}
            />
            <Sidebar
              variant="overlay"
              activeRoute={activeRoute}
              language={language}
              onNavigate={closeSidebar}
            />
          </>
        )
      )}

      <View style={styles.column}>
        <Header
          showMenuButton={!isDesktop}
          menuOpen={sidebarOpen}
          onMenuPress={() => setSidebarOpen((value) => !value)}
          notificationCount={notificationCount}
          onNotificationsPress={() => {
            closeSidebar();
            router.push('/notifications');
          }}
          onSettingsPress={() => {
            closeSidebar();
            router.push('/settings');
          }}
        />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootRow: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 110,
  },
});
