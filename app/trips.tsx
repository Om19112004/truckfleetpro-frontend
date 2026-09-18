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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';
type Trip = {
  _id?: string;
  id?: string;
  tripNumber?: number;
  from?: string;
  to?: string;
  origin?: string;
  destination?: string;
  startLocation?: string;
  endLocation?: string;
  date?: string;
  tripDate?: string;
  startDate?: string;
  endDate?: string;
  distance?: number | string;
  status?: string;
  driver?: {
    _id?: string;
    id?: string;
    name?: string;
  };
  driverName?: string;
  truck?: {
    _id?: string;
    id?: string;
    registrationNumber?: string;
  };
  truckNumber?: string;
  notes?: string;


  partyName?: string;
  freightAmount?: number | string;
  checklist?: {
    chequeReceived?: boolean;
    chequeDeposited?: boolean;
    moneyReceived?: boolean;
  };

  createdAt?: string;
};

type Driver = {
  _id?: string;
  id?: string;
  name?: string;
};

export default function TripsScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();

  const styles = createStyles(colors, isDark);
  const hi = language === 'hi';

  const params = useLocalSearchParams<{
    truckId?: string;
    driverId?: string;
    truckNumber?: string;
  }>();

  const truckId = String(params.truckId || '');
  const truckNumber = String(params.truckNumber || '');

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');

  // Trip Details
  const [partyName, setPartyName] = useState('');
  const [freightAmount, setFreightAmount] = useState('');
  const [checklist, setChecklist] = useState({
    chequeReceived: false,
    chequeDeposited: false,
    moneyReceived: false,
  });

  const [assignedDriver, setAssignedDriver] =
    useState<Driver | null>(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2600);
  };

  const getTrips = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      /*
       * We keep the endpoint flexible because the backend route
       * may later be scoped by truck.
       */
      const url = truckId
        ? `${API_URL}/api/trips?truckId=${encodeURIComponent(
            truckId
          )}`
        : `${API_URL}/api/trips`;

      const response = await fetch(url, {
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
            (hi
              ? 'ट्रिप लोड नहीं हो सकीं।'
              : 'Unable to load trips.')
        );
      }

      const list: Trip[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.trips)
          ? data.trips
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setTrips(list);
    } catch (error) {
      console.error('Trips loading error:', error);

      /*
       * If the trips API has not been implemented yet,
       * don't crash the screen. Show an empty state.
       */
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getAssignedDriver = async () => {
    /*
     * Driver assignment is already handled on Truck Details.
     * This function tries to retrieve the assigned driver from
     * the truck endpoint when the backend exposes it.
     */
    if (!truckId) return;

    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/trucks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) return;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.trucks)
          ? data.trucks
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const truck = list.find(
        (item: any) =>
          String(item?._id || item?.id || '') === truckId
      );

      if (truck?.driver) {
        setAssignedDriver(truck.driver);
      }
    } catch (error) {
      console.log('Assigned driver lookup skipped:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getTrips(true);
      getAssignedDriver();
    }, [truckId, language])
  );

  const onRefresh = () => {
    setRefreshing(true);
    getTrips(false);
    getAssignedDriver();
  };

  // Latest trip stays at the top.
  // Display numbering is calculated from the sorted list instead of
  // using backend tripNumber, so duplicate/incorrect numbers cannot appear.
  const orderedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      const aDate = new Date(
        a.createdAt || a.date || a.tripDate || a.startDate || 0
      ).getTime();

      const bDate = new Date(
        b.createdAt || b.date || b.tripDate || b.startDate || 0
      ).getTime();

      return bDate - aDate;
    });
  }, [trips]);

  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return orderedTrips;

    return orderedTrips.filter((trip) => {
      const values = [
        trip.from,
        trip.to,
        trip.origin,
        trip.destination,
        trip.startLocation,
        trip.endLocation,
        trip.driverName,
        trip.truckNumber,
        trip.status,
      ];

      return values.some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [orderedTrips, search]);

  const runningTrips = trips.filter(
    (trip) =>
      String(trip.status || '').toLowerCase() ===
      'running'
  ).length;

  const completedTrips = trips.filter(
    (trip) =>
      String(trip.status || '').toLowerCase() ===
      'completed'
  ).length;

  const resetForm = () => {
    setFrom('');
    setTo('');
    setTripDate('');
    setDistance('');
    setNotes('');
    setPartyName('');
    setFreightAmount('');
    setChecklist({
      chequeReceived: false,
      chequeDeposited: false,
      moneyReceived: false,
    });
  };

  const saveTrip = async () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert(
        hi ? 'जानकारी अधूरी है' : 'Missing information',
        hi
          ? 'कृपया From और To दोनों भरें।'
          : 'Please enter both From and To locations.'
      );
      return;
    }

    if (!tripDate.trim()) {
      Alert.alert(
        hi ? 'तारीख जरूरी है' : 'Date required',
        hi
          ? 'कृपया ट्रिप की तारीख डालें।'
          : 'Please enter the trip date.'
      );
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      const parsedDate = parseTripDate(tripDate);

      if (!parsedDate) {
        Alert.alert(
          hi ? 'गलत तारीख' : 'Invalid date',
          hi
            ? 'कृपया तारीख DD/MM/YYYY format में डालें। उदाहरण: 28/08/2026'
            : 'Please enter the date in DD/MM/YYYY format. Example: 28/08/2026'
        );
        return;
      }

      const parsedFreightAmount = freightAmount.trim()
        ? Number(freightAmount)
        : 0;

      if (
        Number.isNaN(parsedFreightAmount) ||
        parsedFreightAmount < 0
      ) {
        Alert.alert(
          hi ? 'गलत फ्रेट अमाउंट' : 'Invalid freight amount',
          hi
            ? 'कृपया सही फ्रेट अमाउंट डालें।'
            : 'Please enter a valid freight amount.'
        );
        return;
      }

      const payload = {
        truckId: truckId || undefined,
        driverId:
          assignedDriver?._id ||
          assignedDriver?.id ||
          undefined,
        from: from.trim(),
        to: to.trim(),
        startLocation: from.trim(),
        endLocation: to.trim(),
        date: parsedDate,
        tripDate: parsedDate,
        distance: distance.trim()
          ? Number(distance)
          : undefined,
        status: 'scheduled',
        notes: notes.trim() || undefined,
        partyName: partyName.trim(),
        freightAmount: parsedFreightAmount,
        checklist: {
          chequeReceived: checklist.chequeReceived,
          chequeDeposited: checklist.chequeDeposited,
          moneyReceived: checklist.moneyReceived,
        },
      };

      const response = await fetch(
        `${API_URL}/api/trips`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (hi
              ? 'ट्रिप सेव नहीं हो सकी।'
              : 'Unable to save trip.')
        );
      }

      showToast(
        'success',
        hi
          ? 'ट्रिप सफलतापूर्वक सेव हो गई'
          : 'Trip created successfully'
      );

      resetForm();
      setShowAddForm(false);
      getTrips(true);
    } catch (error) {
      console.error('Save trip error:', error);

      showToast(
        'error',
        error instanceof Error
          ? error.message
          : hi
            ? 'ट्रिप सेव करते समय समस्या हुई।'
            : 'Something went wrong while saving the trip.'
      );
    } finally {
      setSaving(false);
    }
  };

  const getTripStatus = (status?: string) => {
    const normalized = String(
      status || 'scheduled'
    ).toLowerCase();

    if (normalized === 'running') return 'running';
    if (normalized === 'completed') return 'completed';
    if (normalized === 'cancelled') return 'cancelled';

    return 'scheduled';
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return hi ? 'चल रही है' : 'RUNNING';

      case 'completed':
        return hi ? 'पूरी हो गई' : 'COMPLETED';

      case 'cancelled':
        return hi ? 'रद्द' : 'CANCELLED';

      default:
        return hi ? 'शेड्यूल' : 'SCHEDULED';
    }
  };
  const parseTripDate = (value: string) => {
  const trimmed = value.trim();

  // DD/MM/YYYY
  const match = trimmed.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (match) {
    const [, day, month, year] = match;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // YYYY-MM-DD
  const isoDate = new Date(trimmed);

  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate.toISOString();
  }

  return null;
};

  const formatDate = (value?: string) => {
    if (!value) return '--';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      hi ? 'hi-IN' : 'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  return (
    <View style={styles.screen}>
      {toast && (
        <View
          pointerEvents="none"
          style={[
            styles.toast,
            toast.type === 'success'
              ? styles.toastSuccess
              : styles.toastError,
          ]}
        >
          <Ionicons
            name={
              toast.type === 'success'
                ? 'checkmark-circle'
                : 'alert-circle'
            }
            size={21}
            color="#FFFFFF"
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

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
                {hi ? 'ट्रिप्स' : 'Trips'}
              </Text>

              <Text style={styles.headerSubtitle}>
                {truckNumber
                  ? `${truckNumber} • ${
                      hi
                        ? 'ट्रिप हिस्ट्री'
                        : 'Trip history'
                    }`
                  : hi
                    ? 'ट्रिप मैनेजमेंट'
                    : 'Trip management'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Ionicons
              name={showAddForm ? 'close' : 'add'}
              size={22}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryMain}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="navigate"
                size={28}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>
                {hi
                  ? 'ट्रिप कंट्रोल'
                  : 'Trip Control'}
              </Text>

              <Text style={styles.summarySubtitle}>
                {hi
                  ? 'अपने वाहन की यात्राओं को ट्रैक और मैनेज करें।'
                  : 'Track and manage journeys for your vehicle.'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryStats}>
            <SummaryStat
              value={trips.length}
              label={hi ? 'कुल' : 'TOTAL'}
              styles={styles}
            />

            <View style={styles.summaryDivider} />

            <SummaryStat
              value={runningTrips}
              label={hi ? 'चल रही' : 'RUNNING'}
              styles={styles}
            />

            <View style={styles.summaryDivider} />

            <SummaryStat
              value={completedTrips}
              label={hi ? 'पूरी' : 'DONE'}
              styles={styles}
            />
          </View>
        </View>

        {/* ASSIGNED DRIVER */}
        <View style={styles.driverStrip}>
          <View style={styles.driverStripIcon}>
            <Ionicons
              name="person-outline"
              size={19}
              color={colors.primary}
            />
          </View>

          <View style={styles.driverStripText}>
            <Text style={styles.driverStripLabel}>
              {hi
                ? 'असाइन किया गया ड्राइवर'
                : 'ASSIGNED DRIVER'}
            </Text>

            <Text style={styles.driverStripName}>
              {assignedDriver?.name ||
                (hi
                  ? 'Truck Details से ड्राइवर assign करें'
                  : 'Assign a driver from Truck Details')}
            </Text>
          </View>

          {assignedDriver && (
            <View style={styles.assignedBadge}>
              <Ionicons
                name="checkmark"
                size={13}
                color={colors.success}
              />
            </View>
          )}
        </View>

        {/* ADD TRIP FORM */}
        {showAddForm && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.formTitle}>
                  {hi ? 'नई ट्रिप' : 'New Trip'}
                </Text>

                <Text style={styles.formSubtitle}>
                  {hi
                    ? 'यात्रा की जानकारी दर्ज करें'
                    : 'Enter journey information'}
                </Text>
              </View>

              <View style={styles.formIcon}>
                <Ionicons
                  name="navigate-outline"
                  size={21}
                  color={colors.primary}
                />
              </View>
            </View>

            <InputField
              label={hi ? 'FROM' : 'FROM'}
              placeholder={
                hi
                  ? 'शुरुआत की जगह'
                  : 'Starting location'
              }
              value={from}
              onChangeText={setFrom}
              icon="location-outline"
              colors={colors}
              styles={styles}
            />

            <InputField
              label={hi ? 'TO' : 'TO'}
              placeholder={
                hi
                  ? 'गंतव्य स्थान'
                  : 'Destination'
              }
              value={to}
              onChangeText={setTo}
              icon="flag-outline"
              colors={colors}
              styles={styles}
            />

            <InputField
              label={hi ? 'TRIP DATE' : 'TRIP DATE'}
              placeholder="DD/MM/YYYY"
              value={tripDate}
              onChangeText={setTripDate}
              icon="calendar-outline"
              colors={colors}
              styles={styles}
            />

            <InputField
              label={
                hi
                  ? 'DISTANCE (KM)'
                  : 'DISTANCE (KM)'
              }
              placeholder={
                hi
                  ? 'उदाहरण: 420'
                  : 'Example: 420'
              }
              value={distance}
              onChangeText={setDistance}
              keyboardType="numeric"
              icon="speedometer-outline"
              colors={colors}
              styles={styles}
            />

            <InputField
              label={hi ? 'NOTES' : 'NOTES'}
              placeholder={
                hi
                  ? 'अतिरिक्त जानकारी'
                  : 'Additional information'
              }
              value={notes}
              onChangeText={setNotes}
              icon="document-text-outline"
              colors={colors}
              styles={styles}
              multiline
            />

            {/* TRIP DETAILS */}
            <View style={styles.formSection}>
              <View style={styles.formSectionHeader}>
                <View style={styles.formSectionIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.formSectionText}>
                  <Text style={styles.formSectionTitle}>
                    {hi ? 'ट्रिप विवरण' : 'Trip Details'}
                  </Text>
                  <Text style={styles.formSectionSubtitle}>
                    {hi
                      ? 'पार्टी, फ्रेट और भुगतान चेकलिस्ट'
                      : 'Party, freight and payment checklist'}
                  </Text>
                </View>
              </View>

              <InputField
                label="PARTY NAME"
                placeholder={hi ? 'पार्टी का नाम' : 'Party name'}
                value={partyName}
                onChangeText={setPartyName}
                icon="business-outline"
                colors={colors}
                styles={styles}
              />

              <InputField
                label="FREIGHT AMOUNT"
                placeholder={hi ? 'फ्रेट अमाउंट' : 'Example: 70850'}
                value={freightAmount}
                onChangeText={setFreightAmount}
                keyboardType="decimal-pad"
                icon="cash-outline"
                colors={colors}
                styles={styles}
              />

              <Text style={styles.choiceLabel}>
                {hi ? 'CHECKLIST' : 'CHECKLIST'}
              </Text>

              {[
                ['chequeReceived', hi ? 'चेक प्राप्त हुआ' : 'Cheque Received'],
                ['chequeDeposited', hi ? 'चेक जमा हुआ' : 'Cheque Deposited'],
                ['moneyReceived', hi ? 'पैसे प्राप्त हुए' : 'Money Received'],
              ].map(([key, label]) => {
                const checklistKey = key as keyof typeof checklist;
                const checked = checklist[checklistKey];

                return (
                  <Pressable
                    key={key}
                    onPress={() =>
                      setChecklist((current) => ({
                        ...current,
                        [checklistKey]: !current[checklistKey],
                      }))
                    }
                    style={[
                      styles.statusChoice,
                      checked && styles.statusChoiceActive,
                    ]}
                  >
                    <Ionicons
                      name={
                        checked
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={17}
                      color={
                        checked
                          ? colors.success
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.statusChoiceText,
                        checked && styles.statusChoiceTextActive,
                        { marginLeft: 7 },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.buttonPressed,
              ]}
              disabled={saving}
              onPress={saveTrip}
            >
              {saving ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveButtonText}>
                    {hi
                      ? 'ट्रिप सेव करें'
                      : 'Save Trip'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

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
                ? 'From, To या status से खोजें...'
                : 'Search by location or status...'
            }
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
            >
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
              {hi ? 'ट्रिप हिस्ट्री' : 'Trip History'}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredTrips.length}{' '}
              {hi
                ? 'ट्रिप दिखाई दे रही हैं'
                : 'trips showing'}
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
                ? 'ट्रिप लोड हो रही हैं'
                : 'Loading trips'}
            </Text>

            <Text style={styles.stateSubtitle}>
              {hi
                ? 'कृपया कुछ सेकंड प्रतीक्षा करें...'
                : 'Please wait a moment...'}
            </Text>
          </View>
        ) : filteredTrips.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={
                  search.trim()
                    ? 'search-outline'
                    : 'navigate-outline'
                }
                size={30}
                color={colors.primary}
              />
            </View>

            <Text style={styles.stateTitle}>
              {search.trim()
                ? hi
                  ? 'कोई ट्रिप नहीं मिली'
                  : 'No trips found'
                : hi
                  ? 'अभी कोई ट्रिप नहीं है'
                  : 'No trips yet'}
            </Text>

            <Text style={styles.stateSubtitle}>
              {search.trim()
                ? hi
                  ? 'अपनी search बदलकर फिर कोशिश करें।'
                  : 'Try changing your search.'
                : hi
                  ? 'पहली ट्रिप जोड़ने के लिए ऊपर + दबाएं।'
                  : 'Tap + above to create your first trip.'}
            </Text>

            {!search.trim() && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() =>
                  setShowAddForm(true)
                }
              >
                <Ionicons
                  name="add"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.actionButtonText}>
                  {hi
                    ? 'पहली ट्रिप जोड़ें'
                    : 'Add First Trip'}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.tripList}>
            {filteredTrips.map((trip, index) => {
              const status = getTripStatus(
                trip.status
              );

              // Number from the complete ordered trip list.
              // Example: 10 trips => 10, 9, 8 ... 1 from top to bottom.
              // This keeps numbering correct even when search is active.
              const originalIndex = orderedTrips.indexOf(trip);
              const displayTripNumber =
                originalIndex >= 0
                  ? orderedTrips.length - originalIndex
                  : trips.length - index;

              const origin =
                trip.from ||
                trip.origin ||
                trip.startLocation ||
                '--';

              const destination =
                trip.to ||
                trip.destination ||
                trip.endLocation ||
                '--';

              const driverName =
                trip.driver?.name ||
                trip.driverName ||
                '--';

              const vehicle =
                trip.truck?.registrationNumber ||
                trip.truckNumber ||
                truckNumber ||
                '--';

              const date =
                trip.date ||
                trip.tripDate ||
                trip.startDate;

              return (
               <Pressable
  key={
    trip._id ||
    trip.id ||
    `${origin}-${destination}-${index}`
  }
  style={({ pressed }) => [
    styles.tripCard,
    pressed && styles.pressed,
  ]}
  onPress={() => {
    const id = trip._id || trip.id;

    if (!id) {
      Alert.alert(
        hi ? 'ट्रिप ID नहीं मिली' : 'Trip ID missing'
      );
      return;
    }

    router.push({
      pathname: '/trip-details',
      params: {
        tripId: String(id),
      },
    });
  }}
>
                  {/* TOP */}
                  <View style={styles.tripTop}>
                    <View style={styles.tripNumber}>
                      <Text style={styles.tripNumberText}>
                        {displayTripNumber}
                      </Text>
                    </View>

                    <View style={styles.tripStatus}>
                      <View
                        style={[
                          styles.tripStatusDot,
                          {
                            backgroundColor:
                              status === 'running'
                                ? colors.success
                                : status === 'completed'
                                  ? colors.primary
                                  : status ===
                                      'cancelled'
                                    ? colors.danger
                                    : colors.warning,
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.tripStatusText,
                          {
                            color:
                              status === 'running'
                                ? colors.success
                                : status === 'completed'
                                  ? colors.primary
                                  : status ===
                                      'cancelled'
                                    ? colors.danger
                                    : colors.warning,
                          },
                        ]}
                      >
                        {statusLabel(status)}
                      </Text>
                    </View>
                  </View>

                  {/* ROUTE */}
                  <View style={styles.route}>
                    <View style={styles.routeLine}>
                      <View
                        style={[
                          styles.routeDot,
                          {
                            backgroundColor:
                              colors.primary,
                          },
                        ]}
                      />

                      <View
                        style={[
                          styles.routeVertical,
                          {
                            backgroundColor:
                              colors.border,
                          },
                        ]}
                      />

                      <View
                        style={[
                          styles.routeDot,
                          {
                            backgroundColor:
                              colors.success,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.routeText}>
                      <View style={styles.locationBlock}>
                        <Text style={styles.locationLabel}>
                          {hi ? 'FROM' : 'FROM'}
                        </Text>

                        <Text
                          style={styles.locationValue}
                          numberOfLines={1}
                        >
                          {origin}
                        </Text>
                      </View>

                      <View style={styles.locationBlock}>
                        <Text style={styles.locationLabel}>
                          {hi ? 'TO' : 'TO'}
                        </Text>

                        <Text
                          style={styles.locationValue}
                          numberOfLines={1}
                        >
                          {destination}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* META */}
                  <View style={styles.tripMeta}>
                    <MetaItem
                      icon="calendar-outline"
                      value={formatDate(date)}
                      styles={styles}
                      colors={colors}
                    />

                    <MetaItem
                      icon="speedometer-outline"
                      value={
                        trip.distance
                          ? `${trip.distance} km`
                          : '--'
                      }
                      styles={styles}
                      colors={colors}
                    />

                    <MetaItem
                      icon="person-outline"
                      value={driverName}
                      styles={styles}
                      colors={colors}
                    />
                  </View>

                  {/* VEHICLE */}
                  <View style={styles.vehicleRow}>
                    <Ionicons
                      name="car-outline"
                      size={16}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.vehicleText}>
                      {vehicle}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* FOOTER */}
        {!loading && trips.length > 0 && (
          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={colors.success}
            />

            <Text style={styles.footerText}>
              {hi
                ? 'Trip data सुरक्षित रूप से manage किया जा रहा है'
                : 'Trip data is securely managed'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryStat({
  value,
  label,
  styles,
}: {
  value: number;
  label: string;
  styles: any;
}) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryStatValue}>
        {value}
      </Text>

      <Text style={styles.summaryStatLabel}>
        {label}
      </Text>
    </View>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  colors,
  styles,
  keyboardType,
  multiline,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  colors: any;
  styles: any;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={colors.textSecondary}
          style={styles.inputIcon}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={
            multiline ? 'top' : 'center'
          }
          style={[
            styles.input,
            multiline && styles.multilineInput,
          ]}
        />
      </View>
    </View>
  );
}

function MetaItem({
  icon,
  value,
  styles,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  styles: any;
  colors: any;
}) {
  return (
    <View style={styles.metaItem}>
      <Ionicons
        name={icon}
        size={14}
        color={colors.textSecondary}
      />

      <Text
        style={styles.metaValue}
        numberOfLines={1}
      >
        {value}
      </Text>
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
      paddingBottom: 45,
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

    summaryCard: {
      marginTop: 25,
      marginHorizontal: 18,
      borderRadius: 24,
      padding: 19,
      backgroundColor: '#0B1D36',
    },

    summaryMain: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    summaryIcon: {
      width: 57,
      height: 57,
      borderRadius: 18,
      backgroundColor: '#0B7285',
      alignItems: 'center',
      justifyContent: 'center',
    },

    summaryText: {
      flex: 1,
      marginLeft: 14,
    },

    summaryTitle: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '900',
    },

    summarySubtitle: {
      color: '#CBD5E1',
      fontSize: 10,
      lineHeight: 15,
      marginTop: 4,
    },

    summaryStats: {
      marginTop: 19,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#27415F',
      flexDirection: 'row',
      alignItems: 'center',
    },

    summaryStat: {
      flex: 1,
      alignItems: 'center',
    },

    summaryStatValue: {
      color: '#FFFFFF',
      fontSize: 19,
      fontWeight: '900',
    },

    summaryStatLabel: {
      color: '#93C5FD',
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.5,
      marginTop: 3,
    },

    summaryDivider: {
      width: 1,
      height: 27,
      backgroundColor: '#27415F',
    },

    driverStrip: {
      marginTop: 14,
      marginHorizontal: 18,
      padding: 13,
      borderRadius: 17,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },

    driverStripIcon: {
      width: 41,
      height: 41,
      borderRadius: 13,
      backgroundColor: isDark
        ? '#163B40'
        : '#E2F3F1',
      alignItems: 'center',
      justifyContent: 'center',
    },

    driverStripText: {
      flex: 1,
      marginLeft: 10,
    },

    driverStripLabel: {
      color: colors.textMuted,
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.7,
    },

    driverStripName: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '800',
      marginTop: 4,
    },

    assignedBadge: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: isDark
        ? '#12352F'
        : '#ECFDF5',
      alignItems: 'center',
      justifyContent: 'center',
    },

    formCard: {
      marginTop: 15,
      marginHorizontal: 18,
      padding: 17,
      borderRadius: 21,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    formHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },

    formTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
    },

    formSubtitle: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 4,
    },

    formIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: isDark
        ? '#163B40'
        : '#E2F3F1',
      alignItems: 'center',
      justifyContent: 'center',
    },

    inputGroup: {
      marginBottom: 13,
    },

    inputLabel: {
      color: colors.textMuted,
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.7,
      marginBottom: 6,
    },

    inputWrapper: {
      minHeight: 50,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
    },

    multilineWrapper: {
      alignItems: 'flex-start',
      paddingVertical: 11,
    },

    inputIcon: {
      marginRight: 9,
      marginTop: 1,
    },

    input: {
      flex: 1,
      color: colors.text,
      fontSize: 12,
      paddingVertical: 0,
      ...(Platform.OS === 'web'
        ? ({
            outlineStyle: 'none',
            outlineWidth: 0,
            outlineColor: 'transparent',
            boxShadow: 'none',
          } as any)
        : {}),
    },

    multilineInput: {
      minHeight: 70,
      paddingTop: 0,
    },

    formSection: {
      marginTop: 18,
      paddingTop: 17,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    formSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },

    formSectionIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },

    formSectionText: {
      flex: 1,
      marginLeft: 10,
    },

    formSectionTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '900',
    },

    formSectionSubtitle: {
      color: colors.textMuted,
      fontSize: 8,
      marginTop: 3,
    },


    choiceLabel: {
      color: colors.textMuted,
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.7,
      marginBottom: 7,
    },


    statusChoiceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginBottom: 2,
    },

    statusChoice: {
      minHeight: 36,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },

    statusChoiceActive: {
      borderColor: colors.success,
      backgroundColor: isDark ? '#12352F' : '#ECFDF5',
    },

    statusChoiceText: {
      color: colors.textSecondary,
      fontSize: 8,
      fontWeight: '800',
    },

    statusChoiceTextActive: {
      color: colors.success,
    },

    saveButton: {
      height: 49,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
      marginTop: 5,
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
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
      fontSize: 12,
      marginLeft: 9,
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
      height: 29,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: isDark
        ? '#12352F'
        : '#ECFDF5',
      flexDirection: 'row',
      alignItems: 'center',
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

    tripList: {
      marginTop: 13,
      paddingHorizontal: 18,
      gap: 12,
    },

    tripCard: {
      backgroundColor: colors.surface,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },

    tripTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    tripNumber: {
      width: 43,
      height: 29,
      borderRadius: 9,
      backgroundColor: isDark
        ? '#163B40'
        : '#E2F3F1',
      alignItems: 'center',
      justifyContent: 'center',
    },

    tripNumberText: {
      color: colors.primary,
      fontSize: 9,
      fontWeight: '900',
    },

    tripStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    tripStatusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginRight: 6,
    },

    tripStatusText: {
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.6,
    },

    route: {
      flexDirection: 'row',
      marginTop: 18,
    },

    routeLine: {
      width: 22,
      alignItems: 'center',
      paddingTop: 4,
    },

    routeDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
    },

    routeVertical: {
      width: 2,
      height: 43,
      marginVertical: 4,
    },

    routeText: {
      flex: 1,
      marginLeft: 9,
      justifyContent: 'space-between',
      minHeight: 67,
    },

    locationBlock: {
      minHeight: 29,
    },

    locationLabel: {
      color: colors.textMuted,
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.7,
    },

    locationValue: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '800',
      marginTop: 3,
    },

    tripMeta: {
      marginTop: 16,
      paddingTop: 13,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },

    metaItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 5,
      minWidth: 0,
    },

    metaValue: {
      color: colors.textSecondary,
      fontSize: 8,
      fontWeight: '700',
      marginLeft: 5,
      flex: 1,
    },

    vehicleRow: {
      marginTop: 12,
      minHeight: 37,
      borderRadius: 10,
      backgroundColor: colors.background,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },

    vehicleText: {
      flex: 1,
      color: colors.text,
      fontSize: 9,
      fontWeight: '800',
      marginLeft: 7,
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
        ? '#163B40'
        : '#E2F3F1',
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
      fontSize: 10,
      lineHeight: 16,
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
      gap: 7,
      marginTop: 19,
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

    toast: {
      position: 'absolute',
      top: Platform.OS === 'web' ? 20 : 54,
      left: 18,
      right: 18,
      zIndex: 100,
      minHeight: 52,
      borderRadius: 15,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 8,
    },

    toastSuccess: {
      backgroundColor: '#16A34A',
    },

    toastError: {
      backgroundColor: '#DC2626',
    },

    toastText: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
      marginLeft: 10,
    },

    footer: {
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },

    footerText: {
      color: colors.textMuted,
      fontSize: 9,
      marginLeft: 6,
    },
  });