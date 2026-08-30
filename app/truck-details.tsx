import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
  driver?: Driver | string | null;
};

type Driver = {
  _id?: string;
  id?: string;
  name?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  status?: string;
  isActive?: boolean;
};

export default function TruckDetailsScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();

  const styles = createStyles(colors, isDark);
  const hi = language === 'hi';

  const params = useLocalSearchParams<{
    id?: string;
    truckId?: string;
    registrationNumber?: string;
  }>();

  const truckId = String(params.truckId || params.id || '');

  const [truck, setTruck] = useState<Truck | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignedDriver, setAssignedDriver] =
    useState<Driver | null>(null);

  const [loading, setLoading] = useState(true);
  const [driversLoading, setDriversLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showTruckMenu, setShowTruckMenu] = useState(false);

  const getTruck = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      /*
       * We first fetch the fleet list because the current trucks
       * endpoint is already known to return the truck collection.
       */
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
            (hi
              ? 'ट्रक की जानकारी लोड नहीं हो सकी।'
              : 'Unable to load truck details.')
        );
      }

      const list: Truck[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.trucks)
          ? data.trucks
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const found = list.find((item) => {
        const currentId = String(item._id || item.id || '');

        return (
          (truckId && currentId === truckId) ||
          (!truckId &&
            params.registrationNumber &&
            (item.registrationNumber ===
              params.registrationNumber ||
              item.vehicleNumber ===
                params.registrationNumber))
        );
      });

      if (found) {
        setTruck(found);
        if (found.driver && typeof found.driver === 'object') {
          setAssignedDriver(found.driver);
        } else {
          setAssignedDriver(null);
        }
      } else if (list.length > 0 && !truckId) {
        /*
         * Fallback for direct opening while we are still wiring
         * dynamic navigation.
         */
        setTruck(list[0]);
        if (list[0].driver && typeof list[0].driver === 'object') {
          setAssignedDriver(list[0].driver);
        } else {
          setAssignedDriver(null);
        }
      } else {
        setTruck(null);
      }
    } catch (error) {
      console.error('Truck details error:', error);

      Alert.alert(
        hi ? 'त्रुटि' : 'Error',
        error instanceof Error
          ? error.message
          : hi
            ? 'ट्रक की जानकारी नहीं मिल सकी।'
            : 'Unable to load truck details.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getDrivers = async () => {
    try {
      setDriversLoading(true);

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
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
            (hi
              ? 'ड्राइवर लोड नहीं हो सके।'
              : 'Unable to load drivers.')
        );
      }

      const list: Driver[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.drivers)
          ? data.drivers
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setDrivers(list);
    } catch (error) {
      console.error('Drivers loading error:', error);

      Alert.alert(
        hi ? 'ड्राइवर लोड नहीं हुए' : 'Drivers unavailable',
        error instanceof Error
          ? error.message
          : hi
            ? 'ड्राइवर सूची लोड नहीं हो सकी।'
            : 'Driver list could not be loaded.'
      );
    } finally {
      setDriversLoading(false);
    }
  };

  useEffect(() => {
    getTruck();
  }, [truckId, language]);

  const openDriverPicker = async () => {
    setShowDriverModal(true);

    if (drivers.length === 0) {
      await getDrivers();
    }
  };

 const assignDriver = async (driver: Driver) => {
  try {
    const currentTruckId = truck?._id || truck?.id;
    const driverId = driver._id || driver.id;

    if (!currentTruckId) {
      Alert.alert(
        hi ? 'ट्रक ID नहीं मिली' : 'Truck ID missing'
      );
      return;
    }

    if (!driverId) {
      Alert.alert(
        hi ? 'ड्राइवर ID नहीं मिली' : 'Driver ID missing'
      );
      return;
    }

    setAssigning(true);

    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      router.replace('/');
      return;
    }

    const response = await fetch(
      `${API_URL}/api/trucks/${currentTruckId}/driver`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
          (hi
            ? 'ड्राइवर असाइन नहीं हो सका।'
            : 'Unable to assign driver.')
      );
    }

    const savedDriver = data?.truck?.driver || driver;

    setAssignedDriver(savedDriver);

    setTruck((current) =>
      current
        ? {
            ...current,
            driver: savedDriver,
          }
        : current
    );

    setShowDriverModal(false);

    Alert.alert(
      hi ? 'ड्राइवर असाइन हो गया' : 'Driver assigned',
      hi
        ? `${driver.name || 'ड्राइवर'} को इस ट्रक के लिए असाइन किया गया है।`
        : `${driver.name || 'Driver'} has been assigned to this truck.`
    );
  } catch (error) {
    console.error('Assign driver error:', error);

    Alert.alert(
      hi ? 'असाइन नहीं हुआ' : 'Assignment failed',
      error instanceof Error
        ? error.message
        : hi
          ? 'ड्राइवर असाइन नहीं हो सका।'
          : 'Unable to assign driver.'
    );
  } finally {
    setAssigning(false);
  }
};

  const unassignDriver = () => {
    Alert.alert(
      hi ? 'ड्राइवर हटाएं?' : 'Unassign driver?',
      hi
        ? 'क्या आप इस ट्रक से ड्राइवर हटाना चाहते हैं?'
        : 'Do you want to remove the assigned driver from this truck?',
      [
        {
          text: hi ? 'रद्द करें' : 'Cancel',
          style: 'cancel',
        },
        {
          text: hi ? 'हटाएं' : 'Unassign',
          style: 'destructive',
          onPress: () => setAssignedDriver(null),
        },
      ]
    );
  };

  const getStatus = () => {
    if (!truck) return 'inactive';

    const status = String(
      truck.status || ''
    ).toLowerCase();

    if (
      truck.isActive === true ||
      status === 'active' ||
      status === 'available'
    ) {
      return 'active';
    }

    return 'inactive';
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

  const getExpiryState = (value?: string) => {
    if (!value) return 'unknown';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'unknown';
    }

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

  const truckNumber =
    truck?.registrationNumber ||
    truck?.vehicleNumber ||
    truck?.name ||
    (hi ? 'ट्रक' : 'Truck');

  const truckType =
    truck?.truckType ||
    truck?.type ||
    truck?.model ||
    (hi ? 'ट्रक' : 'Truck');

  const status = getStatus();

  const insuranceState = getExpiryState(
    truck?.insuranceExpiry
  );

  const fitnessState = getExpiryState(
    truck?.fitnessExpiry
  );

  const activeDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          driver.isActive === true ||
          ['active', 'available'].includes(
            String(driver.status || '').toLowerCase()
          )
      ),
    [drivers]
  );

  const closeTruckMenu = () => setShowTruckMenu(false);

  const handleTruckStatus = () => {
    const nextStatus = status === 'active' ? 'inactive' : 'active';
    closeTruckMenu();
    Alert.alert(
      nextStatus === 'active' ? (hi ? 'ट्रक एक्टिव करें?' : 'Activate Truck?') : (hi ? 'ट्रक निष्क्रिय करें?' : 'Deactivate Truck?'),
      nextStatus === 'active'
        ? (hi ? 'क्या आप इस ट्रक को active करना चाहते हैं?' : 'Do you want to activate this truck?')
        : (hi ? 'क्या आप इस ट्रक को inactive करना चाहते हैं?' : 'Do you want to deactivate this truck?'),
      [
        { text: hi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: nextStatus === 'active' ? (hi ? 'एक्टिव करें' : 'Activate') : (hi ? 'निष्क्रिय करें' : 'Deactivate'),
          style: nextStatus === 'active' ? 'default' : 'destructive',
          onPress: () => setTruck((current) => current ? { ...current, status: nextStatus, isActive: nextStatus === 'active' } : current),
        },
      ]
    );
  };

  const handleDeleteTruck = () => {
    const currentTruckId = truck?._id || truck?.id;

    if (!currentTruckId) {
      Alert.alert(
        hi ? 'ट्रक ID नहीं मिली' : 'Truck ID missing',
        hi ? 'ट्रक डिलीट नहीं किया जा सकता।' : 'Unable to delete this truck.'
      );
      return;
    }

    Alert.alert(
      hi ? 'ट्रक डिलीट करें?' : 'Delete Truck?',
      hi
        ? `${truckNumber} को स्थायी रूप से डिलीट किया जाएगा।`
        : `${truckNumber} will be permanently deleted.`,
      [
        { text: hi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: hi ? 'डिलीट करें' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');

              if (!token) {
                router.replace('/');
                return;
              }

              const response = await fetch(
                `${API_URL}/api/trucks/${currentTruckId}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                  },
                }
              );

              const data = await response.json().catch(() => ({}));

              if (!response.ok) {
                throw new Error(
                  data?.message ||
                    (hi
                      ? 'ट्रक डिलीट नहीं हो सका।'
                      : 'Unable to delete truck.')
                );
              }

              setShowTruckMenu(false);

              Alert.alert(
                hi ? 'डिलीट हो गया' : 'Deleted',
                hi
                  ? 'ट्रक सफलतापूर्वक डिलीट हो गया।'
                  : 'Truck deleted successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error) {
              console.error('Delete truck error:', error);
              Alert.alert(
                hi ? 'डिलीट असफल' : 'Delete failed',
                error instanceof Error
                  ? error.message
                  : hi
                    ? 'ट्रक डिलीट नहीं हो सका।'
                    : 'Unable to delete truck.'
              );
            }
          },
        },
      ]
    );
  };

  const handleTruckDocuments = () => {
    const currentTruckId = truck?._id || truck?.id;
    closeTruckMenu();
    if (!currentTruckId) {
      Alert.alert(hi ? 'ट्रक ID नहीं मिली' : 'Truck ID missing', hi ? 'पेपर्स स्क्रीन नहीं खोली जा सकती।' : 'Unable to open papers for this truck.');
      return;
    }
    router.push({
      pathname: '/papers',
      params: { truckId: String(currentTruckId), truckNumber: String(truckNumber) },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingTitle}>
          {hi
            ? 'ट्रक की जानकारी लोड हो रही है'
            : 'Loading truck details'}
        </Text>

        <Text style={styles.loadingSubtitle}>
          {hi
            ? 'कृपया कुछ सेकंड प्रतीक्षा करें...'
            : 'Please wait a moment...'}
        </Text>
      </View>
    );
  }

  if (!truck) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="car-outline"
            size={31}
            color={colors.primary}
          />
        </View>

        <Text style={styles.loadingTitle}>
          {hi ? 'ट्रक नहीं मिला' : 'Truck not found'}
        </Text>

        <Text style={styles.loadingSubtitle}>
          {hi
            ? 'इस ट्रक की जानकारी उपलब्ध नहीं है।'
            : 'The requested truck could not be found.'}
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
                {hi ? 'ट्रक विवरण' : 'Truck Details'}
              </Text>

              <Text style={styles.headerSubtitle}>
                {hi
                  ? 'वाहन की पूरी जानकारी'
                  : 'Complete vehicle information'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              console.log('[TruckDetails] 3-dot menu pressed');
              setShowTruckMenu(true);
            }}
            hitSlop={16}
            style={({ pressed }) => [
              styles.headerIcon,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={hi ? 'ट्रक विकल्प खोलें' : 'Open truck options'}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={23}
              color={colors.text}
            />
          </Pressable>
        </View>

        {/* TRUCK HERO */}
        <View style={styles.truckHero}>
          <View style={styles.truckHeroTop}>
            <View style={styles.bigTruckIcon}>
              <Ionicons
                name="car-sport"
                size={39}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.heroIdentity}>
              <Text style={styles.heroTruckNumber}>
                {truckNumber}
              </Text>

              <Text style={styles.heroTruckType}>
                {truckType}
              </Text>

              <View style={styles.heroStatus}>
                <View
                  style={[
                    styles.heroStatusDot,
                    {
                      backgroundColor:
                        status === 'active'
                          ? '#34D399'
                          : '#94A3B8',
                    },
                  ]}
                />

                <Text style={styles.heroStatusText}>
                  {status === 'active'
                    ? hi
                      ? 'सक्रिय'
                      : 'ACTIVE'
                    : hi
                      ? 'निष्क्रिय'
                      : 'INACTIVE'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.heroStats}>
            <HeroStat
              icon="cube-outline"
              label={hi ? 'क्षमता' : 'CAPACITY'}
              value={
                truck.capacity
                  ? `${truck.capacity} ${hi ? 'टन' : 'Tons'}`
                  : '--'
              }
            />

            <View style={styles.heroDivider} />

            <HeroStat
              icon="construct-outline"
              label={hi ? 'मॉडल' : 'MODEL'}
              value={truck.model || '--'}
            />

            <View style={styles.heroDivider} />

            <HeroStat
              icon="shield-checkmark-outline"
              label={hi ? 'स्थिति' : 'STATUS'}
              value={
                status === 'active'
                  ? hi
                    ? 'सक्रिय'
                    : 'Active'
                  : hi
                    ? 'निष्क्रिय'
                    : 'Inactive'
              }
            />
          </View>
        </View>

        {/* ASSIGNED DRIVER */}
        <SectionTitle
          title={hi ? 'असाइन किया गया ड्राइवर' : 'Assigned Driver'}
          subtitle={
            hi
              ? 'इस ट्रक को चलाने वाला ड्राइवर'
              : 'Driver responsible for this truck'
          }
          styles={styles}
          colors={colors}
        />

        {assignedDriver ? (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {(assignedDriver.name || 'DR')
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </Text>
            </View>

            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>
                {assignedDriver.name ||
                  (hi ? 'अनाम ड्राइवर' : 'Unnamed Driver')}
              </Text>

              <Text style={styles.driverPhone}>
                {assignedDriver.phone || '--'}
              </Text>

              <Text style={styles.driverLicense}>
                {assignedDriver.licenseNumber || '--'}
              </Text>
            </View>

            <View style={styles.driverActions}>
              <Pressable
                style={styles.changeButton}
                onPress={openDriverPicker}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={17}
                  color={colors.primary}
                />
              </Pressable>

              <Pressable
                style={styles.removeButton}
                onPress={unassignDriver}
              >
                <Ionicons
                  name="close-outline"
                  size={18}
                  color={colors.danger}
                />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.assignCard,
              pressed && styles.pressed,
            ]}
            onPress={openDriverPicker}
          >
            <View style={styles.assignIcon}>
              <Ionicons
                name="person-add-outline"
                size={24}
                color={colors.primary}
              />
            </View>

            <View style={styles.assignText}>
              <Text style={styles.assignTitle}>
                {hi
                  ? 'ड्राइवर असाइन करें'
                  : 'Assign a Driver'}
              </Text>

              <Text style={styles.assignSubtitle}>
                {hi
                  ? 'इस ट्रक के लिए मौजूदा ड्राइवर चुनें'
                  : 'Select an existing driver for this truck'}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}

        {/* VEHICLE INFORMATION */}
        <SectionTitle
          title={hi ? 'वाहन जानकारी' : 'Vehicle Information'}
          subtitle={
            hi
              ? 'ट्रक की मुख्य जानकारी'
              : 'Core vehicle information'
          }
          styles={styles}
          colors={colors}
        />

        <View style={styles.infoCard}>
          <InfoRow
            icon="barcode-outline"
            label={hi ? 'रजिस्ट्रेशन नंबर' : 'Registration Number'}
            value={truck.registrationNumber || truck.vehicleNumber || '--'}
            styles={styles}
            colors={colors}
          />

          <InfoRow
            icon="car-outline"
            label={hi ? 'वाहन प्रकार' : 'Vehicle Type'}
            value={truckType}
            styles={styles}
            colors={colors}
          />

          <InfoRow
            icon="cube-outline"
            label={hi ? 'लोड क्षमता' : 'Load Capacity'}
            value={
              truck.capacity
                ? `${truck.capacity} ${hi ? 'टन' : 'Tons'}`
                : '--'
            }
            styles={styles}
            colors={colors}
          />

          <InfoRow
            icon="location-outline"
            label={hi ? 'पता' : 'Address'}
            value={truck.address || '--'}
            styles={styles}
            colors={colors}
            last
          />
        </View>

        {/* DOCUMENTS */}
        <SectionTitle
          title={hi ? 'वाहन पेपर्स' : 'Vehicle Papers'}
          subtitle={
            hi
              ? 'बीमा और फिटनेस की स्थिति'
              : 'Insurance and fitness status'
          }
          styles={styles}
          colors={colors}
        />

        <View style={styles.documentsCard}>
          <DocumentRow
            icon="shield-checkmark-outline"
            title={hi ? 'इंश्योरेंस' : 'Insurance'}
            value={formatDate(truck.insuranceExpiry)}
            state={insuranceState}
            hi={hi}
            styles={styles}
            colors={colors}
          />

          <DocumentRow
            icon="document-text-outline"
            title={hi ? 'फिटनेस सर्टिफिकेट' : 'Fitness Certificate'}
            value={formatDate(truck.fitnessExpiry)}
            state={fitnessState}
            hi={hi}
            styles={styles}
            colors={colors}
            last
          />
        </View>

        {/* MODULES */}
        <SectionTitle
          title={hi ? 'फ्लीट मॉड्यूल्स' : 'Fleet Modules'}
          subtitle={
            hi
              ? 'इस ट्रक से जुड़े ऑपरेशन'
              : 'Operations connected to this truck'
          }
          styles={styles}
          colors={colors}
        />

        <View style={styles.moduleGrid}>
          {/* TRIPS */}
          <ModuleCard
            icon="navigate-outline"
            title={hi ? 'ट्रिप्स' : 'Trips'}
            subtitle={
              hi
                ? 'ट्रिप मैनेज करें'
                : 'Manage journeys'
            }
            color="#059669"
            bg={isDark ? '#123329' : '#E8FAF3'}
            styles={styles}
            onPress={() => {
              const currentTruckId = truck?._id || truck?.id;

              if (!currentTruckId) {
                Alert.alert(
                  hi ? 'ट्रक ID नहीं मिली' : 'Truck ID missing',
                  hi
                    ? 'ट्रिप स्क्रीन नहीं खोली जा सकती।'
                    : 'Unable to open trips for this truck.'
                );
                return;
              }

              router.push({
                pathname: '/trips',
                params: {
                  truckId: String(currentTruckId),
                  truckNumber: String(truckNumber),
                  driverId: String(
                    assignedDriver?._id ||
                      assignedDriver?.id ||
                      ''
                  ),
                },
              });
            }}
          />

          {/* PAPERS */}
          <ModuleCard
            icon="document-text-outline"
            title={hi ? 'पेपर्स' : 'Papers'}
            subtitle={
              hi
                ? 'डॉक्यूमेंट्स'
                : 'Documents'
            }
            color="#0891B2"
            bg={isDark ? '#12313A' : '#E6F8FC'}
            styles={styles}
            onPress={() => {
              const currentTruckId = truck?._id || truck?.id;

              if (!currentTruckId) {
                Alert.alert(
                  hi ? 'ट्रक ID नहीं मिली' : 'Truck ID missing',
                  hi
                    ? 'पेपर्स स्क्रीन नहीं खोली जा सकती।'
                    : 'Unable to open papers for this truck.'
                );
                return;
              }

              router.push({
                pathname: '/papers',
                params: {
                  truckId: String(currentTruckId),
                  truckNumber: String(truckNumber),
                },
              });
            }}
          />

        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={colors.success}
          />

          <Text style={styles.footerText}>
            {hi
              ? 'TruckFleet Pro • सुरक्षित फ्लीट मैनेजमेंट'
              : 'TruckFleet Pro • Secure fleet management'}
          </Text>
        </View>
      </ScrollView>

      {/* TRUCK ACTION MENU */}
      <Modal
        visible={showTruckMenu}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeTruckMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeTruckMenu}>
          <Pressable style={styles.menuCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.menuHeader}>
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuTitle}>{hi ? 'ट्रक विकल्प' : 'Truck Options'}</Text>
                <Text style={styles.menuSubtitle} numberOfLines={1}>{truckNumber}</Text>
              </View>
              <Pressable style={styles.menuCloseButton} onPress={closeTruckMenu} hitSlop={8}>
                <Ionicons name="close" size={19} color={colors.text} />
              </Pressable>
            </View>

            <Pressable style={({pressed}) => [styles.menuItem, pressed && styles.pressed]} onPress={handleTruckStatus}>
              <View style={[styles.menuItemIcon, styles.menuStatusIcon]}><Ionicons name={status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'} size={20} color={colors.warning} /></View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{status === 'active' ? (hi ? 'ट्रक निष्क्रिय करें' : 'Deactivate Truck') : (hi ? 'ट्रक एक्टिव करें' : 'Activate Truck')}</Text>
                <Text style={styles.menuItemSubtitle}>{status === 'active' ? (hi ? 'ट्रक को inactive करें' : 'Set truck as inactive') : (hi ? 'ट्रक को active करें' : 'Set truck as active')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <Pressable style={({pressed}) => [styles.menuItem, pressed && styles.pressed]} onPress={handleTruckDocuments}>
              <View style={[styles.menuItemIcon, styles.menuDocumentIcon]}><Ionicons name="document-text-outline" size={19} color={colors.primary} /></View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{hi ? 'डॉक्यूमेंट्स देखें' : 'View Documents'}</Text>
                <Text style={styles.menuItemSubtitle}>{hi ? 'बीमा और फिटनेस पेपर्स देखें' : 'View insurance and fitness documents'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={({pressed}) => [styles.menuItem, styles.menuDeleteItem, pressed && styles.pressed]}
              onPress={handleDeleteTruck}
            >
              <View style={[styles.menuItemIcon, styles.menuDeleteIcon]}><Ionicons name="trash-outline" size={19} color={colors.danger} /></View>
              <View style={styles.menuItemText}>
                <Text style={[styles.menuItemTitle, {color: colors.danger}]}>{hi ? 'ट्रक डिलीट करें' : 'Delete Truck'}</Text>
                <Text style={styles.menuItemSubtitle}>{hi ? 'ट्रक को स्थायी रूप से हटाएं' : 'Permanently remove this truck'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* DRIVER PICKER MODAL */}
      <Modal
        visible={showDriverModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowDriverModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {hi
                    ? 'ड्राइवर चुनें'
                    : 'Select Driver'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {hi
                    ? 'इस ट्रक के लिए ड्राइवर चुनें'
                    : 'Choose a driver for this truck'}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setShowDriverModal(false)
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.text}
                />
              </Pressable>
            </View>

            {driversLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                />

                <Text style={styles.modalLoadingText}>
                  {hi
                    ? 'ड्राइवर लोड हो रहे हैं...'
                    : 'Loading drivers...'}
                </Text>
              </View>
            ) : activeDrivers.length === 0 ? (
              <View style={styles.noDrivers}>
                <View style={styles.noDriversIcon}>
                  <Ionicons
                    name="people-outline"
                    size={28}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.noDriversTitle}>
                  {hi
                    ? 'कोई सक्रिय ड्राइवर नहीं'
                    : 'No active drivers'}
                </Text>

                <Text style={styles.noDriversText}>
                  {hi
                    ? 'पहले Drivers section में एक ड्राइवर जोड़ें।'
                    : 'Add a driver from the Drivers section first.'}
                </Text>

                <Pressable
                  style={styles.primaryButton}
                  onPress={() => {
                    setShowDriverModal(false);
                    router.push('/add-driver');
                  }}
                >
                  <Text style={styles.primaryButtonText}>
                    {hi
                      ? 'ड्राइवर जोड़ें'
                      : 'Add Driver'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.driverPickerList}
              >
                {activeDrivers.map((driver) => {
                  const selected =
                    assignedDriver?._id === driver._id ||
                    assignedDriver?.id === driver.id;

                  return (
                    <Pressable
                      key={driver._id || driver.id}
                      style={({ pressed }) => [
                        styles.driverPickerItem,
                        selected &&
                          styles.driverPickerSelected,
                        pressed && styles.pressed,
                      ]}
                      disabled={assigning}
                      onPress={() =>
                        assignDriver(driver)
                      }
                    >
                      <View style={styles.pickerAvatar}>
                        <Text style={styles.pickerAvatarText}>
                          {(driver.name || 'DR')
                            .split(' ')
                            .map(
                              (part) => part[0]
                            )
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.pickerInfo}>
                        <Text style={styles.pickerName}>
                          {driver.name ||
                            (hi
                              ? 'अनाम ड्राइवर'
                              : 'Unnamed Driver')}
                        </Text>

                        <Text style={styles.pickerDetails}>
                          {driver.phone || '--'}
                        </Text>

                        <Text style={styles.pickerLicense}>
                          {driver.licenseNumber || '--'}
                        </Text>
                      </View>

                      {selected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.success}
                        />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={19}
                          color={colors.textMuted}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
  styles,
}: {
  title: string;
  subtitle: string;
  styles: any;
  colors: any;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.sectionSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={heroStatStyles.stat}>
      <Ionicons
        name={icon}
        size={15}
        color="#93C5FD"
      />

      <Text style={heroStatStyles.label}>
        {label}
      </Text>

      <Text style={heroStatStyles.value}>
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
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  styles: any;
  colors: any;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && styles.infoRowBorder,
      ]}
    >
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={colors.primary}
        />
      </View>

      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text
          style={styles.infoValue}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function DocumentRow({
  icon,
  title,
  value,
  state,
  hi,
  styles,
  colors,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  state: string;
  hi: boolean;
  styles: any;
  colors: any;
  last?: boolean;
}) {
  const stateColor =
    state === 'expired'
      ? colors.danger
      : state === 'soon'
        ? colors.warning
        : state === 'valid'
          ? colors.success
          : colors.textMuted;

  const stateText =
    state === 'expired'
      ? hi
        ? 'Expired'
        : 'Expired'
      : state === 'soon'
        ? hi
          ? 'जल्द समाप्त'
          : 'Expiring Soon'
        : state === 'valid'
          ? hi
            ? 'वैध'
            : 'Valid'
          : hi
            ? 'उपलब्ध नहीं'
            : 'Not available';

  return (
    <View
      style={[
        styles.documentRow,
        !last && styles.documentBorder,
      ]}
    >
      <View
        style={[
          styles.documentIcon,
          {
            backgroundColor:
              state === 'expired'
                ? hi
                  ? '#3A171B'
                  : '#FFF1F2'
                : state === 'soon'
                  ? hi
                    ? '#3B2C10'
                    : '#FFF8E7'
                  : hi
                    ? '#12352F'
                    : '#ECFDF5',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={stateColor}
        />
      </View>

      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle}>
          {title}
        </Text>

        <Text style={styles.documentDate}>
          {value}
        </Text>
      </View>

      <View
        style={[
          styles.documentStatus,
          {
            backgroundColor:
              state === 'expired'
                ? hi
                  ? '#3A171B'
                  : '#FFF1F2'
                : state === 'soon'
                  ? hi
                    ? '#3B2C10'
                    : '#FFF8E7'
                  : hi
                    ? '#12352F'
                    : '#ECFDF5',
          },
        ]}
      >
        <Text
          style={[
            styles.documentStatusText,
            { color: stateColor },
          ]}
        >
          {stateText}
        </Text>
      </View>
    </View>
  );
}

function ModuleCard({
  icon,
  title,
  subtitle,
  color,
  bg,
  styles,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  styles: any;
  onPress?: () => void;
}) {
  return (
   <Pressable
  style={({ pressed }) => [
    styles.moduleCard,
    pressed && styles.pressed,
  ]}
  onPress={onPress}
>
      <View
        style={[
          styles.moduleIcon,
          { backgroundColor: bg },
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={color}
        />
      </View>

      <Text style={styles.moduleTitle}>
        {title}
      </Text>

      <Text style={styles.moduleSubtitle}>
        {subtitle}
      </Text>

      <View
        style={[
          styles.moduleArrow,
          { backgroundColor: bg },
        ]}
      >
        <Ionicons
          name="arrow-forward"
          size={12}
          color={color}
        />
      </View>
    </Pressable>
  );
}

const heroStatStyles = StyleSheet.create({
  stat: {
    flex: 1,
    alignItems: 'center',
  },

  label: {
    color: '#93C5FD',
    fontSize: 7,
    fontWeight: '800',
    marginTop: 5,
    letterSpacing: 0.5,
  },

  value: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 3,
  },
});

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

    loadingScreen: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },

    loadingTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
      marginTop: 18,
      textAlign: 'center',
    },

    loadingSubtitle: {
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 7,
      textAlign: 'center',
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

    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
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

    truckHero: {
      marginTop: 25,
      marginHorizontal: 18,
      borderRadius: 25,
      padding: 20,
      backgroundColor: '#0B1D36',
      overflow: 'hidden',
    },

    truckHeroTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    bigTruckIcon: {
      width: 70,
      height: 70,
      borderRadius: 21,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
    },

    heroIdentity: {
      flex: 1,
      marginLeft: 15,
    },

    heroTruckNumber: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '900',
    },

    heroTruckType: {
      color: '#CBD5E1',
      fontSize: 11,
      marginTop: 4,
    },

    heroStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 7,
    },

    heroStatusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginRight: 6,
    },

    heroStatusText: {
      color: '#D1FAE5',
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.7,
    },

    heroStats: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 21,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#27415F',
    },

    heroDivider: {
      width: 1,
      height: 28,
      backgroundColor: '#27415F',
      marginHorizontal: 8,
    },

    sectionHeader: {
      marginTop: 27,
      marginHorizontal: 20,
      marginBottom: 13,
    },

    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '900',
    },

    sectionSubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 3,
    },

    driverCard: {
      marginHorizontal: 18,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },

    driverAvatar: {
      width: 53,
      height: 53,
      borderRadius: 17,
      backgroundColor: isDark
        ? '#173A5A'
        : '#E5F0FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    driverAvatarText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '900',
    },

    driverInfo: {
      flex: 1,
      marginLeft: 11,
      minWidth: 0,
    },

    driverName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '900',
    },

    driverPhone: {
      color: colors.textSecondary,
      fontSize: 10,
      marginTop: 4,
    },

    driverLicense: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 3,
    },

    driverActions: {
      flexDirection: 'row',
      gap: 7,
      marginLeft: 7,
    },

    changeButton: {
      width: 37,
      height: 37,
      borderRadius: 11,
      backgroundColor: isDark
        ? '#172F4A'
        : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    removeButton: {
      width: 37,
      height: 37,
      borderRadius: 11,
      backgroundColor: isDark
        ? '#3A171B'
        : '#FFF1F2',
      alignItems: 'center',
      justifyContent: 'center',
    },

    assignCard: {
      marginHorizontal: 18,
      padding: 17,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
    },

    assignIcon: {
      width: 51,
      height: 51,
      borderRadius: 16,
      backgroundColor: isDark
        ? '#172F4A'
        : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    assignText: {
      flex: 1,
      marginLeft: 12,
    },

    assignTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '900',
    },

    assignSubtitle: {
      color: colors.textMuted,
      fontSize: 9,
      lineHeight: 14,
      marginTop: 4,
    },

    infoCard: {
      marginHorizontal: 18,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 15,
    },

    infoRow: {
      minHeight: 65,
      flexDirection: 'row',
      alignItems: 'center',
    },

    infoRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    infoIcon: {
      width: 39,
      height: 39,
      borderRadius: 12,
      backgroundColor: isDark
        ? '#172F4A'
        : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    infoText: {
      flex: 1,
      marginLeft: 11,
    },

    infoLabel: {
      color: colors.textMuted,
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    infoValue: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '800',
      marginTop: 4,
    },

    documentsCard: {
      marginHorizontal: 18,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 15,
    },

    documentRow: {
      minHeight: 73,
      flexDirection: 'row',
      alignItems: 'center',
    },

    documentBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    documentIcon: {
      width: 41,
      height: 41,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    documentInfo: {
      flex: 1,
      marginLeft: 11,
    },

    documentTitle: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '900',
    },

    documentDate: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 4,
    },

    documentStatus: {
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 9,
    },

    documentStatusText: {
      fontSize: 7,
      fontWeight: '900',
    },

    moduleGrid: {
      marginHorizontal: 18,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },

    moduleCard: {
      width: '48.3%',
      minHeight: 130,
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 13,
      marginBottom: 11,
    },

    moduleIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 11,
    },

    moduleTitle: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '900',
    },

    moduleSubtitle: {
      color: colors.textMuted,
      fontSize: 8,
      marginTop: 4,
    },

    moduleArrow: {
      position: 'absolute',
      right: 9,
      bottom: 9,
      width: 22,
      height: 22,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyIcon: {
      width: 70,
      height: 70,
      borderRadius: 22,
      backgroundColor: isDark
        ? '#172F4A'
        : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },

    primaryButton: {
      marginTop: 20,
      height: 46,
      paddingHorizontal: 20,
      borderRadius: 13,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },

    footer: {
      marginTop: 25,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },

    footerText: {
      color: colors.textMuted,
      fontSize: 9,
      marginLeft: 6,
    },

    menuOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.42)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: 105,
      paddingRight: 18,
    },

    menuCard: {
      width: 300,
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 8,
      paddingHorizontal: 8,
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 12,
    },

    menuHeader: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 9,
      paddingBottom: 7,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    menuHeaderText: { flex: 1, minWidth: 0, marginRight: 10 },
    menuTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
    menuSubtitle: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginTop: 3 },

    menuCloseButton: {
      width: 34, height: 34, borderRadius: 11,
      backgroundColor: isDark ? '#172F4A' : '#F1F5F9',
      alignItems: 'center', justifyContent: 'center',
    },

    menuItem: {
      minHeight: 70, borderRadius: 15, marginTop: 5,
      paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center',
    },

    menuItemIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    menuEditIcon: { backgroundColor: isDark ? '#172F4A' : '#EDF5FF' },
    menuStatusIcon: { backgroundColor: isDark ? '#3A2D13' : '#FFF7DF' },
    menuDocumentIcon: { backgroundColor: isDark ? '#12313A' : '#E6F8FC' },
    menuDeleteIcon: { backgroundColor: isDark ? '#3A171B' : '#FFF1F2' },
    menuItemText: { flex: 1, minWidth: 0, marginLeft: 11, marginRight: 8 },
    menuItemTitle: { color: colors.text, fontSize: 11, fontWeight: '900' },
    menuItemSubtitle: { color: colors.textMuted, fontSize: 8, lineHeight: 12, marginTop: 3 },
    menuDeleteItem: { marginTop: 6 },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },

    modalCard: {
      maxHeight: '82%',
      backgroundColor: colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 18,
      paddingTop: 9,
      paddingBottom: 30,
    },

    modalHandle: {
      width: 42,
      height: 4,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 19,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 17,
    },

    modalTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '900',
    },

    modalSubtitle: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 4,
    },

    modalLoading: {
      alignItems: 'center',
      paddingVertical: 45,
    },

    modalLoadingText: {
      color: colors.textSecondary,
      fontSize: 11,
      marginTop: 12,
    },

    noDrivers: {
      alignItems: 'center',
      paddingVertical: 30,
      paddingHorizontal: 20,
    },

    noDriversIcon: {
      width: 62,
      height: 62,
      borderRadius: 20,
      backgroundColor: isDark
        ? '#172F4A'
        : '#EDF5FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    noDriversTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '900',
      marginTop: 14,
    },

    noDriversText: {
      color: colors.textSecondary,
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 6,
      maxWidth: 270,
    },

    driverPickerList: {
      marginBottom: 10,
    },

    driverPickerItem: {
      minHeight: 75,
      backgroundColor: colors.surface,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 9,
      flexDirection: 'row',
      alignItems: 'center',
    },

    driverPickerSelected: {
      borderColor: colors.primary,
      backgroundColor: isDark
        ? '#122A45'
        : '#F0F7FF',
    },

    pickerAvatar: {
      width: 45,
      height: 45,
      borderRadius: 14,
      backgroundColor: isDark
        ? '#173A5A'
        : '#E5F0FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    pickerAvatarText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '900',
    },

    pickerInfo: {
      flex: 1,
      marginLeft: 11,
    },

    pickerName: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '900',
    },

    pickerDetails: {
      color: colors.textSecondary,
      fontSize: 9,
      marginTop: 3,
    },

    pickerLicense: {
      color: colors.textMuted,
      fontSize: 8,
      marginTop: 2,
    },
  });
