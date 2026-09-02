import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';
type Trip = {
  _id?: string;
  from?: string;
  to?: string;
  startLocation?: string;
  endLocation?: string;
  date?: string;
  tripDate?: string;
  distance?: number | string;
  status?: string;
  notes?: string;
  checklist?: {
    chequeReceived?: boolean;
    chequeDeposited?: boolean;
    moneyReceived?: boolean;
  };

  partyName?: string;
  freightAmount?: number | string;

  driver?: {
    _id?: string;
    name?: string;
    phone?: string;
    licenseNumber?: string;
  };
  truck?: {
    _id?: string;
    registrationNumber?: string;
    vehicleNumber?: string;
    model?: string;
  };
};

export default function TripDetailsScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const hi = language === 'hi';

  const styles = createStyles(colors, isDark);

  const params = useLocalSearchParams<{
    tripId?: string;
  }>();

  const tripId = String(params.tripId || '');

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');

  const [checklist, setChecklist] = useState({
    chequeReceived: false,
    chequeDeposited: false,
    moneyReceived: false,
  });

  const [partyName, setPartyName] = useState('');
  const [freightAmount, setFreightAmount] = useState('');
  const [savingExtras, setSavingExtras] = useState(false);

  const loadTrip = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      if (!tripId) {
        throw new Error(
          hi ? 'Trip ID नहीं मिली।' : 'Trip ID is missing.'
        );
      }

      const response = await fetch(
        `${API_URL}/api/trips/${tripId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (hi
              ? 'ट्रिप लोड नहीं हो सकी।'
              : 'Unable to load trip.')
        );
      }

      const loadedTrip = data?.trip || data;

      setTrip(loadedTrip);

      setFrom(
        loadedTrip?.from ||
          loadedTrip?.startLocation ||
          ''
      );

      setTo(
        loadedTrip?.to ||
          loadedTrip?.endLocation ||
          ''
      );

      setDate(
        formatDateForInput(loadedTrip?.date || loadedTrip?.tripDate) || ''
      );

      setDistance(
        loadedTrip?.distance !== undefined
          ? String(loadedTrip.distance)
          : ''
      );

      setNotes(loadedTrip?.notes || '');

      setChecklist({
        chequeReceived: !!loadedTrip?.checklist?.chequeReceived,
        chequeDeposited: !!loadedTrip?.checklist?.chequeDeposited,
        moneyReceived: !!loadedTrip?.checklist?.moneyReceived,
      });

      setPartyName(loadedTrip?.partyName || '');
      setFreightAmount(
        loadedTrip?.freightAmount != null
          ? String(loadedTrip.freightAmount)
          : ''
      );
    } catch (error) {
      console.error('Trip details error:', error);

      Alert.alert(
        hi ? 'त्रुटि' : 'Error',
        error instanceof Error
          ? error.message
          : hi
            ? 'ट्रिप लोड नहीं हो सकी।'
            : 'Unable to load trip.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrip();
  }, [tripId, language]);

  // Display dates consistently as DD/MM/YYYY.
  // The API can still receive ISO dates (YYYY-MM-DD).
  const formatDateForInput = (value?: string) => {
    if (!value) return '';

    const raw = String(value).trim();

    // Already in DD/MM/YYYY format.
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      return raw;
    }

    // Handle ISO date/time or YYYY-MM-DD without timezone shifting.
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }

    // Fallback for other valid date strings.
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;

    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatDateForApi = (value?: string) => {
    if (!value) return undefined;

    const raw = String(value).trim();

    // Convert DD/MM/YYYY -> YYYY-MM-DD.
    const ddmmyyyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    }

    // Keep YYYY-MM-DD / ISO values unchanged.
    return raw;
  };

  const formatDate = (value?: string) => {
    if (!value) return '--';
    return formatDateForInput(value) || '--';
  };

  const status = String(
    trip?.status || 'scheduled'
  ).toLowerCase();

  const statusText = () => {
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

  const statusColor = () => {
    switch (status) {
      case 'running':
        return colors.success;

      case 'completed':
        return colors.primary;

      case 'cancelled':
        return colors.danger;

      default:
        return colors.warning;
    }
  };

  const saveChanges = async () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert(
        hi ? 'जानकारी अधूरी है' : 'Missing information',
        hi
          ? 'From और To दोनों भरें।'
          : 'Please enter both From and To.'
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

      const payload = {
        from: from.trim(),
        to: to.trim(),
        startLocation: from.trim(),
        endLocation: to.trim(),
        date: formatDateForApi(date),
        tripDate: formatDateForApi(date),
        distance: distance.trim()
          ? Number(distance)
          : 0,
        notes: notes.trim(),
      };

      const response = await fetch(
        `${API_URL}/api/trips/${tripId}`,
        {
          method: 'PUT',
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
              ? 'ट्रिप अपडेट नहीं हो सकी।'
              : 'Unable to update trip.')
        );
      }

      setTrip(data?.trip || data);
      setEditing(false);

      Alert.alert(
        hi ? 'सफल' : 'Success',
        hi
          ? 'ट्रिप अपडेट हो गई।'
          : 'Trip updated successfully.'
      );

      await loadTrip();
    } catch (error) {
      console.error('Update trip error:', error);

      Alert.alert(
        hi ? 'अपडेट नहीं हुई' : 'Update failed',
        error instanceof Error
          ? error.message
          : hi
            ? 'ट्रिप अपडेट नहीं हो सकी।'
            : 'Unable to update trip.'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveTripExtras = async () => {
    try {
      setSavingExtras(true);

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      const parsedFreightAmount = freightAmount.trim()
        ? Number(freightAmount)
        : 0;

      if (
        Number.isNaN(parsedFreightAmount) ||
        parsedFreightAmount < 0
      ) {
        throw new Error(
          hi
            ? 'फ्रेट अमाउंट सही भरें।'
            : 'Please enter a valid freight amount.'
        );
      }

      const payload = {
        partyName: partyName.trim(),
        freightAmount: parsedFreightAmount,
        checklist: {
          chequeReceived: !!checklist.chequeReceived,
          chequeDeposited: !!checklist.chequeDeposited,
          moneyReceived: !!checklist.moneyReceived,
        },
      };

      const response = await fetch(
        `${API_URL}/api/trips/${tripId}`,
        {
          method: 'PUT',
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
              ? 'ट्रिप अपडेट नहीं हो सकी।'
              : 'Unable to save trip updates.')
        );
      }

      const updatedTrip = data?.trip;

      if (!updatedTrip) {
        throw new Error(
          hi
            ? 'सर्वर ने अपडेटेड ट्रिप डेटा नहीं भेजा।'
            : 'Server did not return the updated trip.'
        );
      }

      setTrip(updatedTrip);
      setPartyName(updatedTrip.partyName || '');
      setFreightAmount(
        updatedTrip.freightAmount != null
          ? String(updatedTrip.freightAmount)
          : ''
      );

      setChecklist({
        chequeReceived: !!updatedTrip.checklist?.chequeReceived,
        chequeDeposited: !!updatedTrip.checklist?.chequeDeposited,
        moneyReceived: !!updatedTrip.checklist?.moneyReceived,
      });

      Alert.alert(
        hi ? 'सफल' : 'Saved',
        hi
          ? 'ट्रिप की जानकारी सेव हो गई।'
          : 'Trip updates saved successfully.'
      );
    } catch (error) {
      console.error('Save trip extras error:', error);

      Alert.alert(
        hi ? 'त्रुटि' : 'Save failed',
        error instanceof Error
          ? error.message
          : (hi
              ? 'जानकारी सेव नहीं हुई।'
              : 'Unable to save trip updates.')
      );
    } finally {
      setSavingExtras(false);
    }
  };

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };


  const changeStatus = (newStatus: string) => {
    Alert.alert(
      hi ? 'स्टेटस बदलें' : 'Change status',
      hi
        ? 'ट्रिप का नया स्टेटस चुनें।'
        : 'Choose the new trip status.',
      [
        {
          text: hi ? 'चल रही है' : 'Running',
          onPress: () => updateStatus('running'),
        },
        {
          text: hi ? 'पूरी हो गई' : 'Completed',
          onPress: () => updateStatus('completed'),
        },
        {
          text: hi ? 'रद्द' : 'Cancelled',
          onPress: () => updateStatus('cancelled'),
        },
        {
          text: hi ? 'रद्द करें' : 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/trips/${tripId}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (hi
              ? 'स्टेटस अपडेट नहीं हुआ।'
              : 'Unable to update status.')
        );
      }

      setTrip(data?.trip || trip);

      Alert.alert(
        hi ? 'सफल' : 'Success',
        hi
          ? 'ट्रिप स्टेटस अपडेट हो गया।'
          : 'Trip status updated.'
      );
    } catch (error) {
      console.error('Status update error:', error);

      Alert.alert(
        hi ? 'त्रुटि' : 'Error',
        error instanceof Error
          ? error.message
          : hi
            ? 'स्टेटस अपडेट नहीं हुआ।'
            : 'Unable to update status.'
      );
    }
  };

  const deleteTrip = () => {
    Alert.alert(
      hi ? 'ट्रिप डिलीट करें?' : 'Delete trip?',
      hi
        ? 'यह ट्रिप हमेशा के लिए डिलीट हो जाएगी।'
        : 'This trip will be permanently deleted.',
      [
        {
          text: hi ? 'रद्द करें' : 'Cancel',
          style: 'cancel',
        },
        {
          text: hi ? 'डिलीट करें' : 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/trips/${tripId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (hi
              ? 'ट्रिप डिलीट नहीं हो सकी।'
              : 'Unable to delete trip.')
        );
      }

      Alert.alert(
        hi ? 'डिलीट हो गई' : 'Deleted',
        hi
          ? 'ट्रिप सफलतापूर्वक डिलीट हो गई।'
          : 'Trip deleted successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Delete trip error:', error);

      Alert.alert(
        hi ? 'डिलीट नहीं हुई' : 'Delete failed',
        error instanceof Error
          ? error.message
          : hi
            ? 'ट्रिप डिलीट नहीं हो सकी।'
            : 'Unable to delete trip.'
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          {hi ? 'ट्रिप लोड हो रही है...' : 'Loading trip...'}
        </Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.loadingScreen}>
        <Ionicons
          name="alert-circle-outline"
          size={45}
          color={colors.danger}
        />

        <Text style={styles.emptyTitle}>
          {hi ? 'ट्रिप नहीं मिली' : 'Trip not found'}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>
            {hi ? 'वापस जाएं' : 'Go Back'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
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
            <Text style={styles.headerTitle}>
              {hi ? 'ट्रिप डिटेल्स' : 'Trip Details'}
            </Text>

            <Text style={styles.headerSubtitle}>
              {hi
                ? 'यात्रा की पूरी जानकारी'
                : 'Complete journey information'}
            </Text>
          </View>

          <Pressable
            style={styles.iconButton}
            onPress={() => setEditing(!editing)}
          >
            <Ionicons
              name={editing ? 'close' : 'create-outline'}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>

        {/* ROUTE CARD */}
        <View style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <View style={styles.routeIcon}>
              <Ionicons
                name="navigate"
                size={24}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.routeHeaderText}>
              <Text style={styles.routeTitle}>
                {hi ? 'यात्रा मार्ग' : 'Trip Route'}
              </Text>

              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isDark
                      ? '#26351A'
                      : '#FFF7DF',
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: statusColor(),
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    { color: statusColor() },
                  ]}
                >
                  {statusText()}
                </Text>
              </View>
            </View>
          </View>

          {editing ? (
            <>
              <EditField
                label={hi ? 'FROM' : 'FROM'}
                value={from}
                onChangeText={setFrom}
                icon="location-outline"
                styles={styles}
                colors={colors}
              />

              <EditField
                label={hi ? 'TO' : 'TO'}
                value={to}
                onChangeText={setTo}
                icon="flag-outline"
                styles={styles}
                colors={colors}
              />

              <EditField
                label={hi ? 'DATE' : 'DATE'}
                value={date}
                onChangeText={setDate}
                icon="calendar-outline"
                styles={styles}
                colors={colors}
              />

              <EditField
                label={hi ? 'DISTANCE (KM)' : 'DISTANCE (KM)'}
                value={distance}
                onChangeText={setDistance}
                icon="speedometer-outline"
                keyboardType="numeric"
                styles={styles}
                colors={colors}
              />

              <EditField
                label={hi ? 'NOTES' : 'NOTES'}
                value={notes}
                onChangeText={setNotes}
                icon="document-text-outline"
                multiline
                styles={styles}
                colors={colors}
              />

              <Pressable
                style={styles.primaryButton}
                disabled={saving}
                onPress={saveChanges}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={19}
                      color="#FFFFFF"
                    />

                    <Text style={styles.primaryButtonText}>
                      {hi
                        ? 'सेव करें'
                        : 'Save Changes'}
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          ) : (
            <View style={styles.routeBody}>
              <RoutePoint
                label={hi ? 'FROM' : 'FROM'}
                value={
                  trip.from ||
                  trip.startLocation ||
                  '--'
                }
                icon="radio-button-on"
                colors={colors}
                styles={styles}
              />

              <View
                style={[
                  styles.routeConnector,
                  {
                    backgroundColor: colors.border,
                  },
                ]}
              />

              <RoutePoint
                label={hi ? 'TO' : 'TO'}
                value={
                  trip.to ||
                  trip.endLocation ||
                  '--'
                }
                icon="location"
                colors={colors}
                styles={styles}
              />
            </View>
          )}
        </View>

        {/* INFORMATION */}
        {!editing && (
          <>
            <View style={styles.infoGrid}>
              <InfoCard
                icon="calendar-outline"
                label={hi ? 'तारीख' : 'DATE'}
                value={formatDate(
                  trip.date || trip.tripDate
                )}
                styles={styles}
                colors={colors}
              />

              <InfoCard
                icon="speedometer-outline"
                label={hi ? 'दूरी' : 'DISTANCE'}
                value={
                  trip.distance
                    ? `${trip.distance} km`
                    : '--'
                }
                styles={styles}
                colors={colors}
              />
            </View>

            <View style={styles.infoCardFull}>
              <InfoRow
                icon="car-outline"
                label={hi ? 'ट्रक' : 'TRUCK'}
                value={
                  trip.truck?.registrationNumber ||
                  trip.truck?.vehicleNumber ||
                  '--'
                }
                styles={styles}
                colors={colors}
              />

              <InfoRow
                icon="person-outline"
                label={hi ? 'ड्राइवर' : 'DRIVER'}
                value={
                  trip.driver?.name || '--'
                }
                styles={styles}
                colors={colors}
              />

              {trip.driver?.phone && (
                <InfoRow
                  icon="call-outline"
                  label={hi ? 'फोन' : 'PHONE'}
                  value={trip.driver.phone}
                  styles={styles}
                  colors={colors}
                />
              )}
            </View>

            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.notesTitle}>
                  {hi ? 'नोट्स' : 'Notes'}
                </Text>
              </View>

              <Text style={styles.notesText}>
                {trip.notes ||
                  (hi
                    ? 'कोई नोट नहीं है।'
                    : 'No notes added.')}
              </Text>
            </View>

            {/* TRIP CHECKLIST */}
            <View style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={19}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.featureHeaderText}>
                  <Text style={styles.featureTitle}>
                    {hi ? 'ट्रिप चेकलिस्ट' : 'Trip Checklist'}
                  </Text>

                  <Text style={styles.featureSubtitle}>
                    {hi
                      ? 'पार्टी और पेमेंट प्रगति अपडेट करें'
                      : 'Update party, freight and payment progress'}
                  </Text>
                </View>
              </View>

              <EditField
                label={hi ? 'पार्टी नाम' : 'PARTY NAME'}
                value={partyName}
                onChangeText={setPartyName}
                icon="business-outline"
                styles={styles}
                colors={colors}
              />

              <EditField
                label={hi ? 'फ्रेट अमाउंट' : 'FREIGHT AMOUNT'}
                value={freightAmount}
                onChangeText={setFreightAmount}
                icon="cash-outline"
                keyboardType="decimal-pad"
                styles={styles}
                colors={colors}
              />

              <ChecklistRow
                label={hi ? 'चेक प्राप्त हो गया' : 'Cheque Received'}
                checked={checklist.chequeReceived}
                onPress={() => toggleChecklist('chequeReceived')}
                styles={styles}
                colors={colors}
              />

              <ChecklistRow
                label={
                  hi
                    ? 'चेक बैंक में जमा हो गया'
                    : 'Cheque Bank Mein Deposit Ho Gaya'
                }
                checked={checklist.chequeDeposited}
                onPress={() => toggleChecklist('chequeDeposited')}
                styles={styles}
                colors={colors}
              />

              <ChecklistRow
                label={
                  hi
                    ? 'बैंक में पैसा प्राप्त हो गया'
                    : 'Bank Mein Money Received Ho Gaya'
                }
                checked={checklist.moneyReceived}
                onPress={() => toggleChecklist('moneyReceived')}
                styles={styles}
                colors={colors}
              />
            </View>

            <Pressable style={styles.saveExtrasButton} disabled={savingExtras} onPress={saveTripExtras}>
              {savingExtras ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="save-outline" size={18} color="#FFFFFF" /><Text style={styles.saveExtrasText}>{hi ? 'ट्रिप अपडेट सेव करें' : 'Save Trip Updates'}</Text></>}
            </Pressable>

            {/* ACTIONS */}
            <View style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>
                {hi ? 'ट्रिप एक्शन' : 'Trip Actions'}
              </Text>

              <Pressable
                style={styles.actionRow}
                onPress={() => changeStatus(status)}
              >
                <View
                  style={[
                    styles.actionIcon,
                    {
                      backgroundColor: isDark
                        ? '#172F4A'
                        : '#EDF5FF',
                    },
                  ]}
                >
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={19}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>
                    {hi
                      ? 'स्टेटस बदलें'
                      : 'Change Status'}
                  </Text>

                  <Text style={styles.actionSubtitle}>
                    {hi
                      ? 'Running, Completed या Cancelled'
                      : 'Running, Completed or Cancelled'}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              <Pressable
                style={styles.actionRow}
                onPress={() => setEditing(true)}
              >
                <View
                  style={[
                    styles.actionIcon,
                    {
                      backgroundColor: isDark
                        ? '#172F4A'
                        : '#EDF5FF',
                    },
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={19}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>
                    {hi ? 'ट्रिप एडिट करें' : 'Edit Trip'}
                  </Text>

                  <Text style={styles.actionSubtitle}>
                    {hi
                      ? 'ट्रिप की जानकारी बदलें'
                      : 'Modify trip information'}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              <Pressable
                style={styles.actionRow}
                onPress={deleteTrip}
              >
                <View
                  style={[
                    styles.actionIcon,
                    {
                      backgroundColor: isDark
                        ? '#3A2024'
                        : '#FFF0F0',
                    },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={19}
                    color={colors.danger}
                  />
                </View>

                <View style={styles.actionText}>
                  <Text
                    style={[
                      styles.actionTitle,
                      { color: colors.danger },
                    ]}
                  >
                    {hi ? 'ट्रिप डिलीट करें' : 'Delete Trip'}
                  </Text>

                  <Text style={styles.actionSubtitle}>
                    {hi
                      ? 'ट्रिप को स्थायी रूप से हटाएं'
                      : 'Permanently remove this trip'}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ChecklistRow({ label, checked, onPress, styles, colors }: any) {
  return (
    <Pressable style={styles.checklistRow} onPress={onPress}>
      <View style={[styles.checkbox, checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        {checked && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
      </View>
      <Text style={[styles.checklistText, checked && { color: colors.text }]}>{label}</Text>
      <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={checked ? colors.success : colors.textMuted} />
    </Pressable>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  icon,
  keyboardType,
  multiline,
  styles,
  colors,
}: any) {
  return (
    <View style={styles.editGroup}>
      <Text style={styles.editLabel}>{label}</Text>

      <View
        style={[
          styles.editWrapper,
          multiline && styles.editMultiline,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={colors.textSecondary}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.editInput,
            multiline && styles.editInputMulti,
          ]}
        />
      </View>
    </View>
  );
}

function RoutePoint({
  label,
  value,
  icon,
  colors,
  styles,
}: any) {
  return (
    <View style={styles.routePoint}>
      <Ionicons
        name={icon}
        size={17}
        color={colors.primary}
      />

      <View style={styles.routePointText}>
        <Text style={styles.routeLabel}>{label}</Text>

        <Text
          style={styles.routeValue}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function InfoCard({
  icon,
  label,
  value,
  styles,
  colors,
}: any) {
  return (
    <View style={styles.infoCard}>
      <Ionicons
        name={icon}
        size={19}
        color={colors.primary}
      />

      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  styles,
  colors,
}: any) {
  return (
    <View style={styles.infoRow}>
      <Ionicons
        name={icon}
        size={18}
        color={colors.primary}
      />

      <Text style={styles.infoRowLabel}>
        {label}
      </Text>

      <Text
        style={styles.infoRowValue}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<
    typeof import('../context/ThemeContext').useTheme
  >['colors'],
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

    loadingScreen: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 25,
    },

    loadingText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 12,
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
      marginTop: 12,
      marginBottom: 20,
    },

    header: {
      paddingTop: 52,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
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
    },

    headerText: {
      flex: 1,
      marginLeft: 13,
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

    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    routeCard: {
      marginTop: 22,
      marginHorizontal: 18,
      padding: 18,
      borderRadius: 23,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    routeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },

    routeIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    routeHeaderText: {
      flex: 1,
      marginLeft: 12,
    },

    routeTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
    },

    statusPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
      marginTop: 6,
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 5,
    },

    statusText: {
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    routeBody: {
      paddingTop: 5,
    },

    routePoint: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    routePointText: {
      flex: 1,
      marginLeft: 10,
    },

    routeLabel: {
      color: colors.textMuted,
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.7,
    },

    routeValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 3,
    },

    routeConnector: {
      width: 2,
      height: 28,
      marginLeft: 7,
      marginVertical: 3,
    },

    infoGrid: {
      marginTop: 14,
      marginHorizontal: 18,
      flexDirection: 'row',
      gap: 12,
    },

    infoCard: {
      flex: 1,
      padding: 15,
      minHeight: 105,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    infoLabel: {
      color: colors.textMuted,
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.7,
      marginTop: 12,
    },

    infoValue: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '800',
      marginTop: 5,
    },

    infoCardFull: {
      marginTop: 14,
      marginHorizontal: 18,
      paddingHorizontal: 15,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    infoRow: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    infoRowLabel: {
      color: colors.textMuted,
      fontSize: 8,
      fontWeight: '900',
      width: 72,
      marginLeft: 10,
    },

    infoRowValue: {
      flex: 1,
      color: colors.text,
      fontSize: 11,
      fontWeight: '800',
      textAlign: 'right',
    },

    notesCard: {
      marginTop: 14,
      marginHorizontal: 18,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    notesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    notesTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '900',
      marginLeft: 8,
    },

    notesText: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 18,
      marginTop: 12,
    },

    actionsCard: {
      marginTop: 14,
      marginHorizontal: 18,
      padding: 15,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    actionsTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '900',
      marginBottom: 5,
    },

    actionRow: {
      minHeight: 66,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    actionIcon: {
      width: 39,
      height: 39,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    actionText: {
      flex: 1,
      marginLeft: 11,
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

    featureCard: {
      marginTop: 14,
      marginHorizontal: 18,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    featureHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },

    featureIcon: {
      width: 39,
      height: 39,
      borderRadius: 12,
      backgroundColor: isDark ? '#172F4A' : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    featureHeaderText: {
      flex: 1,
      marginLeft: 11,
    },

    featureTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '900',
    },

    featureSubtitle: {
      color: colors.textMuted,
      fontSize: 8,
      marginTop: 3,
    },

    checklistRow: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    checklistText: {
      flex: 1,
      marginLeft: 10,
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: '800',
    },

    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    saveExtrasButton: {
      marginTop: 14,
      marginHorizontal: 18,
      minHeight: 49,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
    },

    saveExtrasText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },

    editGroup: {
      marginBottom: 12,
    },

    editLabel: {
      color: colors.textMuted,
      fontSize: 7,
      fontWeight: '900',
      letterSpacing: 0.7,
      marginBottom: 6,
    },

    editWrapper: {
      minHeight: 49,
      borderRadius: 13,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
    },

    editMultiline: {
      alignItems: 'flex-start',
      paddingVertical: 10,
    },

    editInput: {
      flex: 1,
      color: colors.text,
      fontSize: 11,
      marginLeft: 9,
    },

    editInputMulti: {
      minHeight: 65,
      textAlignVertical: 'top',
    },

    primaryButton: {
      minHeight: 49,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
      marginTop: 5,
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },
  });