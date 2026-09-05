import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
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

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';

type ActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  onPress?: () => void;
};




function LiveTripRoadAnimation() {
  const progress = useRef(new Animated.Value(0)).current;
  const roadProgress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const truckLoop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 6200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    const roadLoop = Animated.loop(
      Animated.timing(roadProgress, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    truckLoop.start();
    roadLoop.start();
    pulseLoop.start();

    return () => {
      truckLoop.stop();
      roadLoop.stop();
      pulseLoop.stop();
    };
  }, [progress, roadProgress, pulse]);

  const truckX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 620],
  });

  const smallTruckX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [650, -120],
  });

  const roadX = roadProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -72],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.42],
  });

  return (
    <View pointerEvents="none" style={animationStyles.liveTripAnimation}>
      <View style={animationStyles.liveTripHorizon} />
      <Animated.View
        style={[animationStyles.liveTripGlow, { opacity: glowOpacity }]}
      />

      <View style={animationStyles.liveTripRoad}>
        <Animated.View
          style={[animationStyles.liveTripRoadDashRow, { transform: [{ translateX: roadX }] }]}
        >
          {Array.from({ length: 18 }).map((_, index) => (
            <View key={index} style={animationStyles.liveTripRoadDash} />
          ))}
        </Animated.View>
      </View>

      <Animated.View
        style={[
          animationStyles.liveTripMovingTruck,
          { transform: [{ translateX: truckX }] },
        ]}
      >
        <View style={animationStyles.liveTripHeadlight} />
        <MaterialCommunityIcons
          name="truck-delivery"
          size={Platform.OS === 'web' ? 48 : 34}
          color="#38BDF8"
        />
      </Animated.View>

      <Animated.View
        style={[
          animationStyles.liveTripSmallTruck,
          { transform: [{ translateX: smallTruckX }] },
        ]}
      >
        <MaterialCommunityIcons
          name="truck-outline"
          size={Platform.OS === 'web' ? 30 : 23}
          color="#60A5FA"
        />
      </Animated.View>

      <View style={animationStyles.liveTripRouteGlow}>
        <View style={animationStyles.liveTripRoutePoint} />
        <View style={animationStyles.liveTripRouteLine} />
        <View style={animationStyles.liveTripRoutePoint} />
      </View>
    </View>
  );
}


function FleetBackgroundAnimation() {
  const [trackWidth, setTrackWidth] = useState(520);

  const mainTruck = useRef(new Animated.Value(-120)).current;
  const secondTruck = useRef(new Animated.Value(1.15)).current;
  const thirdTruck = useRef(new Animated.Value(1.25)).current;
  const laneProgress = useRef(new Animated.Value(0)).current;
  const glowProgress = useRef(new Animated.Value(0)).current;
  const bobProgress = useRef(new Animated.Value(0)).current;
  const streakProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (
      value: Animated.Value,
      duration: number,
      delay = 0,
      from = 0,
      to = 1,
    ) => {
      value.setValue(from);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: to,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: from,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const main = loop(mainTruck, 7200, 300, 0, 1);
    const second = loop(secondTruck, 9800, 1300, 0, 1);
    const third = loop(thirdTruck, 12200, 3600, 0, 1);
    const lane = Animated.loop(
      Animated.timing(laneProgress, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowProgress, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowProgress, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(bobProgress, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bobProgress, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const streak = Animated.loop(
      Animated.timing(streakProgress, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    main.start();
    second.start();
    third.start();
    lane.start();
    glow.start();
    bob.start();
    streak.start();

    return () => {
      main.stop();
      second.stop();
      third.stop();
      lane.stop();
      glow.stop();
      bob.stop();
      streak.stop();
    };
  }, [
    bobProgress,
    glowProgress,
    laneProgress,
    mainTruck,
    secondTruck,
    streakProgress,
    thirdTruck,
  ]);

  const onTrackLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0) setTrackWidth(width);
  };

  const mainTranslateX = mainTruck.interpolate({
    inputRange: [0, 1],
    outputRange: [-125, trackWidth + 125],
  });

  const secondTranslateX = secondTruck.interpolate({
    inputRange: [0, 1],
    outputRange: [trackWidth + 90, -90],
  });

  const thirdTranslateX = thirdTruck.interpolate({
    inputRange: [0, 1],
    outputRange: [trackWidth + 140, -140],
  });

  const laneTranslateX = laneProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -74],
  });

  const streakTranslateX = streakProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, trackWidth + 80],
  });

  const glowScale = glowProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.13],
  });

  const bobTranslateY = bobProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const mainTruckRotate = bobProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-1.5deg'],
  });

  return (
    <View style={animationStyles.animationStage} pointerEvents="none">
      <View style={animationStyles.skyGlow} />
      <View style={animationStyles.track} onLayout={onTrackLayout}>
        <Animated.View
          style={[
            animationStyles.roadGlow,
            { transform: [{ scaleX: glowScale }] },
          ]}
        />

        <View style={animationStyles.roadBase} />

        <View style={animationStyles.laneRow}>
          {Array.from({ length: 12 }).map((_, index) => (
            <Animated.View
              key={`lane-${index}`}
              style={[
                animationStyles.laneDash,
                { transform: [{ translateX: laneTranslateX }] },
              ]}
            />
          ))}
        </View>

        <Animated.View
          style={[
            animationStyles.speedStreak,
            { transform: [{ translateX: streakTranslateX }] },
          ]}
        />
        <Animated.View
          style={[
            animationStyles.speedStreakSmall,
            {
              transform: [
                {
                  translateX: streakTranslateX.interpolate({
                    inputRange: [-80, trackWidth + 80],
                    outputRange: [-220, trackWidth - 120],
                  }),
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            animationStyles.backgroundTruck,
            { transform: [{ translateX: secondTranslateX }] },
          ]}
        >
          <MaterialCommunityIcons name="truck-fast" size={36} color="#60A5FA" />
        </Animated.View>

        <Animated.View
          style={[
            animationStyles.backgroundTruckThird,
            { transform: [{ translateX: thirdTranslateX }] },
          ]}
        >
          <MaterialCommunityIcons name="truck" size={28} color="#38BDF8" />
        </Animated.View>

        <Animated.View
          style={[
            animationStyles.mainTruck,
            {
              transform: [
                { translateX: mainTranslateX },
                { translateY: bobTranslateY },
                { rotate: mainTruckRotate },
              ],
            },
          ]}
        >
          <View style={animationStyles.mainTruckGlow} />
          <View style={animationStyles.mainTruckBody}>
            <MaterialCommunityIcons name="truck-fast" size={58} color="#FFFFFF" />
          </View>
          <View style={animationStyles.headlight} />
          <View style={animationStyles.exhaust} />
        </Animated.View>
      </View>

      <View style={animationStyles.animationLabel}>
        <View style={animationStyles.liveDot} />
        <Text style={animationStyles.animationLabelText}>FLEET IN MOTION</Text>
      </View>
    </View>
  );
}

const animationStyles = StyleSheet.create({
  liveTripAnimation: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 18,
    overflow: 'hidden',
    zIndex: 0,
  },
  liveTripHorizon: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    top: 24,
    height: 1,
    backgroundColor: 'rgba(96,165,250,0.20)',
  },
  liveTripGlow: {
    position: 'absolute',
    left: '22%',
    right: '22%',
    top: 18,
    height: 90,
    borderRadius: 60,
    backgroundColor: '#2563EB',
  },
  liveTripRoad: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 58,
    backgroundColor: 'rgba(3,13,25,0.58)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.16)',
  },
  liveTripRoadDashRow: {
    position: 'absolute',
    left: 0,
    bottom: 24,
    height: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveTripRoadDash: {
    width: 42,
    height: 3,
    borderRadius: 3,
    marginRight: 30,
    backgroundColor: '#60A5FA',
    opacity: 0.55,
  },
  liveTripMovingTruck: {
    position: 'absolute',
    left: 0,
    bottom: 24,
    width: 72,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  liveTripHeadlight: {
    position: 'absolute',
    right: 7,
    top: 20,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E0F2FE',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  liveTripSmallTruck: {
    position: 'absolute',
    left: 0,
    bottom: 31,
    width: 48,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.52,
    zIndex: 1,
  },
  liveTripRouteGlow: {
    position: 'absolute',
    right: '14%',
    top: '26%',
    width: 150,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.42,
  },
  liveTripRoutePoint: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  liveTripRouteLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    backgroundColor: '#38BDF8',
    opacity: 0.55,
  },
  animationStage: {
    width: '100%',
    height: 150,
    marginTop: 20,
    marginBottom: 2,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
  },
  skyGlow: {
    position: 'absolute',
    left: '22%',
    right: '22%',
    top: 4,
    height: 80,
    borderRadius: 50,
    backgroundColor: '#2563EB',
    opacity: 0.12,
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    height: 92,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: 'rgba(5, 20, 38, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.22)',
  },
  roadGlow: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: 42,
    height: 22,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    opacity: 0.14,
  },
  roadBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 35,
    backgroundColor: 'rgba(3, 13, 25, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.14)',
  },
  laneRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    height: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  laneDash: {
    width: 42,
    height: 3,
    borderRadius: 3,
    marginRight: 32,
    backgroundColor: '#60A5FA',
    opacity: 0.65,
  },
  speedStreak: {
    position: 'absolute',
    top: 22,
    width: 95,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#93C5FD',
    opacity: 0.52,
  },
  speedStreakSmall: {
    position: 'absolute',
    top: 31,
    width: 50,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    opacity: 0.35,
  },
  backgroundTruck: {
    position: 'absolute',
    bottom: 29,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.55,
  },
  backgroundTruckThird: {
    position: 'absolute',
    bottom: 38,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.34,
  },
  mainTruck: {
    position: 'absolute',
    left: 0,
    bottom: 23,
    width: 88,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTruckGlow: {
    position: 'absolute',
    width: 82,
    height: 40,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    opacity: 0.24,
  },
  mainTruckBody: {
    width: 72,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#60A5FA',
    shadowColor: '#60A5FA',
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 7,
  },
  headlight: {
    position: 'absolute',
    right: 6,
    top: 25,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E0F2FE',
    opacity: 0.95,
  },
  exhaust: {
    position: 'absolute',
    left: -8,
    bottom: 21,
    width: 15,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#93C5FD',
    opacity: 0.42,
  },
  animationLabel: {
    position: 'absolute',
    right: 10,
    top: 7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 30, 54, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.22)',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor: '#34D399',
  },
  animationLabelText: {
    color: '#9FC5EB',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },
});


export default function DashboardScreen() {
 const [truckCount, setTruckCount] = useState(0);
const [totalTrips, setTotalTrips] = useState(0);
const [expiringDocuments, setExpiringDocuments] = useState(0);
const [refreshing, setRefreshing] = useState(false);
const [activeTrip, setActiveTrip] = useState<any>(null);
 const [userName, setUserName] = useState('Fleet Owner');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      {Platform.OS === 'web' && sidebarOpen && (
        <View style={styles.webSidebar}>
          <View style={styles.sidebarBrand}>
            <View style={styles.sidebarLogo}>
              <MaterialCommunityIcons name="truck-fast" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.sidebarBrandName}>TruckFleet<Text style={styles.brandAccent}> Pro</Text></Text>
              <Text style={styles.sidebarCaption}>FLEET MANAGEMENT</Text>
            </View>
          </View>
          <Text style={styles.sidebarSection}>MAIN MENU</Text>

          <Pressable
            style={[styles.sidebarItem, styles.sidebarItemActive]}
            onPress={() => { setSidebarOpen(false); router.push('/dashboard'); }}
          >
            <Ionicons name="grid-outline" size={19} color="#FFFFFF" />
            <Text style={[styles.sidebarItemText, styles.sidebarItemTextActive]}>
              {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
            </Text>
          </Pressable>

          <Text style={styles.sidebarQuickTitle}>
            {language === 'hi' ? 'QUICK ACTIONS' : 'QUICK ACTIONS'}
          </Text>

          <View style={styles.sidebarQuickActions}>
            <Pressable
              style={({ pressed }) => [
                styles.sidebarQuickAction,
                pressed && styles.sidebarQuickActionPressed,
              ]}
              onPress={() => { setSidebarOpen(false); router.push('/add-truck'); }}
            >
              <View style={[styles.sidebarQuickIcon, { backgroundColor: '#173B78' }]}>
                <MaterialCommunityIcons name="truck-plus" size={18} color="#60A5FA" />
              </View>
              <Text style={styles.sidebarQuickText}>
                {language === 'hi' ? 'ट्रक जोड़ें' : 'Add Truck'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.sidebarQuickAction,
                pressed && styles.sidebarQuickActionPressed,
              ]}
              onPress={() => { setSidebarOpen(false); router.push('/add-driver'); }}
            >
              <View style={[styles.sidebarQuickIcon, { backgroundColor: '#30205A' }]}>
                <Ionicons name="person-add-outline" size={18} color="#C4B5FD" />
              </View>
              <Text style={styles.sidebarQuickText}>
                {language === 'hi' ? 'ड्राइवर जोड़ें' : 'Add Driver'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.sidebarQuickAction,
                pressed && styles.sidebarQuickActionPressed,
              ]}
              onPress={() => { setSidebarOpen(false); router.push('/trips'); }}
            >
              <View style={[styles.sidebarQuickIcon, { backgroundColor: '#123F36' }]}>
                <Ionicons name="navigate-outline" size={18} color="#6EE7B7" />
              </View>
              <Text style={styles.sidebarQuickText}>
                {language === 'hi' ? 'ट्रिप जोड़ें' : 'Add Trip'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.sidebarQuickAction,
                pressed && styles.sidebarQuickActionPressed,
              ]}
              onPress={() => { setSidebarOpen(false); router.push('/notifications'); }}
            >
              <View style={[styles.sidebarQuickIcon, { backgroundColor: '#4A2A18' }]}>
                <Ionicons name="notifications-outline" size={18} color="#FDBA74" />
              </View>
              <Text style={styles.sidebarQuickText}>
                {language === 'hi' ? 'अलर्ट देखें' : 'View Alerts'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.sidebarItem}
            onPress={() => { setSidebarOpen(false); router.push('/settings'); }}
          >
            <Ionicons name="settings-outline" size={19} color="#B8C7DB" />
            <Text style={styles.sidebarItemText}>
              {language === 'hi' ? 'सेटिंग्स' : 'Settings'}
            </Text>
          </Pressable>
          <View style={styles.sidebarBottom}>
            <MaterialCommunityIcons name="truck-outline" size={56} color="#2563EB" />
            <Text style={styles.sidebarTagline}>{language === 'hi' ? 'स्मार्ट फ्लीट। बेहतर नियंत्रण।' : 'Smart fleet. Better control.'}</Text>
          </View>
        </View>
      )}

      {Platform.OS === 'web' && (
        <View style={styles.webFixedHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={sidebarOpen ? 'Close menu' : 'Open menu'}
            style={({ pressed }) => [
              styles.webMenuButton,
              pressed && styles.webControlPressed,
            ]}
            onPress={() => setSidebarOpen((value) => !value)}
          >
            <Ionicons
              name={sidebarOpen ? 'close' : 'menu'}
              size={23}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.webHeaderRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={({ pressed }) => [
                styles.webIconButton,
                pressed && styles.webControlPressed,
              ]}
              onPress={() => { setSidebarOpen(false); router.push('/notifications'); }}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {expiringDocuments > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {expiringDocuments > 9 ? '9+' : expiringDocuments}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={({ pressed }) => [
                styles.webIconButton,
                pressed && styles.webControlPressed,
              ]}
              onPress={() => { setSidebarOpen(false); router.push('/settings'); }}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.webMain}
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
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageEyebrow}>
              {language === 'hi' ? 'फ्लीट कंट्रोल सेंटर' : 'FLEET CONTROL CENTER'}
            </Text>
            <Text style={styles.pageTitle}>
              {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
            </Text>
          </View>

          <View style={styles.headerDate}>
            <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
            <Text style={styles.headerDateText}>
              {new Date().toLocaleDateString(
                language === 'hi' ? 'hi-IN' : 'en-IN',
                { day: '2-digit', month: 'short', year: 'numeric' }
              )}
            </Text>
          </View>
        </View>

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

        <View style={styles.commandCard}>
          <View style={styles.commandGlowOne} />
          <View style={styles.commandGlowTwo} />

          <View style={styles.commandHeader}>
            <View style={styles.commandCopy}>
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
              <Text style={styles.commandDescription}>
                {dashboardText.commandDescription}
              </Text>

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
                  <Text style={styles.heroStatLabel}>
                    {language === 'hi' ? 'अलर्ट' : 'Alerts'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.heroVisual}>
              <View style={styles.heroVisualRing} />
              <View style={styles.heroVisualGlow} />
              <MaterialCommunityIcons
                name="truck-fast"
                size={Platform.OS === 'web' ? 82 : 54}
                color="#FFFFFF"
              />
              <View style={styles.heroVisualBadge}>
                <View style={styles.statusPulseSmall} />
                <Text style={styles.heroVisualBadgeText}>LIVE</Text>
              </View>
            </View>
          </View>

          <FleetBackgroundAnimation />

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
              <View
                style={[
                  styles.healthProgress,
                  { width: `${fleetHealth}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t.fleetSnapshot}</Text>
            <Text style={styles.sectionSubtitle}>{t.todaysOverview}</Text>
          </View>
          <View style={styles.liveChip}>
            <View style={styles.liveChipDot} />
            <Text style={styles.liveChipText}>{t.live}</Text>
          </View>
        </View>

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

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t.liveTrip}</Text>
            <Text style={styles.sectionSubtitle}>{t.currentlyOnRoad}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/trips')}
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.viewAll}>{t.viewAll}</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </Pressable>
        </View>

        {activeTrip ? (
          <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <View style={styles.tripVehicle}>
                <View style={styles.tripVehicleIcon}>
                  <MaterialCommunityIcons
                    name="truck-fast"
                    size={23}
                    color="#2563EB"
                  />
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

              <View style={styles.onRoadChip}>
                <View style={styles.onRoadDot} />
                <Text style={styles.onRoadText}>{t.onRoad}</Text>
              </View>
            </View>

            <View style={styles.routeBox}>
              <View style={styles.routeLocation}>
                <View style={styles.originDot} />
                <View>
                  <Text style={styles.routeCaption}>{t.from}</Text>
                  <Text style={styles.routeCity}>
                    {activeTrip.from || activeTrip.origin || '--'}
                  </Text>
                </View>
              </View>

              <View style={styles.routeVisual}>
                <View style={styles.routeLineLeft} />
                <View style={styles.routeArrow}>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.routeLineRight} />
              </View>

              <View style={styles.routeLocation}>
                <View style={styles.destinationDot} />
                <View>
                  <Text style={styles.routeCaption}>{t.to}</Text>
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
                <Text style={styles.tripInfoText}>{t.inProgress}</Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.tripDetailsButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  if (!activeTrip?._id) return;
                  router.push({
                    pathname: '/trip-details',
                    params: { tripId: activeTrip._id },
                  });
                }}
              >
                <Text style={styles.tripDetailsText}>{t.tripDetails}</Text>
                <Ionicons name="chevron-forward" size={15} color="#2563EB" />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyTripCard}>
            <LiveTripRoadAnimation />
            <View style={styles.emptyTripContent}>
            <View style={styles.emptyTripIcon}>
              <Ionicons
                name="navigate-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTripTitle}>
              {language === 'hi' ? 'कोई लाइव ट्रिप नहीं' : 'No live trip'}
            </Text>
            <Text style={styles.emptyTripSubtitle}>
              {language === 'hi'
                ? 'अभी कोई ट्रिप रोड पर नहीं है।'
                : 'No trip is currently on the road.'}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyTripButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/trips')}
            >
              <Text style={styles.emptyTripButtonText}>
                {language === 'hi' ? 'ट्रिप देखें' : 'View trips'}
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </Pressable>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>TruckFleet Pro</Text>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>Smart Fleet Management</Text>
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
    flexDirection: 'column',
    backgroundColor: colors.background,
    position: 'relative',
  },

  webSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 272,
    backgroundColor: isDark ? '#08182D' : '#0B1D36',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    justifyContent: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: '#1A3B5F',
    zIndex: 120,
    elevation: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 28,
  },

  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingBottom: 22,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#173654',
  },

  sidebarLogo: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  sidebarBrandName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  sidebarCaption: {
    color: '#7FA4CC',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginTop: 2,
  },

  sidebarSection: {
    color: '#6F86A7',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 17,
    marginBottom: 9,
    paddingHorizontal: 5,
  },

  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 11,
    borderRadius: 11,
    marginBottom: 4,
  },

  sidebarItemActive: {
    backgroundColor: '#1677E8',
    shadowColor: '#1677E8',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },

  sidebarItemText: {
    color: '#B8C7DB',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 11,
  },

  sidebarItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  sidebarQuickTitle: {
    color: '#6F86A7',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 8,
  },

  sidebarQuickActions: {
    gap: 6,
    marginBottom: 14,
  },

  sidebarQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 49,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: '#0E2745',
    borderWidth: 1,
    borderColor: '#183A5C',
    marginBottom: 5,
  },

  sidebarQuickActionPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  sidebarQuickIcon: {
    width: 31,
    height: 31,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  sidebarQuickText: {
    color: '#E6EEF9',
    fontSize: 10,
    fontWeight: '800',
  },

  sidebarBottom: {
    marginTop: 'auto',
    minHeight: 145,
    borderRadius: 16,
    backgroundColor: isDark ? '#0D2744' : '#102E50',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    overflow: 'hidden',
  },

  sidebarTagline: {
    color: '#9FC5EB',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 5,
  },

  content: {
    paddingTop: Platform.OS === 'web' ? 28 : 48,
    paddingHorizontal: Platform.OS === 'web' ? 42 : 18,
    paddingBottom: 60,
    maxWidth: Platform.OS === 'web' ? 1500 : undefined,
    width: Platform.OS === 'web' ? '100%' : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },

  webMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: Platform.OS === 'web' ? 0.10 : 0,
    shadowRadius: Platform.OS === 'web' ? 10 : 0,
    elevation: Platform.OS === 'web' ? 4 : 0,
  },

  webMain: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.background,
  },

  /* TOP BAR */

  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 8 : 0,
    paddingBottom: Platform.OS === 'web' ? 16 : 0,
    borderBottomWidth: Platform.OS === 'web' ? 1 : 0,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },

  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    display: Platform.OS === 'web' ? 'none' : 'flex',
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

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 18,
    borderBottomWidth: Platform.OS === 'web' ? 1 : 0,
    borderBottomColor: colors.border,
  },

  headerDate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  headerDateText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
  },

  pageEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 5,
  },

  pageTitle: {
    color: colors.text,
    fontSize: Platform.OS === 'web' ? 27 : 25,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  webFixedHeader: {
    height: 74,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 100,
  },

  webHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  webIconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: Platform.OS === 'web' ? 0.10 : 0,
    shadowRadius: Platform.OS === 'web' ? 10 : 0,
    elevation: Platform.OS === 'web' ? 4 : 0,
  },

  webControlPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
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
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
        } as any)
      : {}),
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
    marginTop: Platform.OS === 'web' ? 25 : 25,
    marginBottom: Platform.OS === 'web' ? 24 : 20,
  },

  greetingSmall: {
    color: '#2563EB',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  greetingTitle: {
    color: colors.text,
    fontSize: Platform.OS === 'web' ? 34 : 23,
    fontWeight: '900',
    letterSpacing: -1.1,
  },

  greetingSubtitle: {
    color: colors.textSecondary,
    fontSize: Platform.OS === 'web' ? 13 : 11,
    lineHeight: Platform.OS === 'web' ? 20 : 17,
    marginTop: 8,
  },

  /* COMMAND CARD */

  commandCard: {
    backgroundColor: isDark ? '#071A31' : '#0B2547',
    borderRadius: 26,
    padding: Platform.OS === 'web' ? 30 : 20,
    overflow: 'hidden',
    marginBottom: 34,
    borderWidth: 1,
    borderColor: isDark ? '#173A5D' : '#153E6A',
    minHeight: Platform.OS === 'web' ? 345 : undefined,
    shadowColor: '#000000',
    shadowOpacity: Platform.OS === 'web' ? 0.18 : 0,
    shadowRadius: Platform.OS === 'web' ? 24 : 0,
    elevation: Platform.OS === 'web' ? 8 : 0,
  },

  commandGlowOne: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#1D4ED8',
    opacity: 0.16,
    right: -90,
    top: -80,
  },

  commandGlowTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#06B6D4',
    opacity: 0.10,
    left: -95,
    bottom: -115,
  },

  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'web' ? 220 : 0,
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
    color: '#8FC7FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  commandCopy: {
    flex: 1,
    paddingRight: Platform.OS === 'web' ? 35 : 8,
  },

  commandTitle: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 24 : 20,
    fontWeight: '700',
    marginTop: 18,
  },

  commandTitleStrong: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 42 : 26,
    fontWeight: '900',
    letterSpacing: -1.4,
    marginTop: 0,
  },

  commandDescription: {
    color: '#AFC5DE',
    fontSize: Platform.OS === 'web' ? 13 : 11,
    lineHeight: Platform.OS === 'web' ? 20 : 17,
    marginTop: 11,
    maxWidth: Platform.OS === 'web' ? 560 : 270,
  },

  heroVisual: {
    width: Platform.OS === 'web' ? 190 : 90,
    height: Platform.OS === 'web' ? 190 : 90,
    borderRadius: Platform.OS === 'web' ? 95 : 45,
    backgroundColor: '#123A69',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#285B89',
  },

  heroVisualRing: {
    position: 'absolute',
    width: Platform.OS === 'web' ? 154 : 72,
    height: Platform.OS === 'web' ? 154 : 72,
    borderRadius: Platform.OS === 'web' ? 77 : 36,
    borderWidth: 1,
    borderColor: '#4C9AFF',
    opacity: 0.45,
  },

  heroVisualGlow: {
    position: 'absolute',
    width: Platform.OS === 'web' ? 105 : 48,
    height: Platform.OS === 'web' ? 105 : 48,
    borderRadius: Platform.OS === 'web' ? 53 : 24,
    backgroundColor: '#2563EB',
    opacity: 0.30,
  },

  heroVisualBadge: {
    position: 'absolute',
    right: Platform.OS === 'web' ? -5 : -2,
    bottom: Platform.OS === 'web' ? 15 : 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B2547',
    borderWidth: 1,
    borderColor: '#28567F',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusPulseSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#22D3A1',
    marginRight: 5,
  },

  heroVisualBadgeText: {
    color: '#9DEED3',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },

  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },

  heroStat: {
    minWidth: 70,
  },

  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  heroStatLabel: {
    color: '#7895B5',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 3,
  },

  heroStatDivider: {
    width: 1,
    height: 27,
    backgroundColor: '#274968',
    marginHorizontal: 13,
  },

  commandTruck: {
    width: Platform.OS === 'web' ? 108 : 57,
    height: Platform.OS === 'web' ? 108 : 57,
    borderRadius: Platform.OS === 'web' ? 30 : 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#60A5FA',
    shadowOpacity: Platform.OS === 'web' ? 0.24 : 0,
    shadowRadius: Platform.OS === 'web' ? 24 : 0,
    elevation: Platform.OS === 'web' ? 9 : 0,
  },

  truckHalo: {
    position: 'absolute',
    width: Platform.OS === 'web' ? 68 : 48,
    height: Platform.OS === 'web' ? 68 : 48,
    borderRadius: Platform.OS === 'web' ? 34 : 24,
    backgroundColor: '#3B82F6',
    opacity: 0.28,
  },

  truckRoadLine: {
    position: 'absolute',
    width: Platform.OS === 'web' ? 58 : 40,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#93C5FD',
    bottom: Platform.OS === 'web' ? 10 : 7,
    opacity: 0.8,
  },

  healthSection: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#1A3A5D',
  },

  healthTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  healthLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  healthHint: {
    color: '#7895B5',
    fontSize: 9,
    marginTop: 4,
  },

  healthPercentage: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  healthTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#173858',
    overflow: 'hidden',
    marginTop: 10,
  },

  healthProgress: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#20D6A2',
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

  heroActionsRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: 'stretch',
    gap: Platform.OS === 'web' ? 18 : 0,
    marginBottom: 28,
  },

  heroColumn: {
    flex: Platform.OS === 'web' ? 1.65 : undefined,
    minWidth: 0,
  },

  quickActionsColumn: {
    flex: Platform.OS === 'web' ? 0.95 : undefined,
    minWidth: 0,
  },

  /* SECTION */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 2,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: Platform.OS === 'web' ? 19 : 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },

  viewAll: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    paddingVertical: 4,
    paddingHorizontal: 2,
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
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: Platform.OS === 'web' ? 16 : 0,
    marginBottom: 36,
  },

  metricCard: {
    width: Platform.OS === 'web' ? '33.33%' : '48.3%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: Platform.OS === 'web' ? 21 : 15,
    marginBottom: Platform.OS === 'web' ? 0 : 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: Platform.OS === 'web' ? 145 : undefined,
    shadowColor: '#000000',
    shadowOpacity: Platform.OS === 'web' ? 0.06 : 0,
    shadowRadius: Platform.OS === 'web' ? 14 : 0,
    elevation: Platform.OS === 'web' ? 3 : 0,
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
    fontSize: Platform.OS === 'web' ? 32 : 25,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 16,
  },

  metricLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },

  metricCaption: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 5,
  },

  /* ACTIONS */

  actionGrid: {
    flexDirection: Platform.OS === 'web' ? 'column' : 'row',
    flexWrap: Platform.OS === 'web' ? 'nowrap' : 'wrap',
    justifyContent: Platform.OS === 'web' ? 'flex-start' : 'space-between',
    marginBottom: Platform.OS === 'web' ? 0 : 27,
    gap: Platform.OS === 'web' ? 10 : 0,
  },

  actionCard: {
    width: Platform.OS === 'web' ? '100%' : '31.6%',
    minHeight: Platform.OS === 'web' ? 82 : 125,
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
    padding: Platform.OS === 'web' ? 23 : 17,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOpacity: Platform.OS === 'web' ? 0.06 : 0,
    shadowRadius: Platform.OS === 'web' ? 16 : 0,
    elevation: Platform.OS === 'web' ? 3 : 0,
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

  tripVehicleCopy: {
    flex: 1,
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
    paddingVertical: 34,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
    minHeight: Platform.OS === 'web' ? 245 : 205,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },

  emptyTripContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },


  emptyTripIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: isDark ? '#122A45' : '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  emptyTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginTop: 15,
  },

  emptyTripButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    marginRight: 6,
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