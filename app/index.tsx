import { useEffect, useMemo, useState } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';

const SPRING = { damping: 14, stiffness: 140, mass: 0.7 };
const SOFT_SPRING = { damping: 16, stiffness: 110, mass: 0.85 };

const FUR = {
  dark: '#3B4452',
  mid: '#596273',
  white: '#F7F8FB',
  cream: '#EEF1F6',
  innerEar: '#F4B8C4',
  blush: '#F3A7B4',
  iris: '#5AA8E6',
  irisDeep: '#2E6EA8',
  pupil: '#12151C',
  nose: '#16181F',
  pad: '#4A5563',
  tongue: '#E56B8A',
  line: '#1F2430',
};

type HuskyState = 'idle' | 'email' | 'password' | 'peek' | 'happy';
type FocusField = 'none' | 'email' | 'password';

function HuskyMascot({
  state,
  emailLength,
  scale,
}: {
  state: HuskyState;
  emailLength: number;
  scale: number;
}) {
  const headY = useSharedValue(0);
  const headX = useSharedValue(0);
  const headRotate = useSharedValue(0);
  const headScale = useSharedValue(1);
  const earL = useSharedValue(0);
  const earR = useSharedValue(0);
  const eyeX = useSharedValue(0);
  const eyeY = useSharedValue(0);
  const blink = useSharedValue(0);
  const pawCover = useSharedValue(0);
  const peekAmt = useSharedValue(0);
  const happy = useSharedValue(0);
  const mouthOpen = useSharedValue(0);
  const breath = useSharedValue(0);
  const look = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    return () => cancelAnimation(breath);
  }, [breath]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(() => {
        if (state !== 'password') {
          blink.value = withSequence(
            withTiming(1, { duration: 70 }),
            withTiming(0, { duration: 90 })
          );
        }
        schedule();
      }, 2400 + Math.random() * 2600);
    };
    schedule();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [blink, state]);

  useEffect(() => {
    cancelAnimation(look);
    cancelAnimation(earL);
    cancelAnimation(earR);

    if (state === 'idle') {
      look.value = withRepeat(
        withSequence(
          withDelay(1400, withTiming(-1, { duration: 420 })),
          withDelay(700, withTiming(1, { duration: 480 })),
          withDelay(600, withTiming(0, { duration: 380 }))
        ),
        -1,
        false
      );
      earL.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 280 }),
          withTiming(0, { duration: 320 }),
          withDelay(1800, withTiming(0, { duration: 10 }))
        ),
        -1,
        false
      );
      earR.value = withRepeat(
        withSequence(
          withDelay(220, withTiming(1, { duration: 260 })),
          withTiming(0, { duration: 300 }),
          withDelay(1900, withTiming(0, { duration: 10 }))
        ),
        -1,
        false
      );
    } else {
      look.value = withTiming(0, { duration: 220 });
      earL.value = withSpring(state === 'happy' ? -0.4 : 0.15, SOFT_SPRING);
      earR.value = withSpring(state === 'happy' ? -0.4 : 0.15, SOFT_SPRING);
    }
  }, [earL, earR, look, state]);

  useEffect(() => {
    const track = Math.min(emailLength, 28) / 28;

    if (state === 'email') {
      headY.value = withSpring(3, SPRING);
      headX.value = withSpring(interpolate(track, [0, 1], [-2, 3]), SPRING);
      headRotate.value = withSpring(interpolate(track, [0, 1], [-4, 5]), SPRING);
      headScale.value = withSpring(1, SPRING);
      eyeX.value = withSpring(interpolate(track, [0, 1], [-3.5, 6.5]), SPRING);
      eyeY.value = withSpring(3.2, SPRING);
      pawCover.value = withSpring(0, SPRING);
      peekAmt.value = withTiming(0, { duration: 180 });
      happy.value = withTiming(0, { duration: 160 });
      mouthOpen.value = withTiming(0.15, { duration: 180 });
    } else if (state === 'password') {
      headY.value = withSpring(2, SPRING);
      headX.value = withSpring(0, SPRING);
      headRotate.value = withSpring(0, SPRING);
      headScale.value = withSpring(0.99, SPRING);
      eyeX.value = withSpring(0, SPRING);
      eyeY.value = withSpring(1, SPRING);
      pawCover.value = withSpring(1, { damping: 13, stiffness: 160, mass: 0.65 });
      peekAmt.value = withTiming(0, { duration: 160 });
      happy.value = withTiming(0, { duration: 160 });
      mouthOpen.value = withTiming(0, { duration: 160 });
    } else if (state === 'peek') {
      headY.value = withSpring(-1, SPRING);
      headX.value = withSpring(2, SPRING);
      headRotate.value = withSpring(6, SPRING);
      headScale.value = withSpring(1, SPRING);
      eyeX.value = withSpring(4, SPRING);
      eyeY.value = withSpring(1.5, SPRING);
      pawCover.value = withSpring(0.72, SPRING);
      peekAmt.value = withSpring(1, SPRING);
      happy.value = withTiming(0, { duration: 160 });
      mouthOpen.value = withTiming(0.35, { duration: 180 });
    } else if (state === 'happy') {
      headY.value = withRepeat(
        withSequence(
          withSpring(-7, { damping: 8, stiffness: 180 }),
          withSpring(0, { damping: 10, stiffness: 160 })
        ),
        3,
        true
      );
      headX.value = withSpring(0, SPRING);
      headRotate.value = withSpring(0, SPRING);
      headScale.value = withSpring(1.04, SPRING);
      eyeX.value = withSpring(0, SPRING);
      eyeY.value = withSpring(-1, SPRING);
      pawCover.value = withSpring(0, SPRING);
      peekAmt.value = withTiming(0, { duration: 160 });
      happy.value = withTiming(1, { duration: 180 });
      mouthOpen.value = withTiming(1, { duration: 200 });
    } else {
      headY.value = withSpring(0, SOFT_SPRING);
      headX.value = withSpring(0, SOFT_SPRING);
      headRotate.value = withSpring(0, SOFT_SPRING);
      headScale.value = withSpring(1, SOFT_SPRING);
      eyeX.value = withSpring(0, SOFT_SPRING);
      eyeY.value = withSpring(0, SOFT_SPRING);
      pawCover.value = withSpring(0, SPRING);
      peekAmt.value = withTiming(0, { duration: 180 });
      happy.value = withTiming(0, { duration: 180 });
      mouthOpen.value = withTiming(0.25, { duration: 180 });
    }
  }, [
    emailLength,
    eyeX,
    eyeY,
    happy,
    headRotate,
    headScale,
    headX,
    headY,
    mouthOpen,
    pawCover,
    peekAmt,
    state,
  ]);

  const headStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: headX.value },
      { translateY: headY.value + breath.value * -2 },
      { rotate: `${headRotate.value}deg` },
      { scale: headScale.value },
    ],
  }));

  const leftEarStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${-28 - earL.value * 10}deg` },
      { translateY: earL.value * -3 },
    ],
  }));

  const rightEarStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${28 + earR.value * 10}deg` },
      { translateY: earR.value * -3 },
    ],
  }));

  const pupilStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: eyeX.value + look.value * 3.2 },
      { translateY: eyeY.value + look.value * 0.6 },
    ],
  }));

  const lidStyle = useAnimatedStyle(() => ({
    height: interpolate(blink.value, [0, 1], [0, 24]),
    opacity: interpolate(happy.value, [0, 1], [1, 0]),
  }));

  const openEyeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(happy.value, [0, 0.6], [1, 0]),
  }));

  const happyEyeStyle = useAnimatedStyle(() => ({
    opacity: happy.value,
  }));

  const blushStyle = useAnimatedStyle(() => ({
    opacity: interpolate(happy.value, [0, 1], [0.45, 0.9]),
    transform: [{ scale: interpolate(happy.value, [0, 1], [1, 1.15]) }],
  }));

  const mouthStyle = useAnimatedStyle(() => ({
    width: interpolate(mouthOpen.value, [0, 1], [16, 26]),
    height: interpolate(mouthOpen.value, [0, 1], [8, 16]),
    borderBottomWidth: interpolate(mouthOpen.value, [0, 1], [2.2, 0]),
  }));

  const tongueStyle = useAnimatedStyle(() => ({
    opacity: interpolate(mouthOpen.value, [0.45, 1], [0, 1]),
    transform: [{ scale: interpolate(mouthOpen.value, [0.45, 1], [0.4, 1]) }],
  }));

  const leftPawStyle = useAnimatedStyle(() => {
    const p = pawCover.value;
    return {
      transform: [
        { translateY: interpolate(p, [0, 1], [0, -62]) },
        { translateX: interpolate(p, [0, 1], [0, 14]) },
        { rotate: `${interpolate(p, [0, 1], [16, 8])}deg` },
        { scale: interpolate(p, [0, 1], [1, 1.12]) },
      ],
      zIndex: p > 0.35 ? 30 : 8,
    };
  });

  const rightPawStyle = useAnimatedStyle(() => {
    const p = pawCover.value;
    const peek = peekAmt.value;
    return {
      transform: [
        { translateY: interpolate(p, [0, 1], [0, -62]) + interpolate(peek, [0, 1], [0, 18]) },
        { translateX: interpolate(p, [0, 1], [0, -14]) + interpolate(peek, [0, 1], [0, 6]) },
        { rotate: `${interpolate(p, [0, 1], [-16, -8]) + interpolate(peek, [0, 1], [0, -14])}deg` },
        { scale: interpolate(p, [0, 1], [1, 1.12]) },
      ],
      zIndex: p > 0.35 ? 30 : 8,
    };
  });

  const s = scale;

  return (
    <View
      pointerEvents="none"
      style={[huskyStyles.stage, { width: 220 * s, height: 168 * s }]}
    >
      <View style={[huskyStyles.halo, { width: 150 * s, height: 70 * s, bottom: 10 * s }]} />

      <Animated.View style={[huskyStyles.headGroup, headStyle, { width: 220 * s, height: 150 * s }]}>
        <Animated.View
          style={[
            huskyStyles.ear,
            {
              left: 28 * s,
              width: 42 * s,
              height: 58 * s,
              borderRadius: 21 * s,
            },
            leftEarStyle,
          ]}
        >
          <View style={[huskyStyles.earInner, { width: 22 * s, height: 34 * s, borderRadius: 12 * s }]} />
        </Animated.View>
        <Animated.View
          style={[
            huskyStyles.ear,
            {
              right: 28 * s,
              width: 42 * s,
              height: 58 * s,
              borderRadius: 21 * s,
            },
            rightEarStyle,
          ]}
        >
          <View style={[huskyStyles.earInner, { width: 22 * s, height: 34 * s, borderRadius: 12 * s }]} />
        </Animated.View>

        <View
          style={[
            huskyStyles.head,
            {
              width: 132 * s,
              height: 118 * s,
              borderRadius: 66 * s,
              top: 18 * s,
            },
          ]}
        >
          <View
            style={[
              huskyStyles.face,
              {
                width: 118 * s,
                height: 92 * s,
                borderRadius: 56 * s,
                bottom: -8 * s,
              },
            ]}
          />
          <View
            style={[
              huskyStyles.mask,
              {
                width: 86 * s,
                height: 42 * s,
                borderBottomLeftRadius: 28 * s,
                borderBottomRightRadius: 28 * s,
              },
            ]}
          />

          <Animated.View style={[huskyStyles.eyesRow, { top: 42 * s, width: 78 * s }, openEyeStyle]}>
            <View style={[huskyStyles.eye, { width: 26 * s, height: 26 * s, borderRadius: 13 * s }]}>
              <Animated.View style={[huskyStyles.iris, { width: 16 * s, height: 16 * s, borderRadius: 8 * s }, pupilStyle]}>
                <View style={[huskyStyles.pupil, { width: 7 * s, height: 7 * s, borderRadius: 4 * s }]} />
                <View style={[huskyStyles.shine, { width: 5 * s, height: 5 * s, borderRadius: 3 * s, top: 2 * s, left: 3 * s }]} />
              </Animated.View>
              <Animated.View style={[huskyStyles.lid, lidStyle]} />
            </View>
            <View style={[huskyStyles.eye, { width: 26 * s, height: 26 * s, borderRadius: 13 * s }]}>
              <Animated.View style={[huskyStyles.iris, { width: 16 * s, height: 16 * s, borderRadius: 8 * s }, pupilStyle]}>
                <View style={[huskyStyles.pupil, { width: 7 * s, height: 7 * s, borderRadius: 4 * s }]} />
                <View style={[huskyStyles.shine, { width: 5 * s, height: 5 * s, borderRadius: 3 * s, top: 2 * s, left: 3 * s }]} />
              </Animated.View>
              <Animated.View style={[huskyStyles.lid, lidStyle]} />
            </View>
          </Animated.View>

          <Animated.View style={[huskyStyles.happyEyes, { top: 50 * s, width: 72 * s }, happyEyeStyle]}>
            <View style={[huskyStyles.happyLid, { width: 22 * s }]} />
            <View style={[huskyStyles.happyLid, { width: 22 * s }]} />
          </Animated.View>

          <Animated.View
            style={[
              huskyStyles.blush,
              { left: 16 * s, top: 72 * s, width: 18 * s, height: 10 * s, borderRadius: 8 * s },
              blushStyle,
            ]}
          />
          <Animated.View
            style={[
              huskyStyles.blush,
              { right: 16 * s, top: 72 * s, width: 18 * s, height: 10 * s, borderRadius: 8 * s },
              blushStyle,
            ]}
          />

          <View style={[huskyStyles.muzzle, { top: 74 * s }]}>
            <View style={[huskyStyles.nose, { width: 16 * s, height: 11 * s, borderRadius: 8 * s }]} />
            <Animated.View
              style={[
                huskyStyles.mouth,
                { borderRadius: 12 * s },
                mouthStyle,
              ]}
            >
              <Animated.View
                style={[
                  huskyStyles.tongue,
                  { width: 10 * s, height: 8 * s, borderRadius: 6 * s },
                  tongueStyle,
                ]}
              />
            </Animated.View>
          </View>
        </View>

        <View
          style={[
            huskyStyles.chest,
            {
              width: 78 * s,
              height: 36 * s,
              borderRadius: 20 * s,
              bottom: 4 * s,
            },
          ]}
        />
      </Animated.View>

      <Animated.View
        style={[
          huskyStyles.paw,
          {
            left: 48 * s,
            bottom: 18 * s,
            width: 46 * s,
            height: 34 * s,
            borderRadius: 18 * s,
          },
          leftPawStyle,
        ]}
      >
        <View style={[huskyStyles.padMain, { width: 16 * s, height: 12 * s, borderRadius: 8 * s }]} />
        <View style={huskyStyles.toeRow}>
          <View style={[huskyStyles.toe, { width: 7 * s, height: 7 * s, borderRadius: 4 * s }]} />
          <View style={[huskyStyles.toe, { width: 7 * s, height: 7 * s, borderRadius: 4 * s }]} />
          <View style={[huskyStyles.toe, { width: 7 * s, height: 7 * s, borderRadius: 4 * s }]} />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          huskyStyles.paw,
          {
            right: 48 * s,
            bottom: 18 * s,
            width: 46 * s,
            height: 34 * s,
            borderRadius: 18 * s,
          },
          rightPawStyle,
        ]}
      >
        <View style={[huskyStyles.padMain, { width: 16 * s, height: 12 * s, borderRadius: 8 * s }]} />
        <View style={huskyStyles.toeRow}>
          <View style={[huskyStyles.toe, { width: 7 * s, height: 7 * s, borderRadius: 4 * s }]} />
          <View style={[huskyStyles.toe, { width: 7 * s, height: 7 * s, borderRadius: 4 * s }]} />
          <View style={[huskyStyles.toe, { width: 7 * s, height: 7 * s, borderRadius: 4 * s }]} />
        </View>
      </Animated.View>
    </View>
  );
}

function DoorSignIn({
  loading,
  label,
  onPress,
  disabled,
}: {
  loading: boolean;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const door = useSharedValue(0);
  const walk = useSharedValue(0);
  const leg = useSharedValue(0);

  useEffect(() => {
    if (loading) {
      door.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
      walk.value = withDelay(180, withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }));
      leg.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 140 }),
          withTiming(0, { duration: 140 })
        ),
        -1,
        false
      );
    } else {
      door.value = withTiming(0, { duration: 220 });
      walk.value = withTiming(0, { duration: 180 });
      cancelAnimation(leg);
      leg.value = 0;
    }
  }, [door, leg, loading, walk]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 240 },
      { rotateY: `${interpolate(door.value, [0, 1], [0, 68])}deg` },
    ],
    opacity: interpolate(door.value, [0, 1], [1, 0.55]),
  }));

  const lightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(door.value, [0, 1], [0.15, 1]),
  }));

  const personStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(walk.value, [0, 1], [0, 22]) },
      { scale: interpolate(walk.value, [0, 1], [1, 0.72]) },
    ],
    opacity: interpolate(walk.value, [0.7, 1], [1, 0]),
  }));

  const legLStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(leg.value, [0, 1], [-18, 16])}deg` }],
  }));
  const legRStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(leg.value, [0, 1], [16, -18])}deg` }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        doorStyles.button,
        pressed && !loading && doorStyles.pressed,
        loading && doorStyles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : null}
      <Text style={doorStyles.label}>{label}</Text>
      <View style={doorStyles.scene}>
        <Animated.View style={[doorStyles.person, personStyle]}>
          <View style={doorStyles.head} />
          <View style={doorStyles.body} />
          <Animated.View style={[doorStyles.leg, doorStyles.legL, legLStyle]} />
          <Animated.View style={[doorStyles.leg, doorStyles.legR, legRStyle]} />
        </Animated.View>
        <View style={doorStyles.frame}>
          <Animated.View style={[doorStyles.light, lightStyle]} />
          <Animated.View style={[doorStyles.panel, panelStyle]} />
        </View>
      </View>
    </Pressable>
  );
}

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const { width } = useWindowDimensions();
  const hi = language === 'hi';
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [focusField, setFocusField] = useState<FocusField>('none');

  const isWide = width >= 960;
  const huskyScale = Math.min(1.05, Math.max(0.78, Math.min(width, 430) / 390));
  const styles = useMemo(
    () => createStyles(colors, isDark, width, isWide),
    [colors, isDark, isWide, width]
  );

  const huskyState: HuskyState = loading
    ? 'happy'
    : focusField === 'password'
      ? showPassword
        ? 'peek'
        : 'password'
      : focusField === 'email'
        ? 'email'
        : 'idle';

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        if (token) {
          router.replace('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Session restore error:', error);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(hi ? 'जानकारी अधूरी है' : 'Missing information', hi ? 'कृपया ईमेल और पासवर्ड दर्ज करें।' : 'Please enter your email and password.');
      return;
    }

    if (!cleanEmail.includes('@')) {
      Alert.alert(hi ? 'अमान्य ईमेल' : 'Invalid email', hi ? 'कृपया सही ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          hi ? 'लॉगिन विफल' : 'Login failed',
          data.message || (hi ? 'ईमेल या पासवर्ड गलत है।' : 'Invalid email or password.')
        );
        return;
      }

      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      router.replace('/dashboard');
    } catch (error) {
      console.error('Login error:', error);

      Alert.alert(
        hi ? 'कनेक्शन त्रुटि' : 'Connection error',
        hi ? 'सर्वर से कनेक्ट नहीं हो सका। सुनिश्चित करें कि backend चल रहा है और फोन व लैपटॉप एक ही Wi-Fi पर हैं।' : 'Unable to connect to the server. Make sure your laptop and phone are connected to the same Wi-Fi and the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.sessionText}>
          {hi ? 'सेशन चेक हो रहा है...' : 'Restoring session...'}
        </Text>
      </View>
    );
  }

  const form = (
    <View style={styles.formColumn}>
      <View style={styles.sparkles}>
        <View style={[styles.spark, styles.sparkA]} />
        <View style={[styles.spark, styles.sparkB]} />
        <View style={[styles.spark, styles.sparkC]} />
      </View>

      <HuskyMascot state={huskyState} emailLength={email.length} scale={huskyScale} />

      <View style={styles.card}>
        <Text style={styles.brand}>TruckFleet</Text>
        <Text style={styles.subtitle}>
          {hi
            ? 'वापसी पर स्वागत है। आपका हस्की पहरा दे रहा है।'
            : "Welcome back. Your husky's keeping watch."}
        </Text>

        <View style={[styles.field, focusField === 'email' && styles.fieldFocused]}>
          <Text style={styles.fieldLabel}>{hi ? 'ईमेल पता' : 'Email'}</Text>
          <View style={styles.fieldRow}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={hi ? 'aap@example.com' : 'you@example.com'}
              placeholderTextColor={isDark ? '#6B7288' : colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!loading}
              onFocus={() => setFocusField('email')}
              onBlur={() => setFocusField((current) => (current === 'email' ? 'none' : current))}
            />
          </View>
        </View>

        <View style={[styles.field, focusField === 'password' && styles.fieldFocused]}>
          <Text style={styles.fieldLabel}>{hi ? 'पासवर्ड' : 'Password'}</Text>
          <View style={styles.fieldRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={hi ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
              placeholderTextColor={isDark ? '#6B7288' : colors.textMuted}
              secureTextEntry={!showPassword}
              style={styles.input}
              editable={!loading}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
              onFocus={() => setFocusField('password')}
              onBlur={() => setFocusField((current) => (current === 'password' ? 'none' : current))}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={10}
              disabled={loading}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={isDark ? '#D1D5DB' : colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.rowBetween}>
          <Pressable
            onPress={() => {
              Alert.alert(
                hi ? 'पासवर्ड भूल गए?' : 'Forgot password?',
                hi ? 'पासवर्ड रिकवरी जल्द उपलब्ध होगी।' : 'Password recovery will be added soon.'
              );
            }}
            disabled={loading}
          >
            <Text style={styles.forgot}>{hi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}</Text>
          </Pressable>
        </View>

        <DoorSignIn
          loading={loading}
          disabled={loading}
          onPress={handleLogin}
          label={loading ? (hi ? 'साइन इन हो रहा है...' : 'Signing in...') : (hi ? 'साइन इन' : 'Sign in')}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{hi ? 'या' : 'OR'}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>
            {hi ? 'क्या आपका अकाउंट नहीं है?' : "Don't have an account?"}
          </Text>
          <Pressable onPress={() => router.push('/signup')} hitSlop={8} disabled={loading}>
            <Text style={styles.signupLink}>{hi ? 'अकाउंट बनाएं' : 'Create account'}</Text>
          </Pressable>
        </View>

        <View style={styles.securityRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={isDark ? '#9CA3AF' : colors.textSecondary}
          />
          <Text style={styles.securityText}>
            {hi ? 'आपकी फ्लीट जानकारी सुरक्षित है' : 'Your fleet data is protected'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.ambient} />
      <View style={styles.ambientTwo} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stage}>
            {isWide ? (
              <View style={styles.wideRow}>
                <View style={styles.leftPanel}>
                  <Text style={styles.heroKicker}>{hi ? 'फ्लीट मैनेजमेंट प्लेटफॉर्म' : 'FLEET MANAGEMENT PLATFORM'}</Text>
                  <Text style={styles.heroTitle}>
                    {hi ? 'साइन इन एक दरवाजा है' : 'SIGN IN IS A DOOR'}
                  </Text>
                  <Text style={styles.heroBody}>
                    {hi
                      ? 'आपकी फ्लीट के लिए जरूरी सब कुछ, एक शक्तिशाली प्लेटफॉर्म में।'
                      : 'Everything your fleet needs, in one powerful platform.'}
                  </Text>
                  <View style={styles.doorArt}>
                  </View>
                </View>
                {form}
              </View>
            ) : (
              form
            )}
          </View>

          <Text style={styles.footer}>
            {hi ? '© 2026 TruckFleet Pro' : '© 2026 TruckFleet Pro'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const huskyStyles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(90, 168, 230, 0.18)',
    borderRadius: 80,
  },
  headGroup: {
    alignItems: 'center',
    zIndex: 5,
  },
  ear: {
    position: 'absolute',
    top: 6,
    backgroundColor: FUR.dark,
    alignItems: 'center',
    paddingTop: 14,
    zIndex: 1,
  },
  earInner: {
    backgroundColor: FUR.innerEar,
    marginTop: 4,
  },
  head: {
    backgroundColor: FUR.dark,
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 2,
  },
  face: {
    position: 'absolute',
    backgroundColor: FUR.white,
  },
  mask: {
    position: 'absolute',
    top: 0,
    backgroundColor: FUR.dark,
  },
  eyesRow: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 4,
  },
  eye: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  iris: {
    backgroundColor: FUR.iris,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    backgroundColor: FUR.pupil,
  },
  shine: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  lid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: FUR.dark,
  },
  happyEyes: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  happyLid: {
    height: 3,
    borderRadius: 2,
    backgroundColor: FUR.line,
    transform: [{ rotate: '-12deg' }],
  },
  blush: {
    position: 'absolute',
    backgroundColor: FUR.blush,
  },
  muzzle: {
    alignItems: 'center',
    zIndex: 5,
  },
  nose: {
    backgroundColor: FUR.nose,
  },
  mouth: {
    marginTop: 1,
    borderColor: FUR.line,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  tongue: {
    backgroundColor: FUR.tongue,
    marginBottom: -1,
  },
  chest: {
    position: 'absolute',
    backgroundColor: FUR.white,
    zIndex: 1,
  },
  paw: {
    position: 'absolute',
    backgroundColor: FUR.white,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  padMain: {
    backgroundColor: FUR.pad,
    marginBottom: 3,
  },
  toeRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 2,
  },
  toe: {
    backgroundColor: FUR.pad,
  },
});

const doorStyles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0B7285',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  scene: {
    width: 72,
    height: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  person: {
    width: 16,
    height: 28,
    alignItems: 'center',
    marginRight: 4,
  },
  head: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  body: {
    width: 2,
    height: 10,
    backgroundColor: '#FFFFFF',
    marginTop: 1,
  },
  leg: {
    position: 'absolute',
    bottom: 0,
    width: 2,
    height: 9,
    backgroundColor: '#FFFFFF',
  },
  legL: {
    left: 5,
  },
  legR: {
    right: 5,
  },
  frame: {
    width: 22,
    height: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  light: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FDE68A',
  },
  panel: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    transformOrigin: 'left center',
  },
});

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean,
  width: number,
  isWide: boolean
) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    screen: {
      flex: 1,
      backgroundColor: isDark ? '#081317' : '#F2F5F7',
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    sessionText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontSize: 13,
    },
    ambient: {
      position: 'absolute',
      width: 340,
      height: 340,
      borderRadius: 170,
      backgroundColor: isDark ? 'rgba(59,130,246,0.16)' : 'rgba(59,130,246,0.10)',
      top: isWide ? 80 : 40,
      alignSelf: 'center',
      left: isWide ? width * 0.52 : (width - 340) / 2,
    },
    ambientTwo: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: isDark ? 'rgba(147,197,253,0.08)' : 'rgba(37,99,235,0.06)',
      bottom: 40,
      right: -40,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 28,
      paddingTop: Platform.OS === 'android' ? 36 : 18,
    },
    stage: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: isWide ? 36 : 16,
    },
    wideRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 48,
      maxWidth: 1100,
      alignSelf: 'center',
      width: '100%',
    },
    leftPanel: {
      flex: 1,
      maxWidth: 460,
      paddingRight: 12,
    },
    heroKicker: {
      color: isDark ? '#93C5FD' : colors.primary,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      marginBottom: 10,
    },
    heroTitle: {
      color: isDark ? '#FFFFFF' : colors.text,
      fontSize: width >= 1280 ? 48 : 36,
      fontWeight: '900',
      letterSpacing: -1.2,
      lineHeight: width >= 1280 ? 52 : 40,
    },
    heroBody: {
      color: isDark ? '#9CA3AF' : colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 12,
      maxWidth: 380,
    },
    doorArt: {
      marginTop: 28,
      height: 160,
      justifyContent: 'flex-end',
    },
    doorGlow: {
      position: 'absolute',
      left: 18,
      bottom: 0,
      width: 90,
      height: 140,
      borderRadius: 8,
      backgroundColor: 'rgba(253, 230, 138, 0.18)',
    },
    doorOpening: {
      position: 'absolute',
      left: 32,
      bottom: 0,
      width: 54,
      height: 128,
      borderRadius: 4,
      backgroundColor: '#FDE68A',
      opacity: 0.9,
    },
    stickWalk: {
      position: 'absolute',
      left: 48,
      bottom: 18,
      alignItems: 'center',
    },
    stickHead: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: isDark ? '#FFFFFF' : colors.text,
    },
    stickBody: {
      width: 3,
      height: 28,
      backgroundColor: isDark ? '#FFFFFF' : colors.text,
      marginTop: 2,
    },
    speech: {
      position: 'absolute',
      left: 110,
      bottom: 88,
      backgroundColor: isDark ? '#FFFFFF' : '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    speechText: {
      color: '#111827',
      fontSize: 12,
      fontWeight: '700',
    },
    formColumn: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      alignItems: 'center',
    },
    sparkles: {
      position: 'absolute',
      right: 18,
      top: 28,
      zIndex: 21,
    },
    spark: {
      height: 2,
      backgroundColor: '#60A5FA',
      borderRadius: 2,
      marginBottom: 5,
      opacity: 0.8,
    },
    sparkA: { width: 18, transform: [{ rotate: '-18deg' }] },
    sparkB: { width: 12, marginLeft: 8, transform: [{ rotate: '-8deg' }] },
    sparkC: { width: 8, marginLeft: 14 },
    card: {
      width: '100%',
      marginTop: -22,
      backgroundColor: isDark ? 'rgba(16, 33, 38, 0.94)' : colors.surface,
      borderRadius: 28,
      paddingHorizontal: 22,
      paddingTop: 28,
      paddingBottom: 22,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(121,215,208,0.38)' : colors.border,
      shadowColor: isDark ? '#35B8B0' : colors.text,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.28 : 0.1,
      shadowRadius: 24,
      elevation: 10,
      zIndex: 10,
    },
    brand: {
      color: isDark ? '#93C5FD' : colors.primary,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -0.8,
    },
    subtitle: {
      color: isDark ? '#C7CDD8' : colors.textSecondary,
      fontSize: 13,
      marginTop: 6,
      marginBottom: 18,
    },
    field: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(148,163,184,0.28)' : colors.border,
      backgroundColor: isDark ? 'rgba(8,10,16,0.72)' : colors.input,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 8,
      minHeight: 58,
    },
    fieldFocused: {
      borderColor: '#35B8B0',
      shadowColor: '#35B8B0',
      shadowOpacity: 0.35,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
    },
    fieldLabel: {
      color: isDark ? '#9CA3AF' : colors.textSecondary,
      fontSize: 11,
      fontWeight: '600',
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      height: 32,
      color: isDark ? '#F9FAFB' : colors.text,
      fontSize: 15,
      padding: 0,
    },
    rowBetween: {
      marginTop: 12,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    forgot: {
      color: isDark ? '#93C5FD' : colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 18,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? 'rgba(148,163,184,0.22)' : colors.border,
    },
    dividerText: {
      color: isDark ? '#6B7280' : colors.textMuted,
      fontSize: 10,
      fontWeight: '800',
      marginHorizontal: 12,
    },
    signupRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    signupText: {
      color: isDark ? '#9CA3AF' : colors.textSecondary,
      fontSize: 13,
    },
    signupLink: {
      color: isDark ? '#E5E7EB' : colors.primary,
      fontSize: 13,
      fontWeight: '800',
      marginLeft: 5,
    },
    securityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 18,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(148,163,184,0.16)' : colors.border,
    },
    securityText: {
      color: isDark ? '#6B7280' : colors.textMuted,
      fontSize: 11,
      marginLeft: 6,
    },
    footer: {
      textAlign: 'center',
      color: isDark ? '#4B5563' : colors.textMuted,
      fontSize: 10,
      marginTop: 16,
    },
  });
