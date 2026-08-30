import { useState } from 'react';
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
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';

export default function SignupScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const styles = createStyles(colors, isDark);
  const hi = language === 'hi';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      Alert.alert(
        hi ? 'जानकारी अधूरी है' : 'Missing information',
        hi ? 'कृपया सभी फ़ील्ड भरें।' : 'Please fill in all fields.'
      );
      return;
    }

    if (!cleanEmail.includes('@')) {
      Alert.alert(
        hi ? 'अमान्य ईमेल' : 'Invalid email',
        hi ? 'कृपया सही ईमेल पता दर्ज करें।' : 'Please enter a valid email address.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        hi ? 'कमज़ोर पासवर्ड' : 'Weak password',
        hi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        hi ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match',
        hi ? 'कृपया दोनों पासवर्ड एक जैसे रखें।' : 'Please make sure both passwords are the same.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          hi ? 'साइन अप विफल' : 'Signup failed',
          data.message || (hi ? 'आपका अकाउंट नहीं बनाया जा सका।' : 'Unable to create your account.')
        );
        return;
      }

      Alert.alert(
        hi ? 'अकाउंट बन गया' : 'Account created',
        hi ? 'आपका TruckFleet Pro अकाउंट सफलतापूर्वक बन गया है।' : 'Your TruckFleet Pro account has been created successfully.',
        [
          {
            text: hi ? 'लॉगिन पर जाएं' : 'Continue to Login',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error) {
      console.error('Signup error:', error);

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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color={colors.text}
              />
            </Pressable>

            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Ionicons
                  name="navigate"
                  size={20}
                  color="#FFFFFF"
                />
              </View>

              <View>
                <Text style={styles.logoText}>TruckFleet</Text>
                <Text style={styles.logoPro}>PRO</Text>
              </View>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="business-outline"
                size={32}
                color="#2563EB"
              />
            </View>

            <Text style={styles.title}>
              {hi ? 'अपना अकाउंट बनाएं' : 'Create your account'}
            </Text>

            <Text style={styles.subtitle}>
              {hi
                ? 'अपनी फ्लीट को स्मार्ट और अधिक कुशलता से मैनेज करना शुरू करें।'
                : 'Start managing your fleet smarter and more efficiently.'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            {/* Full Name */}
            <Text style={styles.label}>{hi ? 'पूरा नाम' : 'FULL NAME'}</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={hi ? 'अपना पूरा नाम दर्ज करें' : 'Enter your full name'}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <Text style={[styles.label, styles.labelSpacing]}>
              {hi ? 'ईमेल पता' : 'EMAIL ADDRESS'}
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Password */}
            <Text style={[styles.label, styles.labelSpacing]}>
              {hi ? 'पासवर्ड' : 'PASSWORD'}
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={hi ? 'पासवर्ड बनाएं' : 'Create a password'}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                style={styles.input}
                editable={!loading}
              />

              <Pressable
                onPress={() =>
                  setShowPassword(!showPassword)
                }
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

            {/* Confirm Password */}
            <Text style={[styles.label, styles.labelSpacing]}>
              {hi ? 'पासवर्ड की पुष्टि करें' : 'CONFIRM PASSWORD'}
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={hi ? 'पासवर्ड की पुष्टि करें' : 'Confirm your password'}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                editable={!loading}
                onSubmitEditing={handleSignup}
                returnKeyType="done"
              />

              <Pressable
                onPress={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                disabled={loading}
              >
                <Ionicons
                  name={
                    showConfirmPassword
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={21}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Create Account */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && !loading && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text style={styles.buttonText}>
                    {hi ? 'अकाउंट बनाया जा रहा है...' : 'Creating account...'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {hi ? 'अकाउंट बनाएं' : 'Create Account'}
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                </>
              )}
            </Pressable>

            {/* Login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>
                {hi ? 'क्या आपका पहले से अकाउंट है?' : 'Already have an account?'}
              </Text>

              <Pressable
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.loginLink}>
                  {' '}{hi ? 'साइन इन' : 'Sign in'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.security}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={colors.textSecondary}
            />

            <Text style={styles.securityText}>
              {hi ? 'आपकी अकाउंट जानकारी सुरक्षित है' : 'Your account information is protected'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean
) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingBottom: 34,
    },

    header: {
      paddingTop: Platform.OS === 'android' ? 50 : 18,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },

    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 13,
      borderWidth: 1,
      borderColor: colors.border,
    },

    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    logoBox: {
      width: 39,
      height: 39,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 9,
    },

    logoText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: -0.2,
    },

    logoPro: {
      color: colors.primary,
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 2,
      marginTop: 1,
    },

    hero: {
      marginHorizontal: 18,
      marginTop: 24,
      padding: 22,
      borderRadius: 25,
      backgroundColor: isDark ? '#0B1D32' : '#0B2340',
      borderWidth: 1,
      borderColor: isDark ? '#173A5B' : '#163B63',
      overflow: 'hidden',
    },

    heroGlow: {
      position: 'absolute',
      width: 150,
      height: 150,
      borderRadius: 75,
      right: -55,
      top: -55,
      backgroundColor: 'rgba(37, 99, 235, 0.28)',
    },

    iconCircle: {
      width: 58,
      height: 58,
      borderRadius: 19,
      backgroundColor: 'rgba(96, 165, 250, 0.16)',
      borderWidth: 1,
      borderColor: 'rgba(147, 197, 253, 0.22)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 17,
    },

    title: {
      color: '#FFFFFF',
      fontSize: 29,
      fontWeight: '900',
      letterSpacing: -0.8,
    },

    subtitle: {
      color: '#B9C8D9',
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
      maxWidth: 330,
    },

    card: {
      backgroundColor: colors.surface,
      marginHorizontal: 18,
      marginTop: 16,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: isDark ? 0.18 : 0.07,
      shadowRadius: 18,
      elevation: 5,
    },

    label: {
      color: colors.textSecondary,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.9,
      marginBottom: 8,
    },

    labelSpacing: {
      marginTop: 18,
    },

    inputWrapper: {
      minHeight: 54,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.input,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
    },

    input: {
      flex: 1,
      minHeight: 52,
      marginLeft: 10,
      color: colors.text,
      fontSize: 14,
    },

    button: {
      height: 56,
      borderRadius: 15,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 27,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },

    buttonPressed: {
      opacity: 0.86,
      transform: [{ scale: 0.985 }],
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
    },

    loginRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
    },

    loginText: {
      color: colors.textSecondary,
      fontSize: 13,
    },

    loginLink: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '900',
    },

    security: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      paddingHorizontal: 20,
    },

    securityText: {
      color: colors.textMuted,
      fontSize: 10,
      marginLeft: 7,
    },
  });
