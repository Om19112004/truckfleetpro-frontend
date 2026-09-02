import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';

type ActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  onPress?: () => void;
};



export default function DashboardScreen() {
 const [truckCount, setTruckCount] = useState(0);
const [totalTrips, setTotalTrips] = useState(0);
const [expiringDocuments, setExpiringDocuments] = useState(0);
const [refreshing, setRefreshing] = useState(false);
const [activeTrip, setActiveTrip] = useState<any>(null);
 const [userName, setUserName] = useState('Fleet Owner');

  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
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
    tripCompleted: language === 'hi' ? 'ट्रिप पूरी हुई' : 'Trip completed',
    fuelExpenseAdded:
      language === 'hi' ? 'ईंधन खर्च जोड़ा गया' : 'Fuel expense added',
    maintenanceDue:
      language === 'hi' ? 'रखरखाव बाकी है' : 'Maintenance due',
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
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <View style={styles.brandArea}>
            <View style={styles.logo}>
              <Ionicons
                name="car-sport"
                size={23}
                color="#FFFFFF"
              />
            </View>

            <View>
              <Text style={styles.brandName}>
                TruckFleet
                <Text style={styles.brandAccent}> Pro</Text>
              </Text>

              <Text style={styles.brandCaption}>
                FLEET MANAGEMENT
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [
                styles.headerActionButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/settings')}
            >
              <Ionicons
                name="settings-outline"
                size={21}
                color={colors.text}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.headerActionButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons
                name="notifications-outline"
                size={21}
                color={colors.text}
              />

              {expiringDocuments > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {expiringDocuments > 9 ? '9+' : expiringDocuments}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
                    
        </View>

      
        {/* GREETING */}
        <View style={styles.greetingArea}>
          <Text style={styles.greetingTitle}>
            {language === 'hi'
              ? `वापसी पर स्वागत है, ${userName}`
              : `Welcome back, ${userName}`}
          </Text>

          <Text style={styles.greetingSubtitle}>
            {dashboardText.fleetTodaySubtitle}
          </Text>
        </View>

        {/* FLEET COMMAND CARD */}
        <View style={styles.commandCard}>
          <View style={styles.commandGlowOne} />
          <View style={styles.commandGlowTwo} />

          <View style={styles.commandHeader}>
            <View>
              <View style={styles.statusRow}>
                <View style={styles.statusPulse} />

                <Text style={styles.statusText}>
                  {t.fleetStatus} • {t.live}
                </Text>
              </View>

              <Text style={styles.commandTitle}>
                {dashboardText.yourFleetIs}
              </Text>

              <Text style={styles.commandTitleStrong}>
                {dashboardText.onTheMove}
              </Text>
            </View>

            <View style={styles.commandTruck}>
              <Ionicons
                name="car-sport"
                size={38}
                color="#FFFFFF"
              />
            </View>
          </View>

          <Text style={styles.commandDescription}>
            {dashboardText.commandDescription}
          </Text>

          <View style={styles.healthSection}>
            <View style={styles.healthTop}>
              <Text style={styles.healthLabel}>
                {t.fleetHealth}
              </Text>

              <Text style={styles.healthPercentage}>
                {fleetHealth}%
              </Text>
            </View>

            <View style={styles.healthTrack}>
              <View
                style={[
                  styles.healthProgress,
                  { width: `${fleetHealth}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.commandStats}>
            <View style={styles.commandStat}>
              <Ionicons
                name="car-sport-outline"
                size={16}
                color="#93C5FD"
              />

              <Text style={styles.commandStatValue}>
                {truckCount}
              </Text>

              <Text style={styles.commandStatLabel}>
                {t.trucks}
              </Text>
            </View>

            <View style={styles.commandDivider} />

            <View style={styles.commandStat}>
              <Ionicons
                name="navigate-outline"
                size={16}
                color="#6EE7B7"
              />

              <Text style={styles.commandStatValue}>
                08
              </Text>

              <Text style={styles.commandStatLabel}>
                {t.activeTrips}
              </Text>
            </View>

            <View style={styles.commandDivider} />

            <View style={styles.commandStat}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color="#FCD34D"
              />

              <Text style={styles.commandStatValue}>
                03
              </Text>

              <Text style={styles.commandStatLabel}>
                {t.serviceDue}
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION TITLE */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {t.fleetSnapshot}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {t.todaysOverview}
            </Text>
          </View>

          <View style={styles.liveChip}>
            <View style={styles.liveChipDot} />

            <Text style={styles.liveChipText}>
              {t.live}
            </Text>
          </View>
        </View>

        {/* METRICS */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="car-sport-outline"
            value={String(truckCount)}
            label={t.totalTrucks}
            caption={t.vehicles}
            color="#2563EB"
            bg={isDark ? "#122A45" : "#EAF2FF"}
          />

          <MetricCard
            icon="navigate-outline"
            value={String(totalTrips)}
            label={language === 'hi' ? 'कुल ट्रिप्स' : 'Total Trips'}
            caption={language === 'hi' ? 'सभी ट्रिप्स' : 'All trips'}
            color="#059669"
            bg={isDark ? "#123329" : "#E8FAF3"}
          />

          <MetricCard
            icon="document-text-outline"
            value={String(expiringDocuments)}
            label={t.expiringSoon}
            caption={t.documents}
            color="#DC2626"
            bg={isDark ? "#3A1D23" : "#FFF0F0"}
          />
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {t.quickActions}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {t.commonOperations}
            </Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <ActionCard
            icon="add-circle"
            title={t.addTruck}
            subtitle={t.registerVehicle}
            color="#2563EB"
            bg="#EAF2FF"
            onPress={() => router.push('/add-truck')}
          />

          <ActionCard
            icon="person-add"
            title={t.addDriver}
            subtitle={t.registerDriver}
            color="#7C3AED"
            bg={isDark ? "#2B2143" : "#F3E8FF"}
            onPress={() => router.push('/add-driver')}
          />

<ActionCard
  icon="car-sport"
  title={language === 'hi' ? 'ट्रक' : 'Trucks'}
  subtitle={language === 'hi' ? 'सभी ट्रक देखें' : 'View all trucks'}
  color="#2563EB"
  bg={isDark ? "#172F4A" : "#EAF2FF"}
  onPress={() => router.push('/trucks')}
/>


          <ActionCard
            icon="people"
            title={language === 'hi' ? 'ड्राइवर' : 'Drivers'}
            subtitle={language === 'hi' ? 'ड्राइवर देखें' : 'View drivers'}
            color="#2563EB"
            bg={isDark ? "#172F4A" : "#EAF2FF"}
            onPress={() => router.push('/drivers')}
          />

         
        </View>

        {/* ACTIVE TRIP */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {t.liveTrip}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {t.currentlyOnRoad}
            </Text>
          </View>

          <Pressable onPress={() => router.push('/trips')}>
            <Text style={styles.viewAll}>
              {t.viewAll}
            </Text>
          </Pressable>
        </View>

        {activeTrip ? (
          <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <View style={styles.tripVehicle}>
                <View style={styles.tripVehicleIcon}>
                  <Ionicons
                    name="car-sport"
                    size={22}
                    color="#2563EB"
                  />
                </View>

                <View>
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

              <View style={styles.onRoadChip}>
                <View style={styles.onRoadDot} />

                <Text style={styles.onRoadText}>
                  {t.onRoad}
                </Text>
              </View>
            </View>

            <View style={styles.routeBox}>
              <View style={styles.routeLocation}>
                <View style={styles.originDot} />

                <View>
                  <Text style={styles.routeCaption}>
                    {t.from}
                  </Text>

                  <Text style={styles.routeCity}>
                    {activeTrip.from || activeTrip.origin || '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.routeVisual}>
                <View style={styles.routeLineLeft} />

                <View style={styles.routeArrow}>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color="#FFFFFF"
                  />
                </View>

                <View style={styles.routeLineRight} />
              </View>

              <View style={styles.routeLocation}>
                <View style={styles.destinationDot} />

                <View>
                  <Text style={styles.routeCaption}>
                    {t.to}
                  </Text>

                  <Text style={styles.routeCity}>
                    {activeTrip.to || activeTrip.destination || '--'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.tripBottom}>
              <View style={styles.tripInfoItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textSecondary}
                />

                <Text style={styles.tripInfoText}>
                  {t.inProgress}
                </Text>
              </View>

              <Pressable
                style={styles.tripDetailsButton}
                onPress={() => {
                  if (!activeTrip?._id) return;

                  router.push({
                    pathname: '/trip-details',
                    params: {
                      tripId: activeTrip._id,
                    },
                  });
                }}
              >
                <Text style={styles.tripDetailsText}>
                  {t.tripDetails}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color="#2563EB"
                />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyTripCard}>
            <Ionicons
              name="navigate-outline"
              size={26}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTripTitle}>
              {language === 'hi' ? 'कोई लाइव ट्रिप नहीं' : 'No live trip'}
            </Text>
            <Text style={styles.emptyTripSubtitle}>
              {language === 'hi'
                ? 'अभी कोई ट्रिप रोड पर नहीं है।'
                : 'No trip is currently on the road.'}
            </Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Ionicons
              name="car-sport"
              size={13}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.footerText}>
            TruckFleet Pro
          </Text>

          <View style={styles.footerDot} />

          <Text style={styles.footerText}>
            Smart Fleet Management
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function MetricCard({
  icon,
  value,
  label,
  caption,
  color,
  bg,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  caption: string;
  color: string;
  bg: string;
}) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <View
          style={[
            styles.metricIcon,
            { backgroundColor: bg },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={color}
          />
        </View>

        <View
          style={[
            styles.metricStatus,
            { backgroundColor: bg },
          ]}
        >
          <View
            style={[
              styles.metricStatusDot,
              { backgroundColor: color },
            ]}
          />
        </View>
      </View>

      <Text style={styles.metricValue}>
        {value}
      </Text>

      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text style={styles.metricCaption}>
        {caption}
      </Text>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  color,
  bg,
  onPress,
}: ActionProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: bg },
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={color}
        />
      </View>

      <Text style={styles.actionTitle}>
        {title}
      </Text>

      <Text style={styles.actionSubtitle}>
        {subtitle}
      </Text>

      <View style={styles.actionArrow}>
        <Ionicons
          name="arrow-forward"
          size={13}
          color={color}
        />
      </View>
    </Pressable>
  );
}

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean
) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingTop: 48,
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },

  /* TOP BAR */

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  brandName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  brandAccent: {
    color: '#2563EB',
  },

  brandCaption: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 2,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  headerActionButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  notificationBadge: {
    position: 'absolute',
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    right: 6,
    top: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    lineHeight: 9,
  },

  /* GREETING */

  greetingArea: {
    marginTop: 25,
    marginBottom: 20,
  },

  greetingSmall: {
    color: '#2563EB',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  greetingTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 5,
  },

  greetingSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  /* COMMAND CARD */

  commandCard: {
    backgroundColor: '#0B1D36',
    borderRadius: 25,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 28,
  },

  commandGlowOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#153B68',
    right: -90,
    top: -70,
    opacity: 0.5,
  },

  commandGlowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#102F55',
    left: -65,
    bottom: -70,
    opacity: 0.7,
  },

  commandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusPulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
    marginRight: 7,
  },

  statusText: {
    color: '#93C5FD',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  commandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 14,
  },

  commandTitleStrong: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },

  commandDescription: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
    maxWidth: 270,
  },

  commandTruck: {
    width: 57,
    height: 57,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  healthSection: {
    marginTop: 21,
  },

  healthTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },

  healthLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  healthPercentage: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  healthTrack: {
    height: 7,
    borderRadius: 5,
    backgroundColor: '#193554',
    overflow: 'hidden',
  },

  healthProgress: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#34D399',
  },

  commandStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 19,
  },

  commandStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  commandStatValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 6,
  },

  commandStatLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    marginLeft: 3,
  },

  commandDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#27415F',
    marginHorizontal: 9,
  },

  /* SECTION */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  viewAll: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '900',
  },

  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#123329' : '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  liveChipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },

  liveChipText: {
    color: '#059669',
    fontSize: 7,
    fontWeight: '900',
  },

  /* METRICS */

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 27,
  },

  metricCard: {
    width: '48.3%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricStatus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  metricValue: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 13,
  },

  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },

  metricCaption: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  /* ACTIONS */

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 27,
  },

  actionCard: {
    width: '31.6%',
    minHeight: 125,
    backgroundColor: colors.surface,
    borderRadius: 17,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  actionTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },

  actionSubtitle: {
    color: colors.textMuted,
    fontSize: 8,
    marginTop: 3,
  },

  actionArrow: {
    position: 'absolute',
    right: 9,
    bottom: 9,
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* TRIP */

  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 27,
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
  },

  tripVehicleIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  vehicleNumber: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },

  vehicleDriver: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },

  onRoadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#123329' : '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },

  onRoadDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },

  onRoadText: {
    color: '#059669',
    fontSize: 7,
    fontWeight: '900',
  },

  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 19,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  routeLocation: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  originDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2563EB',
    marginRight: 8,
  },

  destinationDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },

  routeCaption: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: '900',
  },

  routeCity: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },

  routeVisual: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 7,
  },

  routeLineLeft: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  routeLineRight: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  routeArrow: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tripBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  tripInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tripInfoText: {
    color: colors.textSecondary,
    fontSize: 9,
    marginLeft: 5,
  },

  tripDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tripDetailsText: {
    color: '#2563EB',
    fontSize: 9,
    fontWeight: '900',
    marginRight: 3,
  },

  /* ACTIVITY */

  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityContent: {
    flex: 1,
    marginLeft: 11,
  },

  activityTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },

  activityDetail: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },

  activityTime: {
    color: colors.textMuted,
    fontSize: 8,
    marginLeft: 6,
  },

  emptyTripCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTripTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 9,
  },

  emptyTripSubtitle: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },

  /* FOOTER */

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },

  footerLogo: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },

  footerText: {
    color: colors.textMuted,
    fontSize: 8,
  },

  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
});