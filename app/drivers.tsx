import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
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

type Driver = {
  _id?: string;
  id?: string;
  name?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  address?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
};

export default function DriversScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();

  const styles = createStyles(colors, isDark);
  const hi = language === 'hi';

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menuDriver, setMenuDriver] = useState<Driver | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLicenseNumber, setEditLicenseNumber] = useState('');
  const [editLicenseExpiry, setEditLicenseExpiry] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [savingEdit, setSavingEdit] = useState(false);

  const getDrivers = async (showLoader = true) => {
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

      const response = await fetch(`${API_URL}/api/drivers`, {
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
            (hi ? 'ड्राइवर लोड नहीं हो सके।' : 'Unable to load drivers.')
        );
      }

      /*
       * Supports common backend response formats:
       * { success: true, drivers: [...] }
       * { success: true, data: [...] }
       * { success: true, count: ..., data: [...] }
       */
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.drivers)
          ? data.drivers
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setDrivers(list);
    } catch (err) {
      console.error('Get drivers error:', err);

      setError(
        err instanceof Error
          ? err.message
          : hi
            ? 'ड्राइवर लोड नहीं हो सके।'
            : 'Unable to load drivers.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getDrivers(true);
    }, [language])
  );

  const onRefresh = () => {
    setRefreshing(true);
    getDrivers(false);
  };

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return drivers;

    return drivers.filter((driver) => {
      const values = [
        driver.name,
        driver.phone,
        driver.licenseNumber,
        driver.address,
        driver.status,
      ];

      return values.some((value) =>
        String(value || '').toLowerCase().includes(query)
      );
    });
  }, [drivers, search]);

  const activeDrivers = drivers.filter(
    (driver) =>
      driver.isActive === true ||
      String(driver.status || '').toLowerCase() === 'active'
  ).length;

  const inactiveDrivers = drivers.length - activeDrivers;

  const getInitials = (name?: string) => {
    if (!name?.trim()) return 'DR';

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const getStatus = (driver: Driver) => {
    const status = String(driver.status || '').toLowerCase();

    if (
      driver.isActive === true ||
      status === 'active' ||
      status === 'available'
    ) {
      return 'active';
    }

    return 'inactive';
  };

  const getLicenseState = (expiry?: string) => {
    if (!expiry) return 'unknown';

    const date = new Date(expiry);

    if (Number.isNaN(date.getTime())) return 'unknown';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const difference =
      date.getTime() - today.getTime();

    const days = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    if (days < 0) return 'expired';
    if (days <= 30) return 'soon';

    return 'valid';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
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

  const handleCall = async (phone?: string) => {
    if (!phone || !phone.trim()) {
      Alert.alert(
        hi ? 'फोन नंबर उपलब्ध नहीं' : 'Phone unavailable',
        hi
          ? 'इस ड्राइवर का फोन नंबर उपलब्ध नहीं है।'
          : 'This driver does not have a phone number.'
      );
      return;
    }

    // Remove spaces, dashes and brackets so Android receives a clean number.
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanPhone}`;

    try {
      // On Android/iOS this opens the native phone dialer.
      await Linking.openURL(url);
    } catch (error) {
      console.error('Call error:', error);

      Alert.alert(
        hi ? 'कॉल शुरू नहीं हो सकी' : 'Unable to start call',
        hi
          ? 'कृपया नंबर जांचें और दोबारा कोशिश करें।'
          : 'Please check the phone number and try again.'
      );
    }
  };

  const openDriverMenu = (driver: Driver) => {
    setMenuDriver(driver);
  };

  const openEditDriver = (driver: Driver) => {
    setMenuDriver(null);
    setEditingDriver(driver);
    setEditName(driver.name || '');
    setEditPhone(driver.phone || '');
    setEditLicenseNumber(driver.licenseNumber || '');
    setEditLicenseExpiry(
      driver.licenseExpiry
        ? new Date(driver.licenseExpiry).toISOString().slice(0, 10)
        : ''
    );
    setEditAddress(driver.address || '');
    setEditStatus(
      String(driver.status || '').toLowerCase() === 'inactive'
        ? 'inactive'
        : 'active'
    );
  };

  const closeEditDriver = () => {
    if (savingEdit) return;
    setEditingDriver(null);
  };

  const saveEditedDriver = async () => {
    try {
      const driverId = editingDriver?._id || editingDriver?.id;
      if (!driverId) {
        Alert.alert(
          hi ? 'ड्राइवर ID नहीं मिली' : 'Driver ID missing'
        );
        return;
      }

      if (
        !editName.trim() ||
        !editPhone.trim() ||
        !editLicenseNumber.trim() ||
        !editLicenseExpiry.trim()
      ) {
        Alert.alert(
          hi ? 'जानकारी अधूरी है' : 'Missing information',
          hi
            ? 'नाम, फोन, लाइसेंस नंबर और लाइसेंस समाप्ति जरूरी है।'
            : 'Name, phone, license number and license expiry are required.'
        );
        return;
      }

      const expiryDate = new Date(editLicenseExpiry.trim());
      if (Number.isNaN(expiryDate.getTime())) {
        Alert.alert(
          hi ? 'गलत तारीख' : 'Invalid date',
          hi
            ? 'लाइसेंस समाप्ति तारीख YYYY-MM-DD में डालें।'
            : 'Enter license expiry as YYYY-MM-DD.'
        );
        return;
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/');
        return;
      }

      setSavingEdit(true);

      const response = await fetch(
        `${API_URL}/api/drivers/${driverId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editName.trim(),
            phone: editPhone.trim(),
            licenseNumber: editLicenseNumber.trim(),
            licenseExpiry: editLicenseExpiry.trim(),
            address: editAddress.trim(),
            status: editStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (hi
              ? 'ड्राइवर अपडेट नहीं हो सका।'
              : 'Unable to update driver.')
        );
      }

      const updatedDriver = data?.driver;

      setDrivers((current) =>
        current.map((driver) =>
          (driver._id || driver.id) === driverId
            ? updatedDriver || {
                ...driver,
                name: editName.trim(),
                phone: editPhone.trim(),
                licenseNumber: editLicenseNumber.trim(),
                licenseExpiry: editLicenseExpiry.trim(),
                address: editAddress.trim(),
                status: editStatus,
              }
            : driver
        )
      );

      setEditingDriver(null);

      Alert.alert(
        hi ? 'ड्राइवर अपडेट हो गया' : 'Driver updated',
        hi
          ? `${editName.trim()} की जानकारी अपडेट हो गई है।`
          : `${editName.trim()}'s information has been updated.`
      );
    } catch (err) {
      console.error('Update driver error:', err);

      Alert.alert(
        hi ? 'अपडेट नहीं हुआ' : 'Update failed',
        err instanceof Error
          ? err.message
          : hi
            ? 'ड्राइवर अपडेट नहीं हो सका।'
            : 'Unable to update driver.'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteDriver = (driver: Driver) => {
    setMenuDriver(null);

    const driverId = driver._id || driver.id;
    if (!driverId) {
      Alert.alert(
        hi ? 'ड्राइवर ID नहीं मिली' : 'Driver ID missing'
      );
      return;
    }

    Alert.alert(
      hi ? 'ड्राइवर हटाएं?' : 'Delete driver?',
      hi
        ? `${driver.name || 'यह ड्राइवर'} को स्थायी रूप से हटाना है?`
        : `Are you sure you want to permanently delete ${driver.name || 'this driver'}?`,
      [
        {
          text: hi ? 'रद्द करें' : 'Cancel',
          style: 'cancel',
        },
        {
          text: hi ? 'हटाएं' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');

              if (!token) {
                router.replace('/');
                return;
              }

              const response = await fetch(
                `${API_URL}/api/drivers/${driverId}`,
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
                      ? 'ड्राइवर हटाया नहीं जा सका।'
                      : 'Unable to delete driver.')
                );
              }

              setDrivers((current) =>
                current.filter(
                  (item) =>
                    (item._id || item.id) !== driverId
                )
              );

              Alert.alert(
                hi ? 'ड्राइवर हटा दिया गया' : 'Driver deleted',
                hi
                  ? `${driver.name || 'ड्राइवर'} को हटा दिया गया है।`
                  : `${driver.name || 'Driver'} has been deleted.`
              );
            } catch (err) {
              console.error('Delete driver error:', err);

              Alert.alert(
                hi ? 'डिलीट नहीं हुआ' : 'Delete failed',
                err instanceof Error
                  ? err.message
                  : hi
                    ? 'ड्राइवर हटाया नहीं जा सका।'
                    : 'Unable to delete driver.'
              );
            }
          },
        },
      ]
    );
  };

  const handleRetry = () => {
    getDrivers(true);
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
                {hi ? 'ड्राइवर' : 'Drivers'}
              </Text>

              <Text style={styles.headerSubtitle}>
                {hi
                  ? 'अपनी ड्राइवर टीम मैनेज करें'
                  : 'Manage your driver team'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/add-driver')}
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
              name="people-outline"
              size={29}
              color={colors.primary}
            />
          </View>

          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              {hi ? 'ड्राइवर कमांड सेंटर' : 'Driver Command Center'}
            </Text>

            <Text style={styles.heroSubtitle}>
              {hi
                ? 'अपने ड्राइवरों की स्थिति और लाइसेंस जानकारी एक जगह देखें।'
                : 'Monitor your drivers, status and license information in one place.'}
            </Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatCard
            icon="people-outline"
            label={hi ? 'कुल ड्राइवर' : 'Total Drivers'}
            value={drivers.length}
            colors={colors}
            styles={styles}
          />

          <StatCard
            icon="checkmark-circle-outline"
            label={hi ? 'सक्रिय' : 'Active'}
            value={activeDrivers}
            colors={colors}
            styles={styles}
          />

          <StatCard
            icon="pause-circle-outline"
            label={hi ? 'निष्क्रिय' : 'Inactive'}
            value={inactiveDrivers}
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
                ? 'नाम, फोन या लाइसेंस से खोजें...'
                : 'Search by name, phone or license...'
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

        {/* SECTION TITLE */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {hi ? 'आपके ड्राइवर' : 'Your Drivers'}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredDrivers.length}{' '}
              {hi ? 'ड्राइवर दिखाई दे रहे हैं' : 'drivers showing'}
            </Text>
          </View>

          <View style={styles.livePill}>
            <View style={styles.liveDot} />

            <Text style={styles.liveText}>
              {hi ? 'LIVE' : 'LIVE'}
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
              {hi ? 'ड्राइवर लोड हो रहे हैं' : 'Loading drivers'}
            </Text>

            <Text style={styles.stateSubtitle}>
              {hi
                ? 'कृपया कुछ सेकंड प्रतीक्षा करें...'
                : 'Please wait a moment...'}
            </Text>
          </View>
        ) : error ? (
          /* ERROR */
          <View style={styles.stateCard}>
            <View style={styles.stateIconError}>
              <Ionicons
                name="cloud-offline-outline"
                size={28}
                color={colors.danger}
              />
            </View>

            <Text style={styles.stateTitle}>
              {hi ? 'कुछ गलत हो गया' : 'Something went wrong'}
            </Text>

            <Text style={styles.stateSubtitle}>
              {error}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleRetry}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.retryText}>
                {hi ? 'फिर से कोशिश करें' : 'Try again'}
              </Text>
            </Pressable>
          </View>
        ) : filteredDrivers.length === 0 ? (
          /* EMPTY */
          <View style={styles.stateCard}>
            <View style={styles.stateIcon}>
              <Ionicons
                name={
                  search.trim()
                    ? 'search-outline'
                    : 'person-add-outline'
                }
                size={29}
                color={colors.primary}
              />
            </View>

            <Text style={styles.stateTitle}>
              {search.trim()
                ? hi
                  ? 'कोई ड्राइवर नहीं मिला'
                  : 'No drivers found'
                : hi
                  ? 'अभी कोई ड्राइवर नहीं'
                  : 'No drivers yet'}
            </Text>

            <Text style={styles.stateSubtitle}>
              {search.trim()
                ? hi
                  ? 'अपनी search बदलकर फिर कोशिश करें।'
                  : 'Try changing your search.'
                : hi
                  ? 'अपनी फ्लीट शुरू करने के लिए पहला ड्राइवर जोड़ें।'
                  : 'Add your first driver to start building your fleet.'}
            </Text>

            {!search.trim() && (
              <Pressable
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.push('/add-driver')}
              >
                <Ionicons
                  name="add"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.emptyButtonText}>
                  {hi ? 'ड्राइवर जोड़ें' : 'Add Driver'}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* DRIVER LIST */
          <View style={styles.list}>
            {filteredDrivers.map((driver, index) => {
              const status = getStatus(driver);
              const licenseState = getLicenseState(
                driver.licenseExpiry
              );

              const active = status === 'active';

              return (
                <View
                  key={
                    driver._id ||
                    driver.id ||
                    `${driver.licenseNumber}-${index}`
                  }
                  style={styles.driverCard}
                >
                  {/* CARD TOP */}
                  <View style={styles.driverTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {getInitials(driver.name)}
                      </Text>
                    </View>

                    <View style={styles.driverIdentity}>
                      <Text
                        style={styles.driverName}
                        numberOfLines={1}
                      >
                        {driver.name || (hi ? 'अनाम ड्राइवर' : 'Unnamed Driver')}
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

                    <View style={styles.cardActions}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.callButton,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => handleCall(driver.phone)}
                      >
                        <Ionicons
                          name="call-outline"
                          size={19}
                          color={colors.primary}
                        />
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.menuButton,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => openDriverMenu(driver)}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={19}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* DETAILS */}
                  <View style={styles.divider} />

                  <View style={styles.detailsGrid}>
                    <DetailItem
                      icon="call-outline"
                      label={hi ? 'फोन' : 'PHONE'}
                      value={driver.phone || '--'}
                      colors={colors}
                      styles={styles}
                    />

                    <DetailItem
                      icon="card-outline"
                      label={hi ? 'लाइसेंस' : 'LICENSE'}
                      value={driver.licenseNumber || '--'}
                      colors={colors}
                      styles={styles}
                    />
                  </View>

                  <View style={styles.detailsGrid}>
                    <DetailItem
                      icon="calendar-outline"
                      label={
                        hi
                          ? 'लाइसेंस समाप्ति'
                          : 'LICENSE EXPIRY'
                      }
                      value={formatDate(driver.licenseExpiry)}
                      colors={colors}
                      styles={styles}
                      valueColor={
                        licenseState === 'expired'
                          ? colors.danger
                          : licenseState === 'soon'
                            ? colors.warning
                            : colors.text
                      }
                    />

                    <DetailItem
                      icon="location-outline"
                      label={hi ? 'पता' : 'ADDRESS'}
                      value={driver.address || '--'}
                      colors={colors}
                      styles={styles}
                    />
                  </View>

                  {/* LICENSE ALERT */}
                  {licenseState !== 'unknown' && (
                    <View
                      style={[
                        styles.licenseBanner,
                        {
                          backgroundColor:
                            licenseState === 'expired'
                              ? isDark
                                ? '#3A171B'
                                : '#FFF1F2'
                              : licenseState === 'soon'
                                ? isDark
                                  ? '#3B2C10'
                                  : '#FFF8E7'
                                : isDark
                                  ? '#12352F'
                                  : '#ECFDF5',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          licenseState === 'expired'
                            ? 'warning-outline'
                            : licenseState === 'soon'
                              ? 'time-outline'
                              : 'shield-checkmark-outline'
                        }
                        size={17}
                        color={
                          licenseState === 'expired'
                            ? colors.danger
                            : licenseState === 'soon'
                              ? colors.warning
                              : colors.success
                        }
                      />

                      <Text
                        style={[
                          styles.licenseBannerText,
                          {
                            color:
                              licenseState === 'expired'
                                ? colors.danger
                                : licenseState === 'soon'
                                  ? colors.warning
                                  : colors.success,
                          },
                        ]}
                      >
                        {licenseState === 'expired'
                          ? hi
                            ? 'लाइसेंस समाप्त हो चुका है'
                            : 'License has expired'
                          : licenseState === 'soon'
                            ? hi
                              ? 'लाइसेंस जल्द समाप्त होगा'
                              : 'License expires soon'
                            : hi
                              ? 'लाइसेंस वैध है'
                              : 'License is valid'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* DRIVER ACTION MENU */}
        <Modal
          visible={menuDriver !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuDriver(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMenuDriver(null)}
          >
            <Pressable
              style={styles.actionSheet}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={styles.sheetHandle} />

              <Text style={styles.actionSheetTitle}>
                {menuDriver?.name || (hi ? 'ड्राइवर' : 'Driver')}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  menuDriver && openEditDriver(menuDriver)
                }
              >
                <View style={styles.actionIcon}>
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.actionText}>
                  {hi ? 'ड्राइवर एडिट करें' : 'Edit Driver'}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  menuDriver && confirmDeleteDriver(menuDriver)
                }
              >
                <View
                  style={[
                    styles.actionIcon,
                    styles.deleteActionIcon,
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.danger}
                  />
                </View>
                <Text
                  style={[
                    styles.actionText,
                    { color: colors.danger },
                  ]}
                >
                  {hi ? 'ड्राइवर डिलीट करें' : 'Delete Driver'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.cancelAction}
                onPress={() => setMenuDriver(null)}
              >
                <Text style={styles.cancelActionText}>
                  {hi ? 'रद्द करें' : 'Cancel'}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* EDIT DRIVER MODAL */}
        <Modal
          visible={editingDriver !== null}
          transparent
          animationType="slide"
          onRequestClose={closeEditDriver}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editModal}>
              <View style={styles.editHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editTitle}>
                    {hi ? 'ड्राइवर एडिट करें' : 'Edit Driver'}
                  </Text>
                  <Text style={styles.editSubtitle}>
                    {hi
                      ? 'ड्राइवर की जानकारी अपडेट करें'
                      : 'Update driver information'}
                  </Text>
                </View>

                <Pressable
                  style={styles.modalCloseButton}
                  onPress={closeEditDriver}
                  disabled={savingEdit}
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.editContent}
              >
                <Text style={styles.inputLabel}>
                  {hi ? 'नाम' : 'NAME'}
                </Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={hi ? 'ड्राइवर का नाम' : 'Driver name'}
                  placeholderTextColor={colors.textMuted}
                  style={styles.editInput}
                />

                <Text style={styles.inputLabel}>
                  {hi ? 'फोन' : 'PHONE'}
                </Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="9876543210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  style={styles.editInput}
                />

                <Text style={styles.inputLabel}>
                  {hi ? 'लाइसेंस नंबर' : 'LICENSE NUMBER'}
                </Text>
                <TextInput
                  value={editLicenseNumber}
                  onChangeText={setEditLicenseNumber}
                  placeholder={hi ? 'लाइसेंस नंबर' : 'License number'}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  style={styles.editInput}
                />

                <Text style={styles.inputLabel}>
                  {hi ? 'लाइसेंस समाप्ति' : 'LICENSE EXPIRY'}
                </Text>
                <TextInput
                  value={editLicenseExpiry}
                  onChangeText={setEditLicenseExpiry}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                  style={styles.editInput}
                />

                <Text style={styles.inputLabel}>
                  {hi ? 'पता' : 'ADDRESS'}
                </Text>
                <TextInput
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder={hi ? 'पता' : 'Address'}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  style={[styles.editInput, styles.addressInput]}
                />

                <Text style={styles.inputLabel}>
                  {hi ? 'स्थिति' : 'STATUS'}
                </Text>
                <View style={styles.statusSelector}>
                  <Pressable
                    style={[
                      styles.statusOption,
                      editStatus === 'active' &&
                        styles.statusOptionActive,
                    ]}
                    onPress={() => setEditStatus('active')}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        editStatus === 'active' &&
                          styles.statusOptionTextActive,
                      ]}
                    >
                      {hi ? 'सक्रिय' : 'Active'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.statusOption,
                      editStatus === 'inactive' &&
                        styles.statusOptionInactive,
                    ]}
                    onPress={() => setEditStatus('inactive')}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        editStatus === 'inactive' &&
                          styles.statusOptionTextInactive,
                      ]}
                    >
                      {hi ? 'निष्क्रिय' : 'Inactive'}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.buttonPressed,
                    savingEdit && styles.disabledButton,
                  ]}
                  onPress={saveEditedDriver}
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={19}
                      color="#FFFFFF"
                    />
                  )}

                  <Text style={styles.saveButtonText}>
                    {savingEdit
                      ? hi
                        ? 'सेव हो रहा है...'
                        : 'Saving...'
                      : hi
                        ? 'सेव करें'
                        : 'Save Changes'}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* FOOTER */}
        {!loading && !error && drivers.length > 0 && (
          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={colors.success}
            />

            <Text style={styles.footerText}>
              {hi
                ? 'आपकी ड्राइवर जानकारी सुरक्षित है'
                : 'Your driver information is securely protected'}
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

      <Text style={styles.statValue}>{value}</Text>

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
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: any;
  styles: any;
  valueColor?: string;
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
          style={[
            styles.detailValue,
            valueColor ? { color: valueColor } : null,
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
      letterSpacing: -0.3,
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
      letterSpacing: -0.2,
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

    driverCard: {
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

    driverTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    avatar: {
      width: 52,
      height: 52,
      borderRadius: 17,
      backgroundColor: isDark
        ? '#173A5A'
        : '#E5F0FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '900',
    },

    driverIdentity: {
      flex: 1,
      marginLeft: 12,
    },

    driverName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '900',
    },

    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
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

    callButton: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: isDark
        ? '#172F4A'
        : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    menuButton: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.48)',
      justifyContent: 'flex-end',
    },

    actionSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 28,
      borderWidth: 1,
      borderColor: colors.border,
    },

    sheetHandle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 18,
    },

    actionSheetTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
      marginBottom: 12,
    },

    actionRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    actionIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDark ? '#172F4A' : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    deleteActionIcon: {
      backgroundColor: isDark ? '#3A171B' : '#FFF1F2',
    },

    actionText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },

    cancelAction: {
      minHeight: 48,
      borderRadius: 14,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },

    cancelActionText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '900',
    },

    editModal: {
      maxHeight: '92%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingTop: 18,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },

    editHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    editTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
    },

    editSubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 4,
    },

    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },

    editContent: {
      paddingTop: 17,
      paddingBottom: 35,
    },

    inputLabel: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.7,
      marginBottom: 7,
      marginTop: 11,
    },

    editInput: {
      minHeight: 48,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
      paddingHorizontal: 13,
      fontSize: 12,
    },

    addressInput: {
      minHeight: 80,
      paddingTop: 12,
      textAlignVertical: 'top',
    },

    statusSelector: {
      flexDirection: 'row',
      gap: 9,
    },

    statusOption: {
      flex: 1,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },

    statusOptionActive: {
      backgroundColor: isDark ? '#12352F' : '#ECFDF5',
      borderColor: colors.success,
    },

    statusOptionInactive: {
      backgroundColor: isDark ? '#252525' : '#F3F4F6',
      borderColor: colors.textMuted,
    },

    statusOptionText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
    },

    statusOptionTextActive: {
      color: colors.success,
    },

    statusOptionTextInactive: {
      color: colors.textSecondary,
    },

    saveButton: {
      minHeight: 50,
      borderRadius: 14,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: 22,
    },

    disabledButton: {
      opacity: 0.65,
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
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

    licenseBanner: {
      minHeight: 38,
      borderRadius: 11,
      paddingHorizontal: 11,
      flexDirection: 'row',
      alignItems: 'center',
    },

    licenseBannerText: {
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

    stateIcon: {
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

    stateIconError: {
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

    retryButton: {
      height: 45,
      paddingHorizontal: 18,
      borderRadius: 13,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 19,
      gap: 7,
    },

    retryText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },

    buttonPressed: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },

    emptyButton: {
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

    emptyButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
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