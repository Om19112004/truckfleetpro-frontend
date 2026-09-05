import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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

  const styles = createStyles(colors, isDark);
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
      ['active', 'available'].includes(
        String(truck.status || '').toLowerCase()
      )
  ).length;

  const inactiveTrucks = trucks.length - activeTrucks;

  const getTruckNumber = (truck: Truck) =>
    truck.registrationNumber ||
    truck.vehicleNumber ||
    truck.name ||
    (hi ? 'बिना नंबर का ट्रक' : 'Unnamed Truck');

  const getTruckType = (truck: Truck) =>
    truck.truckType ||
    truck.type ||
    truck.model ||
    (hi ? 'ट्रक' : 'Truck');

  const getTruckTripCount = (truck: Truck) => {
    const truckId = truck._id || truck.id;
    return truckId ? tripCounts[String(truckId)] || 0 : 0;
  };

  const getStatus = (truck: Truck) => {
    const status = String(truck.status || '').toLowerCase();

    if (
      truck.isActive === true ||
      status === 'active' ||
      status === 'available'
    ) {
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

    const days = Math.ceil(
      (date.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (days < 0) return 'expired';
    if (days <= 30) return 'soon';

    return 'valid';
  };

  /*
   * OPEN TRUCK DETAILS
   *
   * This is the important new function.
   * Every truck card uses this function.
   */
  const openTruckDetails = (truck: Truck) => {
    const truckId = truck._id || truck.id;

    if (!truckId) {
      Alert.alert(
        hi ? 'ट्रक ID नहीं मिली' : 'Truck ID missing',
        hi
          ? 'इस ट्रक की details नहीं खोली जा सकती।'
          : 'Unable to open this truck details.'
      );

      return;
    }

    router.push({
      pathname: '/truck-details',
      params: {
        truckId: String(truckId),
      },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color={colors.text}
              />
            </Pressable>

            <View>
              <Text style={styles.headerTitle}>
                {hi ? 'ट्रक' : 'Trucks'}
              </Text>

              <Text style={styles.headerSubtitle}>
                {hi
                  ? 'अपनी फ्लीट मैनेज करें'
                  : 'Manage your fleet'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/add-truck')}
          >
            <Ionicons
              name="add"
              size={22}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="car-sport-outline"
              size={30}
              color={colors.primary}
            />
          </View>

          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              {hi
                ? 'फ्लीट कमांड सेंटर'
                : 'Fleet Command Center'}
            </Text>

            <Text style={styles.heroSubtitle}>
              {hi
                ? 'अपने सभी ट्रकों की स्थिति और जरूरी जानकारी एक जगह देखें।'
                : 'Monitor your trucks, status and important vehicle information in one place.'}
            </Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatCard
            icon="car-outline"
            label={hi ? 'कुल ट्रक' : 'Total Trucks'}
            value={trucks.length}
            colors={colors}
            styles={styles}
          />

          <StatCard
            icon="checkmark-circle-outline"
            label={hi ? 'सक्रिय' : 'Active'}
            value={activeTrucks}
            colors={colors}
            styles={styles}
          />

          <StatCard
            icon="pause-circle-outline"
            label={hi ? 'निष्क्रिय' : 'Inactive'}
            value={inactiveTrucks}
            colors={colors}
            styles={styles}
          />
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              hi
                ? 'नंबर, मॉडल या प्रकार से खोजें...'
                : 'Search by number, model or type...'
            }
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        {/* SECTION */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {hi ? 'आपके ट्रक' : 'Your Trucks'}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredTrucks.length}{' '}
              {hi
                ? 'ट्रक दिखाई दे रहे हैं'
                : 'trucks showing'}
            </Text>
          </View>

          <View style={styles.livePill}>
            <View style={styles.liveDot} />

            <Text style={styles.liveText}>
              LIVE
            </Text>
          </View>
        </View>

        {/* LOADING */}
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.stateTitle}>
              {hi
                ? 'ट्रक लोड हो रहे हैं'
                : 'Loading trucks'}
            </Text>

            <Text style={styles.stateSubtitle}>
              {hi
                ? 'कृपया कुछ सेकंड प्रतीक्षा करें...'
                : 'Please wait a moment...'}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="cloud-offline-outline"
                size={29}
                color={colors.danger}
              />
            </View>

            <Text style={styles.stateTitle}>
              {hi
                ? 'ट्रक लोड नहीं हो सके'
                : 'Unable to load trucks'}
            </Text>

            <Text style={styles.stateSubtitle}>
              {error}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => getTrucks(true)}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.actionButtonText}>
                {hi
                  ? 'फिर से कोशिश करें'
                  : 'Try Again'}
              </Text>
            </Pressable>
          </View>
        ) : filteredTrucks.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  search.trim()
                    ? 'search-outline'
                    : 'car-outline'
                }
                size={30}
                color={colors.primary}
              />
            </View>

            <Text style={styles.stateTitle}>
              {search.trim()
                ? hi
                  ? 'कोई ट्रक नहीं मिला'
                  : 'No trucks found'
                : hi
                  ? 'अभी कोई ट्रक नहीं है'
                  : 'No trucks yet'}
            </Text>

            <Text style={styles.stateSubtitle}>
              {search.trim()
                ? hi
                  ? 'अपनी search बदलकर फिर कोशिश करें।'
                  : 'Try changing your search.'
                : hi
                  ? 'अपनी फ्लीट शुरू करने के लिए पहला ट्रक जोड़ें।'
                  : 'Add your first truck to start building your fleet.'}
            </Text>

            {!search.trim() && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.push('/add-truck')}
              >
                <Ionicons
                  name="add"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.actionButtonText}>
                  {hi ? 'ट्रक जोड़ें' : 'Add Truck'}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* TRUCK LIST */
          <View style={styles.list}>
            {filteredTrucks.map((truck, index) => {
              const status = getStatus(truck);
              const active = status === 'active';

              const insuranceState =
                getExpiryState(
                  truck.insuranceExpiry
                );

              const fitnessState =
                getExpiryState(
                  truck.fitnessExpiry
                );

              return (
                <Pressable
                  key={
                    truck._id ||
                    truck.id ||
                    `${getTruckNumber(truck)}-${index}`
                  }
                  style={({ pressed }) => [
                    styles.truckCard,
                    pressed && styles.pressed,
                  ]}
                  onPress={() =>
                    openTruckDetails(truck)
                  }
                >
                  {/* TOP */}
                  <View style={styles.truckTop}>
                    <View style={styles.truckIcon}>
                      <Ionicons
                        name="car-sport"
                        size={27}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.truckIdentity}>
                      <Text
                        style={styles.truckNumber}
                        numberOfLines={1}
                      >
                        {getTruckNumber(truck)}
                      </Text>

                      <Text
                        style={styles.truckType}
                        numberOfLines={1}
                      >
                        {getTruckType(truck)}
                      </Text>

                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: active
                                ? colors.success
                                : colors.textMuted,
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: active
                                ? colors.success
                                : colors.textMuted,
                            },
                          ]}
                        >
                          {active
                            ? hi
                              ? 'सक्रिय'
                              : 'ACTIVE'
                            : hi
                              ? 'निष्क्रिय'
                              : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.vehicleBadge}>
                      <Text style={styles.vehicleBadgeText}>
                        {hi ? 'फ्लीट' : 'FLEET'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* DETAILS */}
                  <View style={styles.detailsGrid}>
                    <DetailItem
                      icon="cube-outline"
                      label={
                        hi
                          ? 'क्षमता'
                          : 'CAPACITY'
                      }
                      value={
                        truck.capacity
                          ? `${truck.capacity} ${
                              hi ? 'टन' : 'Tons'
                            }`
                          : '--'
                      }
                      colors={colors}
                      styles={styles}
                    />

                    <DetailItem
                      icon="construct-outline"
                      label={
                        hi ? 'मॉडल' : 'MODEL'
                      }
                      value={truck.model || '--'}
                      colors={colors}
                      styles={styles}
                    />
                  </View>

                  <View style={styles.detailsGrid}>
                    <ExpiryItem
                      icon="shield-checkmark-outline"
                      label={
                        hi
                          ? 'बीमा'
                          : 'INSURANCE'
                      }
                      value={formatDate(
                        truck.insuranceExpiry
                      )}
                      state={insuranceState}
                      colors={colors}
                      styles={styles}
                    />

                    <DetailItem
                      icon="navigate-outline"
                      label={
                        hi
                          ? 'कुल ट्रिप्स'
                          : 'TOTAL TRIPS'
                      }
                      value={String(getTruckTripCount(truck))}
                      colors={colors}
                      styles={styles}
                    />
                  </View>

                  <View style={styles.detailsGrid}>
                    <ExpiryItem
                      icon="document-text-outline"
                      label={
                        hi
                          ? 'फिटनेस'
                          : 'FITNESS'
                      }
                      value={formatDate(
                        truck.fitnessExpiry
                      )}
                      state={fitnessState}
                      colors={colors}
                      styles={styles}
                    />

                    <View style={styles.detailItem}>
                      <Ionicons
                        name="navigate-circle-outline"
                        size={17}
                        color={colors.textSecondary}
                      />

                      <View style={styles.detailText}>
                        <Text style={styles.detailLabel}>
                          {hi ? 'स्थिति' : 'TRIP STATUS'}
                        </Text>

                        <Text
                          style={styles.detailValue}
                          numberOfLines={1}
                        >
                          {getTruckTripCount(truck) > 0
                            ? hi
                              ? 'ट्रिप रिकॉर्ड उपलब्ध'
                              : 'Trip history available'
                            : hi
                              ? 'अभी कोई ट्रिप नहीं'
                              : 'No trips yet'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ALERTS */}
                  {(insuranceState === 'expired' ||
                    fitnessState === 'expired' ||
                    insuranceState === 'soon' ||
                    fitnessState === 'soon') && (
                    <View style={styles.warningBanner}>
                      <Ionicons
                        name="warning-outline"
                        size={17}
                        color={colors.warning}
                      />

                      <Text style={styles.warningText}>
                        {insuranceState ===
                          'expired' ||
                        fitnessState === 'expired'
                          ? hi
                            ? 'कुछ वाहन दस्तावेज़ expire हो चुके हैं'
                            : 'Some vehicle documents have expired'
                          : hi
                            ? 'कुछ वाहन दस्तावेज़ जल्द expire होंगे'
                            : 'Some vehicle documents expire soon'}
                      </Text>
                    </View>
                  )}

                  {/* ADDRESS */}
                  {Boolean(truck.address) && (
                    <View style={styles.addressRow}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={colors.textSecondary}
                      />

                      <Text
                        style={styles.addressText}
                        numberOfLines={2}
                      >
                        {truck.address}
                      </Text>
                    </View>
                  )}

                  {/* OPEN DETAILS HINT */}
                  <View style={styles.detailsHint}>
                    <Text style={styles.detailsHintText}>
                      {hi
                        ? 'पूरी जानकारी देखने के लिए टैप करें'
                        : 'Tap to view complete truck details'}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={colors.primary}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* FOOTER */}
        {!loading &&
          !error &&
          trucks.length > 0 && (
            <View style={styles.footer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.success}
              />

              <Text style={styles.footerText}>
                {hi
                  ? 'आपकी वाहन जानकारी सुरक्षित है'
                  : 'Your vehicle information is securely protected'}
              </Text>
            </View>
          )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  colors,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  colors: any;
  styles: any;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={colors.primary}
        />
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text
        style={styles.statLabel}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
  colors,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: any;
  styles: any;
}) {
  return (
    <View style={styles.detailItem}>
      <Ionicons
        name={icon}
        size={17}
        color={colors.textSecondary}
      />

      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={styles.detailValue}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ExpiryItem({
  icon,
  label,
  value,
  state,
  colors,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  state: string;
  colors: any;
  styles: any;
}) {
  const valueColor =
    state === 'expired'
      ? colors.danger
      : state === 'soon'
        ? colors.warning
        : state === 'valid'
          ? colors.success
          : colors.text;

  return (
    <View style={styles.detailItem}>
      <Ionicons
        name={icon}
        size={17}
        color={valueColor}
      />

      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.detailValue,
            { color: valueColor },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
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
      paddingBottom: 40,
    },

    header: {
      paddingTop: 52,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 13,
    },

    addButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    },

    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.97 }],
    },

    headerTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '900',
    },

    headerSubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 3,
    },

    hero: {
      marginTop: 27,
      marginHorizontal: 18,
      padding: 20,
      borderRadius: 24,
      backgroundColor: isDark
        ? '#10263D'
        : '#EAF3FF',
      borderWidth: 1,
      borderColor: isDark
        ? '#1B3C5C'
        : '#D6E8FF',
      flexDirection: 'row',
      alignItems: 'center',
    },

    heroIcon: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor: isDark
        ? '#173A5A'
        : '#D9EAFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 15,
    },

    heroText: {
      flex: 1,
    },

    heroTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
    },

    heroSubtitle: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 5,
    },

    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: 18,
      marginTop: 14,
      gap: 9,
    },

    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 12,
      minHeight: 105,
      borderWidth: 1,
      borderColor: colors.border,
    },

    statIcon: {
      width: 31,
      height: 31,
      borderRadius: 10,
      backgroundColor: isDark
        ? '#172F4A'
        : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 7,
    },

    statValue: {
      color: colors.text,
      fontSize: 21,
      fontWeight: '900',
    },

    statLabel: {
      color: colors.textMuted,
      fontSize: 8,
      fontWeight: '800',
      marginTop: 2,
    },

    searchBox: {
      marginHorizontal: 18,
      marginTop: 18,
      minHeight: 52,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 15,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
    },

    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      marginLeft: 10,
      ...(Platform.OS === 'web'
        ? ({
            outlineStyle: 'none',
            outlineWidth: 0,
          } as any)
        : {}),
    },

    sectionHeader: {
      marginTop: 25,
      marginHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
    },

    sectionSubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 3,
    },

    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      height: 29,
      borderRadius: 10,
      backgroundColor: isDark
        ? '#12352F'
        : '#ECFDF5',
    },

    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
      marginRight: 6,
    },

    liveText: {
      color: colors.success,
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.6,
    },

    list: {
      paddingHorizontal: 18,
      marginTop: 13,
      gap: 12,
    },

    truckCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 17,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: isDark ? 0.12 : 0.05,
      shadowRadius: 12,
      elevation: 3,
    },

    truckTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    truckIcon: {
      width: 55,
      height: 55,
      borderRadius: 17,
      backgroundColor: isDark
        ? '#173A5A'
        : '#E5F0FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    truckIdentity: {
      flex: 1,
      marginLeft: 12,
    },

    truckNumber: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
    },

    truckType: {
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 3,
    },

    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },

    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginRight: 6,
    },

    statusText: {
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.7,
    },

    vehicleBadge: {
      paddingHorizontal: 9,
      height: 27,
      borderRadius: 9,
      backgroundColor: isDark
        ? '#172F4A'
        : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    vehicleBadgeText: {
      color: colors.primary,
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.6,
    },

    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 15,
    },

    detailsGrid: {
      flexDirection: 'row',
      marginBottom: 13,
    },

    detailItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
      paddingRight: 8,
    },

    detailText: {
      flex: 1,
      marginLeft: 8,
      minWidth: 0,
    },

    detailLabel: {
      color: colors.textMuted,
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.7,
      marginBottom: 3,
    },

    detailValue: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '700',
    },

    warningBanner: {
      minHeight: 39,
      borderRadius: 11,
      backgroundColor: isDark
        ? '#3B2C10'
        : '#FFF8E7',
      paddingHorizontal: 11,
      flexDirection: 'row',
      alignItems: 'center',
    },

    warningText: {
      flex: 1,
      color: colors.warning,
      fontSize: 9,
      fontWeight: '800',
      marginLeft: 7,
    },

    addressRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    addressText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 10,
      lineHeight: 15,
      marginLeft: 7,
    },

    detailsHint: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    detailsHintText: {
      color: colors.primary,
      fontSize: 9,
      fontWeight: '800',
    },

    stateCard: {
      marginHorizontal: 18,
      marginTop: 15,
      paddingHorizontal: 25,
      paddingVertical: 40,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },

    emptyIcon: {
      width: 65,
      height: 65,
      borderRadius: 21,
      backgroundColor: isDark
        ? '#172F4A'
        : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,
    },

    errorIcon: {
      width: 65,
      height: 65,
      borderRadius: 21,
      backgroundColor: isDark
        ? '#3A171B'
        : '#FFF1F2',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,
    },

    stateTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
      textAlign: 'center',
    },

    stateSubtitle: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
      marginTop: 7,
      maxWidth: 290,
    },

    actionButton: {
      height: 46,
      paddingHorizontal: 19,
      borderRadius: 13,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 19,
      gap: 7,
    },

    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },

    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },

    footer: {
      marginTop: 22,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },

    footerText: {
      color: colors.textMuted,
      fontSize: 9,
      marginLeft: 6,
    },
  });