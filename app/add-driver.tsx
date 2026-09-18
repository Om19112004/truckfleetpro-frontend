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
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';

export default function AddDriverScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();

  const styles = createStyles(colors, isDark);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2600);
  };

  const hi = language === 'hi';

  const handleAddDriver = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert(
        hi ? 'जानकारी अधूरी है' : 'Missing information',
        hi
          ? 'कृपया सभी आवश्यक जानकारी भरें।'
          : 'Please fill all required fields.'
      );
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert(
          hi ? 'सेशन समाप्त हो गया' : 'Session expired',
          hi ? 'कृपया दोबारा लॉगिन करें।' : 'Please login again.'
        );

        router.replace('/');
        return;
      }

      const response = await fetch(`${API_URL}/api/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(
          'error',
          data?.message ||
            (hi ? 'कुछ गलत हो गया।' : 'Something went wrong.')
        );
        return;
      }

      showToast(
        'success',
        hi
          ? 'ड्राइवर सफलतापूर्वक जोड़ा गया'
          : 'Driver added successfully'
      );

      setTimeout(() => {
        router.back();
      }, 700);
    } catch (error) {
      console.error('Add driver error:', error);

      showToast(
        'error',
        hi
          ? 'सर्वर से कनेक्ट नहीं हो सका'
          : 'Unable to connect to the server'
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color={colors.text}
              />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                {hi ? 'ड्राइवर जोड़ें' : 'Add Driver'}
              </Text>

              <Text style={styles.headerSubtitle}>
                {hi ? 'नया ड्राइवर रजिस्टर करें' : 'Register a new driver'}
              </Text>
            </View>
          </View>

          {/* HERO */}
          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="person-add-outline"
                size={31}
                color={colors.primary}
              />
            </View>

            <Text style={styles.title}>
              {hi ? 'ड्राइवर की जानकारी' : 'Driver details'}
            </Text>

            <Text style={styles.subtitle}>
              {hi
                ? 'ड्राइवर की मूल जानकारी दर्ज करें।'
                : "Add the driver's basic information."}
            </Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>
            {/* NAME */}
            <Text style={styles.label}>
              {hi ? 'ड्राइवर का नाम *' : 'DRIVER NAME *'}
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                placeholder={
                  hi ? 'ड्राइवर का पूरा नाम' : "Enter driver's full name"
                }
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* PHONE */}
            <Text style={[styles.label, styles.labelSpacing]}>
              {hi ? 'फोन नंबर *' : 'PHONE NUMBER *'}
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="call-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                placeholder={
                  hi ? 'फोन नंबर दर्ज करें' : 'Enter phone number'
                }
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* BUTTON */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && !loading && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleAddDriver}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text style={styles.buttonText}>
                    {hi ? 'ड्राइवर जोड़ा जा रहा है...' : 'Adding Driver...'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {hi ? 'ड्राइवर जोड़ें' : 'Add Driver'}
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                </>
              )}
            </Pressable>
          </View>

          {/* SECURITY */}
          <View style={styles.security}>
            <View style={styles.securityIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.success}
              />
            </View>

            <Text style={styles.securityText}>
              {hi
                ? 'ड्राइवर की जानकारी सुरक्षित रूप से संग्रहीत है'
                : 'Driver information is securely stored'}
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
      paddingBottom: 35,
    },

    header: {
      paddingTop: Platform.OS === 'android' ? 52 : 20,
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

    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.97 }],
    },

    headerText: {
      flex: 1,
    },

    headerTitle: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '900',
      letterSpacing: -0.3,
    },

    headerSubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 3,
    },

    hero: {
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 24,
    },

    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 21,
      backgroundColor: isDark ? '#163B40' : '#E2F3F1',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
      borderWidth: 1,
      borderColor: isDark ? '#285B60' : '#B9DEDA',
    },

    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.8,
    },

    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
      maxWidth: 340,
    },

    card: {
      backgroundColor: colors.surface,
      marginHorizontal: 18,
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
      minHeight: 53,
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
      minHeight: 51,
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
      marginTop: 26,
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
      backgroundColor: '#138A72',
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

    security: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 22,
      paddingHorizontal: 20,
    },

    securityIcon: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: isDark ? '#12352F' : '#E8F8F5',
      alignItems: 'center',
      justifyContent: 'center',
    },

    securityText: {
      color: colors.textMuted,
      fontSize: 10,
      marginLeft: 7,
    },
  });