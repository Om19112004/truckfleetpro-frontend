import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { spacing } from '../constants/spacing';
import { radius } from '../constants/radius';
import { typography } from '../constants/typography';
import { useBreakpoint } from '../constants/breakpoints';
import { Card, EmptyState } from '../components/ui';

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';

type Truck = {
  _id?: string;
  id?: string;
  registrationNumber?: string;
  vehicleNumber?: string;
  name?: string;
  model?: string;
  type?: string;
  truckType?: string;
  capacity?: number | string;
  status?: string;
  isActive?: boolean;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  address?: string;
  createdAt?: string;
};

export default function TrucksScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const { isDesktop } = useBreakpoint();

  const styles = createStyles(colors);
  const hi = language === 'hi';

  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [tripCounts, setTripCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const getTripCounts = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/trips`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Get trip counts error:', data?.message);
        return;
      }

      const trips = Array.isArray(data)
        ? data
        : Array.isArray(data?.trips)
          ? data.trips
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const counts: Record<string, number> = {};

      trips.forEach((trip: any) => {
        const truckId =
          typeof trip?.truck === 'string'
            ? trip.truck
            : trip?.truck?._id || trip?.truck?.id;

        if (!truckId) return;

        const key = String(truckId);
        counts[key] = (counts[key] || 0) + 1;
      });

      setTripCounts(counts);
    } catch (err) {
      console.error('Get trip counts error:', err);
    }
  };

  const getTrucks = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError('');

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      // Load trip counts for every truck owned by this user.
      await getTripCounts(token);

      const response = await fetch(`${API_URL}/api/trucks`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (hi ? 'ट्रक लोड नहीं हो सके।' : 'Unable to load trucks.')
        );
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.trucks)
          ? data.trucks
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setTrucks(list);
    } catch (err) {
      console.error('Get trucks error:', err);

      setError(
        err instanceof Error
          ? err.message
          : hi
            ? 'ट्रक लोड नहीं हो सके।'
            : 'Unable to load trucks.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getTrucks(true);
    }, [language])
  );

  const onRefresh = () => {
    setRefreshing(true);
    getTrucks(false);
  };

  const filteredTrucks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return trucks;

    return trucks.filter((truck) => {
      const values = [
        truck.registrationNumber,
        truck.vehicleNumber,
        truck.name,
        truck.model,
        truck.type,
        truck.truckType,
        truck.status,
      ];

      return values.some((value) =>
        String(value || '').toLowerCase().includes(query)
      );
    });
  }, [trucks, search]);

  const activeTrucks = trucks.filter(
    (truck) =>
      truck.isActive === true ||
      ['active', 'available'].includes(String(truck.status || '').toLowerCase())
  ).length;

  const inactiveTrucks = trucks.length - activeTrucks;

  const getTruckNumber = (truck: Truck) =>
    truck.registrationNumber ||
    truck.vehicleNumber ||
    truck.name ||
    (hi ? 'बिना नंबर का ट्रक' : 'Unnamed Truck');

  const getTruckType = (truck: Truck) =>
    truck.truckType || truck.type || truck.model || (hi ? 'ट्रक' : 'Truck');

  const getTruckTripCount = (truck: Truck) => {
    const truckId = truck._id || truck.id;
    return truckId ? tripCounts[String(truckId)] || 0 : 0;
  };

  const getStatus = (truck: Truck) => {
    const status = String(truck.status || '').toLowerCase();

    if (truck.isActive === true || status === 'active' || status === 'available') {
      return 'active';
    }

    return 'inactive';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString(hi ? 'hi-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getExpiryState = (expiry?: string) => {
    if (!expiry) return 'unknown';

    const date = new Date(expiry);

    if (Number.isNaN(date.getTime())) return 'unknown';

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 0) return 'expired';
    if (days <= 30) return 'soon';

    return 'valid';
  };

  const openTruckDetails = (truck: Truck) => {
    const truckId = truck._id || truck.id;

    if (!truckId) {
      Alert.alert(
        hi ? 'ट्रक ID नहीं मिली' : 'Truck ID missing',
        hi ? 'इस ट्रक की details नहीं खोली जा सकती।' : 'Unable to open this truck details.'
      );

      return;
    }

    router.push({
      pathname: '/truck-details',
      params: { truckId: String(truckId) },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ================= FLEET OVERVIEW HERO ================= */}
        <FleetHero isDark={isDark} colors={colors} styles={styles}>
          <View style={styles.heroTopRow}>
            <Pressable
              style={({ pressed }) => [styles.heroIconButton, pressed && styles.pressed]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={19} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.heroAddButton, pressed && styles.pressed]}
              onPress={() => router.push('/add-truck')}
            >
              <Ionicons name="add" size={19} color={colors.primary} />
              <Text style={styles.heroAddText}>{hi ? 'ट्रक जोड़ें' : 'Add Truck'}</Text>
            </Pressable>
          </View>

          <Text style={styles.heroEyebrow}>{hi ? 'फ्लीट ओवरव्यू' : 'FLEET OVERVIEW'}</Text>
          <Text style={styles.heroTitle}>{hi ? 'आपका फ्लीट' : 'Your Fleet'}</Text>
          <Text style={styles.heroSubtitle}>
            {hi
              ? 'हर वाहन की स्थिति, क्षमता और अनुपालन एक ही जगह।'
              : 'Every vehicle — status, capacity and compliance, in one place.'}
          </Text>

          <View style={styles.heroStats}>
            <BandStat value={trucks.length} label={hi ? 'कुल वाहन' : 'Total Vehicles'} />
            <View style={styles.heroStatDivider} />
            <BandStat value={activeTrucks} label={hi ? 'सक्रिय' : 'Active'} tone={colors.success} />
            <View style={styles.heroStatDivider} />
            <BandStat value={inactiveTrucks} label={hi ? 'निष्क्रिय' : 'Inactive'} />
          </View>
        </FleetHero>

        {/* ================= TOOLBAR ================= */}
        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={hi ? 'नंबर, मॉडल या प्रकार से खोजें...' : 'Search by number, model or type...'}
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          <View style={styles.toolbarMeta}>
            <View style={styles.liveDot} />
            <Text style={styles.toolbarMetaText}>
              {filteredTrucks.length} {hi ? 'वाहन दिखाई दे रहे हैं' : 'vehicles'}
            </Text>
          </View>
        </View>

        {/* ================= STATE: LOADING ================= */}
        {loading ? (
          <Card style={styles.stateCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateTitle}>{hi ? 'ट्रक लोड हो रहे हैं' : 'Loading trucks'}</Text>
            <Text style={styles.stateSubtitle}>
              {hi ? 'कृपया कुछ सेकंड प्रतीक्षा करें...' : 'Please wait a moment...'}
            </Text>
          </Card>
        ) : error ? (
          <Card>
            <EmptyState
              icon="cloud-offline-outline"
              title={hi ? 'ट्रक लोड नहीं हो सके' : 'Unable to load trucks'}
              subtitle={error}
              actionLabel={hi ? 'फिर से कोशिश करें' : 'Try Again'}
              onAction={() => getTrucks(true)}
            />
          </Card>
        ) : filteredTrucks.length === 0 ? (
          <Card>
            <EmptyState
              icon={search.trim() ? 'search-outline' : 'car-outline'}
              title={
                search.trim()
                  ? hi
                    ? 'कोई ट्रक नहीं मिला'
                    : 'No trucks found'
                  : hi
                    ? 'अभी कोई ट्रक नहीं है'
                    : 'No trucks yet'
              }
              subtitle={
                search.trim()
                  ? hi
                    ? 'अपनी search बदलकर फिर कोशिश करें।'
                    : 'Try changing your search.'
                  : hi
                    ? 'अपनी फ्लीट शुरू करने के लिए पहला ट्रक जोड़ें।'
                    : 'Add your first truck to start building your fleet.'
              }
              actionLabel={!search.trim() ? (hi ? 'ट्रक जोड़ें' : 'Add Truck') : undefined}
              onAction={!search.trim() ? () => router.push('/add-truck') : undefined}
            />
          </Card>
        ) : (
          /* ================= VEHICLE GALLERY ================= */
          <View style={styles.gallery}>
            {filteredTrucks.map((truck, index) => {
              const active = getStatus(truck) === 'active';
              const insuranceState = getExpiryState(truck.insuranceExpiry);
              const fitnessState = getExpiryState(truck.fitnessExpiry);

              const worst =
                insuranceState === 'expired' || fitnessState === 'expired'
                  ? 'expired'
                  : insuranceState === 'soon' || fitnessState === 'soon'
                    ? 'soon'
                    : 'ok';

              const accentColor =
                worst === 'expired'
                  ? colors.danger
                  : worst === 'soon'
                    ? colors.warning
                    : active
                      ? colors.primary
                      : colors.textMuted;

              const visualTint =
                worst === 'expired'
                  ? colors.dangerSoft
                  : worst === 'soon'
                    ? colors.warningSoft
                    : active
                      ? colors.primarySoft
                      : colors.input;

              return (
                <AnimatedCardEntrance
                  key={truck._id || truck.id || `${getTruckNumber(truck)}-${index}`}
                  index={index}
                  style={isDesktop && styles.galleryItemDesktop}
                >
                  <VehicleCard
                    truck={truck}
                    active={active}
                    accentColor={accentColor}
                    visualTint={visualTint}
                    insuranceState={insuranceState}
                    fitnessState={fitnessState}
                    hi={hi}
                    colors={colors}
                    styles={styles}
                    getTruckNumber={getTruckNumber}
                    getTruckType={getTruckType}
                    getTruckTripCount={getTruckTripCount}
                    formatDate={formatDate}
                    onPress={() => openTruckDetails(truck)}
                  />
                </AnimatedCardEntrance>
              );
            })}
          </View>
        )}

        {/* ================= FOOTER ================= */}
        {!loading && !error && trucks.length > 0 && (
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.success} />
            <Text style={styles.footerText}>
              {hi ? 'आपकी वाहन जानकारी सुरक्षित है' : 'Your vehicle information is securely protected'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Large "Fleet Overview" hero. A deep-navy anchor section (matching the
 * app's established command-card tone across screens) with a restrained
 * watermark vehicle icon for visual identity — not a photo, not a 3D
 * scene, just typography, tone and one large outline icon at low opacity.
 * Fades/rises in once on mount.
 */
function FleetHero({
  isDark,
  colors,
  styles,
  children,
}: {
  isDark: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  styles: ReturnType<typeof createStyles>;
  children: ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }));

  return (
    <Animated.View
      style={[
        styles.hero,
        {
          backgroundColor: isDark ? colors.surfaceElevated : '#0B2547',
          borderBottomWidth: isDark ? 1 : 0,
          borderBottomColor: colors.border,
        },
        animatedStyle,
      ]}
    >
      <MaterialCommunityIcons
        name="truck-fast"
        size={168}
        color="#FFFFFF"
        style={styles.heroWatermark}
      />
      {children}
    </Animated.View>
  );
}

function BandStat({ value, label, tone }: { value: number; label: string; tone?: string }) {
  return (
    <View style={heroStatStyles.container}>
      <Text style={[heroStatStyles.value, tone ? { color: tone } : null]}>{value}</Text>
      <Text style={heroStatStyles.label}>{label}</Text>
    </View>
  );
}

const heroStatStyles = StyleSheet.create({
  container: {
    minWidth: 70,
  },
  value: {
    ...typography.display,
    fontSize: 26,
    color: '#FFFFFF',
  },
  label: {
    ...typography.caption,
    color: '#7895B5',
    marginTop: 3,
    fontWeight: '600',
  },
});

/**
 * A single vehicle "asset" card: a tinted visual zone up top (icon + status
 * chip) so each truck reads as a distinct fleet asset rather than a plain
 * data row, followed by identity, a compact spec strip, compliance and a
 * quiet footer. Supports a subtle web hover lift via onHoverIn/onHoverOut
 * (a real, cross-platform Pressable prop — a no-op on touch devices).
 */
function VehicleCard({
  truck,
  active,
  accentColor,
  visualTint,
  insuranceState,
  fitnessState,
  hi,
  colors,
  styles,
  getTruckNumber,
  getTruckType,
  getTruckTripCount,
  formatDate,
  onPress,
}: {
  truck: Truck;
  active: boolean;
  accentColor: string;
  visualTint: string;
  insuranceState: string;
  fitnessState: string;
  hi: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  styles: ReturnType<typeof createStyles>;
  getTruckNumber: (truck: Truck) => string;
  getTruckType: (truck: Truck) => string;
  getTruckTripCount: (truck: Truck) => number;
  formatDate: (dateString?: string) => string;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [pressed && styles.cardPressed]}
    >
      <View
        style={[
          styles.vehicleCard,
          hovered && { borderColor: colors.primary, shadowOpacity: Platform.OS === 'web' ? 0.1 : 0 },
        ]}
      >
        {/* Visual zone */}
        <View style={[styles.visualZone, { backgroundColor: visualTint }]}>
          <MaterialCommunityIcons name="truck-fast" size={44} color={accentColor} />

          <View style={styles.statusChip}>
            <View style={[styles.statusDot, { backgroundColor: active ? colors.success : colors.textMuted }]} />
            <Text style={[styles.statusChipText, { color: active ? colors.success : colors.textMuted }]}>
              {active ? (hi ? 'सक्रिय' : 'ACTIVE') : hi ? 'निष्क्रिय' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <Text style={styles.regNumber} numberOfLines={1}>
            {getTruckNumber(truck)}
          </Text>
          <Text style={styles.typeLine} numberOfLines={1}>
            {getTruckType(truck)}
          </Text>

          <View style={styles.metaStrip}>
            <MetaStat
              label={hi ? 'क्षमता' : 'CAPACITY'}
              value={truck.capacity ? `${truck.capacity} ${hi ? 'टन' : 'T'}` : '--'}
              styles={styles}
            />
            <View style={styles.metaDivider} />
            <MetaStat label={hi ? 'मॉडल' : 'MODEL'} value={truck.model || '--'} styles={styles} />
            <View style={styles.metaDivider} />
            <MetaStat
              label={hi ? 'ट्रिप्स' : 'TRIPS'}
              value={String(getTruckTripCount(truck))}
              styles={styles}
            />
          </View>

          <View style={styles.complianceRow}>
            <ComplianceChip
              label={hi ? 'बीमा' : 'Insurance'}
              value={formatDate(truck.insuranceExpiry)}
              state={insuranceState}
              colors={colors}
              styles={styles}
            />
            <ComplianceChip
              label={hi ? 'फिटनेस' : 'Fitness'}
              value={formatDate(truck.fitnessExpiry)}
              state={fitnessState}
              colors={colors}
              styles={styles}
            />
          </View>

          <View style={styles.cardFooter}>
            {truck.address ? (
              <View style={styles.addressWrap}>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {truck.address}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Subtle, capped stagger entrance for gallery cards. One-shot on mount,
 * runs on the native thread, and costs nothing once settled — not a loop.
 */
function AnimatedCardEntrance({
  index,
  style,
  children,
}: {
  index: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const delay = Math.min(index * 40, 260);
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

function MetaStat({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.metaStat}>
      <Text style={styles.metaLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ComplianceChip({
  label,
  value,
  state,
  colors,
  styles,
}: {
  label: string;
  value: string;
  state: string;
  colors: ReturnType<typeof useTheme>['colors'];
  styles: ReturnType<typeof createStyles>;
}) {
  const tone =
    state === 'expired'
      ? colors.danger
      : state === 'soon'
        ? colors.warning
        : state === 'valid'
          ? colors.success
          : colors.textMuted;

  return (
    <View style={styles.complianceChip}>
      <View style={[styles.complianceDot, { backgroundColor: tone }]} />
      <Text style={styles.complianceText} numberOfLines={1}>
        {label} <Text style={{ color: tone, fontWeight: '700' }}>{value}</Text>
      </Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: spacing.xxl,
    },
    contentDesktop: {
      maxWidth: 1180,
      width: '100%',
      alignSelf: 'center',
    },
    pressed: {
      opacity: 0.75,
    },
    cardPressed: {
      opacity: 0.92,
    },

    /* Fleet Overview hero */
    hero: {
      paddingTop: 56,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      borderBottomLeftRadius: radius.xl,
      borderBottomRightRadius: radius.xl,
      overflow: 'hidden',
    },
    heroWatermark: {
      position: 'absolute',
      top: -20,
      right: -24,
      opacity: 0.08,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroIconButton: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroAddButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: spacing.md,
      height: 40,
      borderRadius: radius.md,
    },
    heroAddText: {
      ...typography.bodyStrong,
      color: colors.primary,
      fontSize: 12.5,
    },
    heroEyebrow: {
      ...typography.eyebrow,
      color: '#8FC7FF',
      marginTop: spacing.xxl,
    },
    heroTitle: {
      ...typography.display,
      fontSize: 34,
      color: '#FFFFFF',
      marginTop: spacing.xs + 2,
    },
    heroSubtitle: {
      ...typography.body,
      color: '#AFC5DE',
      marginTop: spacing.xs + 2,
      maxWidth: 440,
    },
    heroStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xxl,
    },
    heroStatDivider: {
      width: 1,
      height: 28,
      backgroundColor: 'rgba(255,255,255,0.14)',
      marginHorizontal: spacing.lg,
    },

    /* Toolbar */
    toolbar: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchBox: {
      minHeight: 48,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
    },
    toolbarMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    liveDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.success,
    },
    toolbarMetaText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },

    /* States */
    stateCard: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      paddingVertical: spacing.xxl,
      alignItems: 'center',
    },
    stateTitle: {
      ...typography.h3,
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    stateSubtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      maxWidth: 290,
    },

    /* Gallery */
    gallery: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    galleryItemDesktop: {
      flexBasis: 300,
      flexGrow: 1,
      maxWidth: 360,
    },

    /* Vehicle card */
    vehicleCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 16,
      shadowOpacity: 0,
      elevation: 0,
    },
    visualZone: {
      height: 108,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusChip: {
      position: 'absolute',
      top: spacing.sm + 2,
      right: spacing.sm + 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusChipText: {
      ...typography.label,
      fontSize: 8.5,
    },

    cardBody: {
      paddingHorizontal: spacing.md + 2,
      paddingTop: spacing.md,
      paddingBottom: spacing.md + 2,
    },
    regNumber: {
      ...typography.h1,
      fontSize: 19,
      letterSpacing: -0.3,
      color: colors.text,
    },
    typeLine: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '600',
    },

    metaStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    metaStat: {
      flex: 1,
      minWidth: 0,
    },
    metaDivider: {
      width: 1,
      height: 26,
      backgroundColor: colors.border,
      marginHorizontal: spacing.sm,
    },
    metaLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 8,
    },
    metaValue: {
      ...typography.bodyStrong,
      color: colors.text,
      marginTop: 3,
      fontSize: 13,
    },

    complianceRow: {
      marginTop: spacing.md - 2,
      gap: 5,
    },
    complianceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    complianceDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    complianceText: {
      ...typography.bodySmall,
      color: colors.textMuted,
      fontWeight: '500',
    },

    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.md,
      paddingTop: spacing.sm + 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addressWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      minWidth: 0,
      marginRight: spacing.sm,
    },
    addressText: {
      flex: 1,
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '500',
    },

    footer: {
      marginTop: spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    footerText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '500',
    },
  });
