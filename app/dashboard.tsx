import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useBreakpoint } from '../constants/breakpoints';
import { spacing } from '../constants/spacing';
import { radius } from '../constants/radius';
import { typography } from '../constants/typography';
import { Badge, Card, EmptyState, SectionHeader } from '../components/ui';
import { FleetHero } from '../components/FleetHero';
import { AppShell } from '../components/shell/AppShell';

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';

export default function DashboardScreen() {
  const [truckCount, setTruckCount] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [expiringDocuments, setExpiringDocuments] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [userName, setUserName] = useState('Fleet Owner');

  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const { isCompact } = useBreakpoint();
  const styles = createStyles(colors, isDark);

  const dashboardText = {
    fleetTodaySubtitle:
      language === 'hi'
        ? 'आज आपके फ्लीट में क्या हो रहा है, यहाँ देखें।'
        : "Here's what's happening with your fleet today.",
    yourFleetIs: language === 'hi' ? 'आपका फ्लीट' : 'Your fleet is',
    onTheMove: language === 'hi' ? 'सक्रिय है।' : 'on the move.',
    commandDescription:
      language === 'hi'
        ? 'वाहनों, ड्राइवरों और ट्रिप्स को एक ही जगह से मैनेज करें।'
        : 'Keep track of vehicles, drivers and trips from one place.',
  };

  const fetchTruckCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/api/trucks`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTruckCount(data.count);
      }
    } catch (error) {
      console.error('Fetch truck count error:', error);
    }
  };

  const fetchExpiringDocuments = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/api/trucks`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      const trucks = Array.isArray(data)
        ? data
        : Array.isArray(data?.trucks)
          ? data.trucks
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const deadline = new Date(today);
      deadline.setDate(today.getDate() + 30);

      let count = 0;

      trucks.forEach((truck: any) => {
        ['insuranceExpiry', 'fitnessExpiry'].forEach((field) => {
          const value = truck?.[field];

          if (!value) {
            return;
          }

          const expiryDate = new Date(value);

          if (Number.isNaN(expiryDate.getTime())) {
            return;
          }

          expiryDate.setHours(0, 0, 0, 0);

          // Include expired documents and documents expiring
          // within the next 30 days.
          if (expiryDate <= deadline) {
            count += 1;
          }
        });
      });

      setExpiringDocuments(count);
    } catch (error) {
      console.error('Fetch expiring documents error:', error);
    }
  };

  const fetchActiveTrip = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/api/trips`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        const trips = Array.isArray(data) ? data : (data.trips || []);

        // Total trips for the logged-in user. Includes completed, running and scheduled trips.
        setTotalTrips(trips.length);

        const runningTrip = trips.find(
          (trip: any) => trip.status === 'running'
        );

        setActiveTrip(runningTrip || null);
      }
    } catch (error) {
      console.error('Fetch active trip error:', error);
    }
  };

  const loadUserName = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');

      if (!storedUser) {
        return;
      }

      const user = JSON.parse(storedUser);
      const rawName =
        user?.firstName ||
        user?.name ||
        user?.fullName ||
        '';

      const cleanName = String(rawName).trim();

      if (cleanName) {
        const firstName = cleanName.split(/\s+/)[0];
        setUserName(firstName || cleanName);
      }
    } catch (error) {
      console.error('Load user name error:', error);
    }
  };

  useEffect(() => {
    fetchTruckCount();
    fetchActiveTrip();
    fetchExpiringDocuments();
    loadUserName();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTruckCount(),
      fetchActiveTrip(),
      fetchExpiringDocuments(),
    ]);
    setRefreshing(false);
  };

  const operationalTrucks = truckCount > 0 ? Math.max(truckCount - 1, 0) : 0;

  const fleetHealth =
    truckCount > 0
      ? Math.round((operationalTrucks / truckCount) * 100)
      : 0;

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <AppShell activeRoute="/dashboard" language={language} notificationCount={expiringDocuments}>
        <ScrollView
          style={styles.main}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageEyebrow}>
              {language === 'hi' ? 'फ्लीट कंट्रोल सेंटर' : 'FLEET CONTROL CENTER'}
            </Text>
            <Text style={styles.pageTitle}>{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</Text>
          </View>

          <View style={styles.headerDateChip}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.headerDateText}>
              {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.greetingArea}>
          <Text style={styles.greetingTitle}>
            {language === 'hi' ? `वापसी पर स्वागत है, ${userName}` : `Welcome back, ${userName}`}
          </Text>
          <Text style={styles.greetingSubtitle}>{dashboardText.fleetTodaySubtitle}</Text>
        </View>

        {/* ================= COMMAND CARD ================= */}
        <View style={styles.commandCard}>
          <View style={[styles.commandHeader, isCompact && styles.commandHeaderCompact]}>
            <View style={styles.commandCopy}>
              <View style={styles.statusRow}>
                <View style={styles.statusPulse} />
                <Text style={styles.statusText}>
                  {t.fleetStatus} • {t.live}
                </Text>
              </View>

              <Text style={styles.commandTitle}>{dashboardText.yourFleetIs}</Text>
              <Text style={styles.commandTitleStrong}>{dashboardText.onTheMove}</Text>
              <Text style={styles.commandDescription}>{dashboardText.commandDescription}</Text>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{truckCount}</Text>
                  <Text style={styles.heroStatLabel}>{t.trucks}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{totalTrips}</Text>
                  <Text style={styles.heroStatLabel}>
                    {language === 'hi' ? 'कुल ट्रिप्स' : 'Total trips'}
                  </Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{expiringDocuments}</Text>
                  <Text style={styles.heroStatLabel}>{language === 'hi' ? 'अलर्ट' : 'Alerts'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.heroVisual}>
              <FleetHero />
              <View style={styles.heroVisualBadge}>
                <View style={styles.statusPulseSmall} />
                <Text style={styles.heroVisualBadgeText}>{t.live}</Text>
              </View>
            </View>
          </View>

          <View style={styles.healthSection}>
            <View style={styles.healthTop}>
              <View>
                <Text style={styles.healthLabel}>{t.fleetHealth}</Text>
                <Text style={styles.healthHint}>
                  {language === 'hi'
                    ? `${operationalTrucks} वाहन ऑपरेशनल`
                    : `${operationalTrucks} vehicles operational`}
                </Text>
              </View>
              <Text style={styles.healthPercentage}>{fleetHealth}%</Text>
            </View>

            <View style={styles.healthTrack}>
              <View style={[styles.healthProgress, { width: `${fleetHealth}%` }]} />
            </View>
          </View>
        </View>

        {/* ================= FLEET SNAPSHOT ================= */}
        <SectionHeader
          title={t.fleetSnapshot}
          subtitle={t.todaysOverview}
          trailing={<Badge label={t.live} tone="success" />}
        />

        <View style={[styles.metricsGrid, isCompact && styles.metricsGridCompact]}>
          <MetricCard
            icon="car-sport-outline"
            value={String(truckCount)}
            label={t.totalTrucks}
            caption={t.vehicles}
            tone="info"
            compact={isCompact}
          />
          <MetricCard
            icon="navigate-outline"
            value={String(totalTrips)}
            label={language === 'hi' ? 'कुल ट्रिप्स' : 'Total Trips'}
            caption={language === 'hi' ? 'सभी ट्रिप्स' : 'All trips'}
            tone="success"
            compact={isCompact}
          />
          <MetricCard
            icon="document-text-outline"
            value={String(expiringDocuments)}
            label={t.expiringSoon}
            caption={t.documents}
            tone="danger"
            compact={isCompact}
          />
        </View>

        {/* ================= LIVE TRIP ================= */}
        <SectionHeader
          title={t.liveTrip}
          subtitle={t.currentlyOnRoad}
          trailing={
            <Pressable
              onPress={() => router.push('/trips')}
              style={({ pressed }) => [styles.viewAllButton, pressed && styles.pressed]}
            >
              <Text style={styles.viewAllText}>{t.viewAll}</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.primary} />
            </Pressable>
          }
        />

        {activeTrip ? (
          <Card style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <View style={styles.tripVehicle}>
                <View style={[styles.tripVehicleIcon, { backgroundColor: colors.primarySoft }]}>
                  <MaterialCommunityIcons name="truck-fast" size={21} color={colors.primary} />
                </View>
                <View style={styles.tripVehicleCopy}>
                  <Text style={styles.vehicleNumber}>
                    {activeTrip.truck?.vehicleNumber ||
                      activeTrip.truck?.registrationNumber ||
                      activeTrip.truck?.truckNumber ||
                      'Truck'}
                  </Text>
                  <Text style={styles.vehicleDriver}>
                    {activeTrip.driver?.name
                      ? `${activeTrip.driver.name} • ${language === 'hi' ? 'ड्राइवर' : 'Driver'}`
                      : language === 'hi'
                        ? 'ड्राइवर असाइन नहीं है'
                        : 'Driver not assigned'}
                  </Text>
                </View>
              </View>

              <Badge label={t.onRoad} tone="success" />
            </View>

            <View style={styles.routeBox}>
              <View style={styles.routeLocation}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <View>
                  <Text style={styles.routeCaption}>{t.from}</Text>
                  <Text style={styles.routeCity}>{activeTrip.from || activeTrip.origin || '--'}</Text>
                </View>
              </View>

              <View style={styles.routeVisual}>
                <View style={styles.routeLine} />
                <View style={[styles.routeArrow, { backgroundColor: colors.primary }]}>
                  <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                </View>
                <View style={styles.routeLine} />
              </View>

              <View style={styles.routeLocation}>
                <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
                <View>
                  <Text style={styles.routeCaption}>{t.to}</Text>
                  <Text style={styles.routeCity}>{activeTrip.to || activeTrip.destination || '--'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.tripBottom}>
              <View style={styles.tripInfoItem}>
                <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.tripInfoText}>{t.inProgress}</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.tripDetailsButton, pressed && styles.pressed]}
                onPress={() => {
                  if (!activeTrip?._id) return;
                  router.push({
                    pathname: '/trip-details',
                    params: { tripId: activeTrip._id },
                  });
                }}
              >
                <Text style={styles.tripDetailsText}>{t.tripDetails}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyTripCard}>
            <EmptyState
              icon="navigate-outline"
              title={language === 'hi' ? 'कोई लाइव ट्रिप नहीं' : 'No live trip'}
              subtitle={
                language === 'hi'
                  ? 'अभी कोई ट्रिप रोड पर नहीं है।'
                  : 'No trip is currently on the road.'
              }
              actionLabel={language === 'hi' ? 'ट्रिप देखें' : 'View trips'}
              onAction={() => router.push('/trips')}
            />
          </Card>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>TruckFleet Pro</Text>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>Smart Fleet Management</Text>
        </View>
      </ScrollView>
      </AppShell>
    </View>
  );
}

function MetricCard({
  icon,
  value,
  label,
  caption,
  tone,
  compact,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  caption: string;
  tone: 'info' | 'success' | 'danger';
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const toneColor = tone === 'info' ? colors.info : tone === 'success' ? colors.success : colors.danger;
  const toneSoft =
    tone === 'info' ? colors.infoSoft : tone === 'success' ? colors.successSoft : colors.dangerSoft;

  return (
    <Card
      style={[
        metricStyles.card,
        compact ? metricStyles.cardCompact : metricStyles.cardWide,
      ]}
    >
      <View style={metricStyles.top}>
        <View style={[metricStyles.icon, { backgroundColor: toneSoft }]}>
          <Ionicons name={icon} size={19} color={toneColor} />
        </View>
        <View style={[metricStyles.statusDot, { backgroundColor: toneColor }]} />
      </View>

      <Text style={[typography.display, { color: colors.text, fontSize: 28, marginTop: spacing.md }]}>
        {value}
      </Text>
      <Text style={[typography.bodyStrong, { color: colors.text, marginTop: 2 }]}>{label}</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2, fontWeight: '500' }]}>
        {caption}
      </Text>
    </Card>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flexGrow: 1,
  },
  cardWide: {
    flexBasis: 0,
    flex: 1,
  },
  cardCompact: {
    width: '100%',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

const createStyles = (colors: ReturnType<typeof useTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    main: {
      flex: 1,
    },
    content: {
      paddingTop: spacing.lg,
      paddingHorizontal: Platform.OS === 'web' ? spacing.xxl : spacing.lg,
      paddingBottom: spacing.xxl,
      maxWidth: Platform.OS === 'web' ? 1200 : undefined,
      width: Platform.OS === 'web' ? '100%' : undefined,
      alignSelf: Platform.OS === 'web' ? 'center' : undefined,
    },
    pressed: {
      opacity: 0.75,
    },

    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.lg,
    },
    pageEyebrow: {
      ...typography.eyebrow,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    pageTitle: {
      ...typography.display,
      fontSize: 24,
      color: colors.text,
    },
    headerDateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.sm,
    },
    headerDateText: {
      ...typography.caption,
      color: colors.textSecondary,
    },

    greetingArea: {
      marginBottom: spacing.xl,
    },
    greetingTitle: {
      ...typography.display,
      fontSize: Platform.OS === 'web' ? 30 : 22,
      color: colors.text,
    },
    greetingSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },

    /* Command card */
    commandCard: {
      backgroundColor: isDark ? colors.surfaceElevated : '#0B2547',
      borderRadius: radius.xl,
      padding: Platform.OS === 'web' ? spacing.xxl : spacing.lg,
      marginBottom: spacing.xxl,
      borderWidth: 1,
      borderColor: isDark ? colors.border : '#153E6A',
    },
    commandHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xl,
    },
    commandHeaderCompact: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    commandCopy: {
      flex: 1,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    statusPulse: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    statusText: {
      ...typography.label,
      color: '#8FC7FF',
    },
    commandTitle: {
      ...typography.h1,
      color: '#FFFFFF',
      fontWeight: '600',
      marginTop: spacing.md,
    },
    commandTitleStrong: {
      ...typography.display,
      fontSize: Platform.OS === 'web' ? 36 : 26,
      color: '#FFFFFF',
    },
    commandDescription: {
      ...typography.body,
      color: '#AFC5DE',
      marginTop: spacing.sm,
      maxWidth: 480,
    },
    heroStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    heroStat: {
      minWidth: 68,
    },
    heroStatValue: {
      ...typography.h1,
      color: '#FFFFFF',
    },
    heroStatLabel: {
      ...typography.caption,
      color: '#7895B5',
      marginTop: 2,
    },
    heroStatDivider: {
      width: 1,
      height: 26,
      backgroundColor: 'rgba(255,255,255,0.14)',
      marginHorizontal: spacing.md,
    },
    heroVisual: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroVisualBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      gap: spacing.xs,
    },
    statusPulseSmall: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: '#22D3A1',
    },
    heroVisualBadgeText: {
      ...typography.label,
      color: '#9DEED3',
    },

    healthSection: {
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: isDark ? colors.border : 'rgba(255,255,255,0.12)',
    },
    healthTop: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    healthLabel: {
      ...typography.label,
      color: '#FFFFFF',
    },
    healthHint: {
      ...typography.caption,
      color: '#7895B5',
      marginTop: spacing.xs,
    },
    healthPercentage: {
      ...typography.h1,
      color: '#FFFFFF',
    },
    healthTrack: {
      height: 8,
      borderRadius: radius.sm,
      backgroundColor: 'rgba(255,255,255,0.14)',
      overflow: 'hidden',
      marginTop: spacing.sm,
    },
    healthProgress: {
      height: '100%',
      borderRadius: radius.sm,
      backgroundColor: colors.success,
    },

    /* Metrics */
    metricsGrid: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.xxl,
    },
    metricsGridCompact: {
      flexDirection: 'column',
    },

    /* Trip */
    tripCard: {
      marginBottom: spacing.xxl,
    },
    tripHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tripVehicle: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: spacing.sm,
    },
    tripVehicleIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tripVehicleCopy: {
      flex: 1,
    },
    vehicleNumber: {
      ...typography.h3,
      color: colors.text,
    },
    vehicleDriver: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
      fontWeight: '500',
    },
    routeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    routeLocation: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    routeDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
    },
    routeCaption: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 8,
    },
    routeCity: {
      ...typography.bodyStrong,
      color: colors.text,
      marginTop: 2,
    },
    routeVisual: {
      width: 56,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.sm,
    },
    routeLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    routeArrow: {
      width: 22,
      height: 22,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tripBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    tripInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    tripInfoText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tripDetailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    tripDetailsText: {
      ...typography.label,
      color: colors.primary,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
    },
    viewAllText: {
      ...typography.label,
      color: colors.primary,
    },

    emptyTripCard: {
      marginBottom: spacing.xxl,
    },

    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    footerText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '500',
    },
    footerDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
  });
