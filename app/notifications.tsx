import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';
const EXPIRY_WINDOW_DAYS = 30;

type Truck = {
  _id?: string;
  id?: string;
  registrationNumber?: string;
  vehicleNumber?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  taxExpiry?: string;
  puccExpiry?: string;
  permitExpiry?: string;
  nationalPermitExpiry?: string;
};

type ExpiringDocument = {
  id: string;
  truckId?: string;
  truckNumber: string;
  documentType:
    | 'Insurance'
    | 'Fitness Certificate'
    | 'Tax'
    | 'PUCC'
    | 'Permit'
    | 'National Permit';
  expiry: string;
  daysLeft: number;
};

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const styles = createStyles(colors, isDark);
  const hi = language === 'hi';

  const [documents, setDocuments] = useState<ExpiringDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const getDocuments = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError('');

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/');
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
        throw new Error(
          data?.message ||
            (hi ? 'डॉक्यूमेंट्स लोड नहीं हो सके।' : 'Unable to load documents.')
        );
      }

      const trucks: Truck[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.trucks)
          ? data.trucks
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const deadline = new Date(today);
      deadline.setDate(today.getDate() + EXPIRY_WINDOW_DAYS);

      const result: ExpiringDocument[] = [];

      trucks.forEach((truck, truckIndex) => {
        const truckId = String(truck._id || truck.id || '');
        const truckNumber =
          truck.registrationNumber || truck.vehicleNumber || `Truck ${truckIndex + 1}`;

        const addDocument = (
          type: ExpiringDocument['documentType'],
          expiry?: string
        ) => {
          if (!expiry) return;

          const expiryDate = new Date(expiry);
          if (Number.isNaN(expiryDate.getTime())) return;
          expiryDate.setHours(0, 0, 0, 0);

          // Include expired documents and documents expiring within 30 days.
          if (expiryDate > deadline) return;

          const daysLeft = Math.ceil(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          result.push({
            id: `${truckId || truckIndex}-${type}`,
            truckId: truckId || undefined,
            truckNumber: String(truckNumber),
            documentType: type,
            expiry,
            daysLeft,
          });
        };

        addDocument('Insurance', truck.insuranceExpiry);
        addDocument('Fitness Certificate', truck.fitnessExpiry);
        addDocument('Tax', truck.taxExpiry);
        addDocument('PUCC', truck.puccExpiry);
        addDocument('Permit', truck.permitExpiry);
        addDocument('National Permit', truck.nationalPermitExpiry);
      });

      result.sort((a, b) => a.daysLeft - b.daysLeft);
      setDocuments(result);
    } catch (err) {
      console.error('Notifications loading error:', err);
      setError(
        err instanceof Error
          ? err.message
          : hi
            ? 'डॉक्यूमेंट्स लोड नहीं हो सके।'
            : 'Unable to load documents.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hi]);

  useFocusEffect(
    useCallback(() => {
      getDocuments(true);
    }, [getDocuments])
  );

  const onRefresh = () => {
    setRefreshing(true);
    getDocuments(false);
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString(hi ? 'hi-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const summary = useMemo(() => documents.length, [documents]);

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

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
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              {hi ? 'नोटिफिकेशन' : 'Notifications'}
            </Text>
            <Text style={styles.subtitle}>
              {hi
                ? 'समाप्त या अगले 30 दिनों में समाप्त होने वाले डॉक्यूमेंट्स'
                : 'Expired or expiring within the next 30 days'}
            </Text>
          </View>

          <View style={styles.countPill}>
            <Text style={styles.countText}>{summary}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateTitle}>
              {hi ? 'नोटिफिकेशन लोड हो रहे हैं...' : 'Loading notifications...'}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}>
              <Ionicons name="alert-circle-outline" size={25} color="#DC2626" />
            </View>
            <Text style={styles.stateTitle}>
              {hi ? 'कुछ गलत हो गया' : 'Something went wrong'}
            </Text>
            <Text style={styles.stateSubtitle}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => getDocuments(true)}>
              <Text style={styles.retryText}>{hi ? 'दोबारा प्रयास करें' : 'Try again'}</Text>
            </Pressable>
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle-outline" size={28} color="#059669" />
            </View>
            <Text style={styles.stateTitle}>
              {hi ? 'कोई डॉक्यूमेंट जल्द समाप्त नहीं हो रहा' : 'No documents expiring soon'}
            </Text>
            <Text style={styles.stateSubtitle}>
              {hi
                ? 'आपके फ्लीट में कोई पेपर expired नहीं है और न ही अगले 30 दिनों में expiry है।'
                : 'No fleet document is expired or expiring within the next 30 days.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {documents.map((item, index) => {
              const urgent = item.daysLeft <= 7;
              const labels: Record<ExpiringDocument['documentType'], string> = {
                Insurance: hi ? 'इंश्योरेंस' : 'Insurance',
                'Fitness Certificate': hi ? 'फिटनेस सर्टिफिकेट' : 'Fitness Certificate',
                Tax: 'Tax',
                PUCC: 'PUCC',
                Permit: hi ? 'परमिट' : 'Permit',
                'National Permit': hi ? 'नेशनल परमिट' : 'National Permit',
              };
              const label = labels[item.documentType];

              const timing =
                item.daysLeft < 0
                  ? hi
                    ? `${Math.abs(item.daysLeft)} दिन पहले समाप्त`
                    : `Expired ${Math.abs(item.daysLeft)} days ago`
                  : item.daysLeft === 0
                    ? hi
                      ? 'आज समाप्त हो रहा है'
                      : 'Expires today'
                    : item.daysLeft === 1
                      ? hi
                        ? '1 दिन बाकी'
                        : '1 day left'
                      : hi
                        ? `${item.daysLeft} दिन बाकी`
                        : `${item.daysLeft} days left`;

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.documentRow,
                    index !== documents.length - 1 && styles.rowBorder,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    if (item.truckId) {
                      router.push({
                        pathname: '/truck-details',
                        params: { truckId: item.truckId },
                      });
                    }
                  }}
                >
                  <View style={[styles.documentIcon, urgent && styles.documentIconUrgent]}>
                    <Ionicons
                      name={item.documentType === 'Insurance'
                        ? 'shield-checkmark-outline'
                        : item.documentType === 'PUCC'
                          ? 'leaf-outline'
                          : item.documentType.includes('Permit')
                            ? 'map-outline'
                            : 'document-text-outline'}
                      size={21}
                      color={urgent ? '#DC2626' : colors.warning}
                    />
                  </View>

                  <View style={styles.documentInfo}>
                    <Text style={styles.truckNumber}>{item.truckNumber}</Text>
                    <Text style={styles.documentName}>{label}</Text>
                    <Text style={styles.expiryDate}>
                      {hi ? 'Expiry: ' : 'Expires: '}{formatDate(item.expiry)}
                    </Text>
                  </View>

                  <View style={styles.timingBox}>
                    <Text style={[styles.timingText, urgent && styles.timingUrgent]}>
                      {timing}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean
) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 45 },
    pressed: { opacity: 0.72 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
    backButton: {
      width: 43,
      height: 43,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 12,
    },
    headerText: { flex: 1 },
    title: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { color: colors.textMuted, fontSize: 10, marginTop: 4, lineHeight: 15 },
    countPill: {
      minWidth: 38,
      height: 34,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: isDark ? '#3A1D23' : '#FFF0F0',
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: { color: '#DC2626', fontSize: 13, fontWeight: '900' },
    listCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    documentRow: {
      minHeight: 100,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    documentIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: isDark ? '#3A2D13' : '#FFF7DF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    documentIconUrgent: { backgroundColor: isDark ? '#3A1D23' : '#FFF0F0' },
    documentInfo: { flex: 1, marginLeft: 12 },
    truckNumber: { color: colors.text, fontSize: 13, fontWeight: '900' },
    documentName: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 3 },
    expiryDate: { color: colors.textMuted, fontSize: 9, marginTop: 5 },
    timingBox: { alignItems: 'flex-end', marginLeft: 8 },
    timingText: { color: colors.warning, fontSize: 9, fontWeight: '900', marginBottom: 4, textAlign: 'right' },
    timingUrgent: { color: '#DC2626' },
    stateCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 30,
      alignItems: 'center',
    },
    stateIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: isDark ? '#3A1D23' : '#FFF0F0',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    successIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: isDark ? '#193238' : '#E8F8F5',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    stateTitle: { color: colors.text, fontSize: 14, fontWeight: '900', textAlign: 'center' },
    stateSubtitle: { color: colors.textMuted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 7 },
    retryButton: {
      marginTop: 17,
      backgroundColor: colors.primary,
      paddingHorizontal: 17,
      paddingVertical: 10,
      borderRadius: 11,
    },
    retryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  });
