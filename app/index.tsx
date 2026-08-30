import { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
const API_URL = 'https://truckfleetpro-backend-1.onrender.com';
export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const styles = createStyles(colors, isDark);
  const hi = language === 'hi';
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

      // Save authentication data locally
    
await AsyncStorage.setItem('authToken', data.token);
await AsyncStorage.setItem('user', JSON.stringify(data.user));

      // Go to dashboard only after successful authentication
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

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ================= HERO ================= */}
          <View style={styles.hero}>
            <View style={styles.routeLineOne} />
            <View style={styles.routeLineTwo} />
            <View style={styles.routeDotOne} />
            <View style={styles.routeDotTwo} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Ionicons
                  name="navigate"
                  size={22}
                  color="#FFFFFF"
                />
              </View>

              <View>
                <Text style={styles.logoText}>TruckFleet</Text>
                <Text style={styles.logoPro}>PRO</Text>
              </View>
            </View>

            {/* Hero content */}
            <View style={styles.heroContent}>
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>{
                  hi ? 'फ्लीट मैनेजमेंट प्लेटफॉर्म' : 'FLEET MANAGEMENT PLATFORM'
                }</Text>
              </View>

              <Text style={styles.heroTitle}>
                Move smarter.{'\n'}
                <Text style={styles.heroAccent}>{
                  hi ? 'बेहतर तरीके से मैनेज करें।' : 'Manage better.'
                }</Text>
              </Text>

              <Text style={styles.heroDescription}>{
                hi ? 'आपकी फ्लीट के लिए जरूरी सब कुछ, एक शक्तिशाली प्लेटफॉर्म में।' : 'Everything your fleet needs, in one powerful platform.'
              }</Text>
            </View>

            {/* Truck illustration */}
            <View style={styles.truckScene}>
              <View style={styles.road}>
                <View style={styles.roadLineOne} />
                <View style={styles.roadLineTwo} />
                <View style={styles.roadLineThree} />
              </View>

              <View style={styles.truck}>
                <View style={styles.cargo}>
                  <View style={styles.cargoLine} />
                  <View style={styles.cargoLine} />
                  <View style={styles.cargoLine} />
                </View>

                <View style={styles.cabin}>
                  <View style={styles.window} />
                  <View style={styles.windowSmall} />
                  <View style={styles.headLight} />
                </View>

                <View style={[styles.wheel, styles.frontWheel]}>
                  <View style={styles.wheelInner} />
                </View>

                <View style={[styles.wheel, styles.backWheel]}>
                  <View style={styles.wheelInner} />
                </View>
              </View>
            </View>
          </View>

          {/* ================= LOGIN CARD ================= */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.welcome}>{hi ? 'वापसी पर स्वागत है' : 'Welcome back'}</Text>

              <Text style={styles.subtitle}>{
                hi ? 'अपनी फ्लीट जारी रखने के लिए साइन इन करें' : 'Sign in to continue to your fleet'
              }</Text>
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>{hi ? 'ईमेल पता' : 'EMAIL ADDRESS'}</Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                />

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={hi ? 'aap@example.com' : 'you@example.com'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{hi ? 'पासवर्ड' : 'PASSWORD'}</Text>

                <Pressable
                  onPress={() => {
                    Alert.alert(
                      hi ? 'पासवर्ड भूल गए?' : 'Forgot password?',
                      hi ? 'पासवर्ड रिकवरी जल्द उपलब्ध होगी।' : 'Password recovery will be added soon.'
                    );
                  }}
                  disabled={loading}
                >
                  <Text style={styles.forgot}>{
                    hi ? 'पासवर्ड भूल गए?' : 'Forgot password?'
                  }</Text>
                </Pressable>
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                />

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  editable={!loading}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />

                {/* Show / Hide Password */}
                <Pressable
                  onPress={() =>
                    setShowPassword(!showPassword)
                  }
                  hitSlop={10}
                  disabled={loading}
                >
                  <Ionicons
                    name={
                      showPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={21}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            {/* Sign In */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.signInButton,
                pressed && !loading && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                  <Text style={styles.signInText}>{
                    hi ? 'साइन इन हो रहा है...' : 'Signing in...'
                  }</Text>
                </>
              ) : (
                <>
                  <Text style={styles.signInText}>{
                    hi ? 'साइन इन' : 'Sign In'
                  }</Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                </>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />

              <Text style={styles.dividerText}>{hi ? 'या' : 'OR'}</Text>

              <View style={styles.divider} />
            </View>

            {/* Sign Up */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>{
                hi ? 'क्या आपका अकाउंट नहीं है?' : "Don't have an account?"
              }</Text>

              <Pressable
                onPress={() => router.push('/signup')}
                hitSlop={8}
                disabled={loading}
              >
                <Text style={styles.signupLink}>{
                  hi ? 'अकाउंट बनाएं' : 'Create account'
                }</Text>
              </Pressable>
            </View>

            {/* Security */}
            <View style={styles.securityRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.textSecondary}
              />

              <Text style={styles.securityText}>{
                hi ? 'आपकी फ्लीट जानकारी सुरक्षित है' : 'Your fleet data is protected'
              }</Text>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>{
            hi ? '© 2026 TruckFleet Pro' : '© 2026 TruckFleet Pro'
          }</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean
) => StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    paddingBottom: 28,
  },

  /* ================= HERO ================= */

  hero: {
    height: 410,
    backgroundColor: isDark ? '#030A14' : '#071426',
    paddingTop: Platform.OS === 'android' ? 52 : 20,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },

  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  logoPro: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginTop: -1,
  },

  heroContent: {
    marginTop: 32,
    zIndex: 5,
  },

  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(37, 99, 235, 0.20)' : 'rgba(37, 99, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginRight: 7,
  },

  badgeText: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginTop: 15,
  },

  heroAccent: {
    color: '#60A5FA',
  },

  heroDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    width: '72%',
  },

  /* ================= ROUTE DECORATION ================= */

  routeLineOne: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.09)',
    borderRadius: 125,
    right: -80,
    top: -100,
  },

  routeLineTwo: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.06)',
    borderRadius: 165,
    right: -120,
    top: -140,
  },

  routeDotOne: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    right: 80,
    top: 70,
  },

  routeDotTwo: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    right: 125,
    top: 120,
  },

  /* ================= TRUCK ================= */

  truckScene: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 125,
  },

  road: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: isDark ? '#020811' : '#0D1D31',
    borderTopWidth: 1,
    borderTopColor: isDark ? '#102A47' : '#1E3A5F',
  },

  roadLineOne: {
    position: 'absolute',
    width: 70,
    height: 3,
    backgroundColor: '#3B82F6',
    left: 25,
    top: 22,
  },

  roadLineTwo: {
    position: 'absolute',
    width: 70,
    height: 3,
    backgroundColor: '#3B82F6',
    left: 150,
    top: 22,
  },

  roadLineThree: {
    position: 'absolute',
    width: 70,
    height: 3,
    backgroundColor: '#3B82F6',
    right: 25,
    top: 22,
  },

  truck: {
    position: 'absolute',
    left: 55,
    bottom: 32,
    height: 72,
    width: 255,
  },

  cargo: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 177,
    height: 55,
    backgroundColor: isDark ? '#CBD5E1' : '#E2E8F0',
    borderRadius: 4,
    borderBottomWidth: 5,
    borderBottomColor: '#2563EB',
  },

  cargoLine: {
    width: 1,
    height: 47,
    backgroundColor: '#CBD5E1',
    position: 'absolute',
    top: 4,
  },

  cabin: {
    position: 'absolute',
    right: 0,
    top: 19,
    width: 76,
    height: 40,
    backgroundColor: colors.primary,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 4,
    borderBottomWidth: 5,
    borderBottomColor: '#1D4ED8',
  },

  window: {
    position: 'absolute',
    left: 10,
    top: 6,
    width: 29,
    height: 17,
    backgroundColor: '#BFE3FF',
    borderRadius: 3,
  },

  windowSmall: {
    position: 'absolute',
    left: 44,
    top: 6,
    width: 20,
    height: 17,
    backgroundColor: '#BFE3FF',
    borderRadius: 3,
  },

  headLight: {
    position: 'absolute',
    right: -2,
    bottom: 10,
    width: 5,
    height: 9,
    borderRadius: 2,
    backgroundColor: '#FDE68A',
  },

  wheel: {
    position: 'absolute',
    bottom: -14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#020617',
    borderWidth: 4,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },

  frontWheel: {
    right: 15,
  },

  backWheel: {
    left: 28,
  },

  wheelInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748B',
  },

  /* ================= LOGIN CARD ================= */

  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 18,
    marginTop: -26,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 24,

    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,

    elevation: 8,
    zIndex: 10,
  },

  cardHeader: {
    marginBottom: 18,
  },

  welcome: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },

  field: {
    marginTop: 14,
  },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  forgot: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 7,
  },

  inputWrapper: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    color: colors.text,
    fontSize: 14,
  },

  signInButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 10,

    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,

    elevation: 5,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  signInText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: isDark ? '#CBD5E1' : '#E2E8F0',
  },

  dividerText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginHorizontal: 12,
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  signupText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  signupLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 5,
  },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  securityText: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 6,
  },

  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 18,
  },
});