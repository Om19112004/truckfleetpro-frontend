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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
const API_URL = 'https://truckfleetpro-backend-1.onrender.com';

export default function AddTruckScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const styles = createStyles(colors, isDark);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [truckType, setTruckType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTruck = async () => {
    if (
      !registrationNumber.trim() ||
      !make.trim() ||
      !model.trim() ||
      !year.trim() ||
      !truckType.trim() ||
      !capacity.trim()
    ) {
      Alert.alert(
        language === 'hi' ? 'जानकारी अधूरी है' : 'Missing information',
        language === 'hi' ? 'कृपया ट्रक की सभी जानकारी भरें।' : 'Please fill in all truck details.'
      );
      return;
    }

    const yearNumber = Number(year);
    const capacityNumber = Number(capacity);

    if (Number.isNaN(yearNumber) || yearNumber < 1900 || yearNumber > 2100) {
      Alert.alert(
        language === 'hi' ? 'अमान्य वर्ष' : 'Invalid year',
        language === 'hi' ? 'कृपया सही निर्माण वर्ष दर्ज करें।' : 'Please enter a valid truck manufacturing year.'
      );
      return;
    }

    if (Number.isNaN(capacityNumber) || capacityNumber <= 0) {
      Alert.alert(
        language === 'hi' ? 'अमान्य क्षमता' : 'Invalid capacity',
        language === 'hi' ? 'कृपया सही क्षमता दर्ज करें।' : 'Please enter a valid capacity.'
      );
      return;
    }

    setLoading(true);

    try {
      // Get the JWT token from the current login session.
      // Temporary fallback is kept for development testing.
      const token = await AsyncStorage.getItem('authToken');

if (!token) {
  Alert.alert(
    language === 'hi' ? 'सेशन समाप्त हो गया' : 'Session expired',
    language === 'hi' ? 'कृपया दोबारा लॉगिन करें।' : 'Please login again.'
  );
  router.replace('/');
  return;
}

      const response = await fetch(`${API_URL}/api/trucks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
        body: JSON.stringify({
          registrationNumber: registrationNumber.trim().toUpperCase(),
          make: make.trim(),
          model: model.trim(),
          year: yearNumber,
          truckType: truckType.trim(),
          capacity: capacityNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          language === 'hi' ? 'ट्रक नहीं जोड़ा जा सका' : 'Unable to add truck',
          data.message || language === 'hi' ? 'कुछ गलत हो गया।' : 'Something went wrong.'
        );
        return;
      }

      Alert.alert(
        language === 'hi' ? 'ट्रक जोड़ा गया' : 'Truck added',
        language === 'hi' ? 'ट्रक आपकी फ्लीट में सफलतापूर्वक जोड़ दिया गया है।' : 'The truck has been successfully added to your fleet.',
        [
          {
            text: language === 'hi' ? 'हो गया' : 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Add truck error:', error);

      Alert.alert(
        language === 'hi' ? 'कनेक्शन त्रुटि' : 'Connection error',
        language === 'hi' ? 'सर्वर से कनेक्ट नहीं हो सका। सुनिश्चित करें कि backend चल रहा है और आपका फोन और लैपटॉप एक ही Wi-Fi से जुड़े हैं।' : 'Unable to connect to the server. Make sure the backend is running and your phone and laptop are connected to the same Wi-Fi.'
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

            <View>
              <Text style={styles.headerTitle}>{language === 'hi' ? 'ट्रक जोड़ें' : 'Add Truck'}</Text>
              <Text style={styles.headerSubtitle}>{
                language === 'hi' ? 'नया वाहन रजिस्टर करें' : 'Register a new vehicle'
              }</Text>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="car-outline"
                size={31}
                color="#2563EB"
              />
            </View>

            <Text style={styles.title}>{
              language === 'hi' ? 'नया ट्रक जोड़ें' : 'Add a new truck'
            }</Text>

            <Text style={styles.subtitle}>{
              language === 'hi' ? 'नीचे वाहन की जानकारी भरकर इसे अपनी फ्लीट में जोड़ें।' : 'Enter the vehicle details below to add it to your fleet.'
            }</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            {/* Registration Number */}
            <Text style={styles.label}>{
              language === 'hi' ? 'रजिस्ट्रेशन नंबर' : 'REGISTRATION NUMBER'
            }</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="card-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                placeholder={language === 'hi' ? 'जैसे CG04AB1234' : 'e.g. CG04AB1234'}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Make */}
            <Text style={[styles.label, styles.labelSpacing]}>{
              language === 'hi' ? 'कंपनी' : 'MAKE'
            }</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="business-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={make}
                onChangeText={setMake}
                placeholder={language === 'hi' ? 'जैसे Tata' : 'e.g. Tata'}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Model */}
            <Text style={[styles.label, styles.labelSpacing]}>{
              language === 'hi' ? 'मॉडल' : 'MODEL'
            }</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="car-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={model}
                onChangeText={setModel}
                placeholder={language === 'hi' ? 'जैसे Prima' : 'e.g. Prima'}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Year */}
            <Text style={[styles.label, styles.labelSpacing]}>{
              language === 'hi' ? 'निर्माण वर्ष' : 'MANUFACTURING YEAR'
            }</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={year}
                onChangeText={setYear}
                placeholder={language === 'hi' ? 'जैसे 2024' : 'e.g. 2024'}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Truck Type */}
            <Text style={[styles.label, styles.labelSpacing]}>{
              language === 'hi' ? 'ट्रक का प्रकार' : 'TRUCK TYPE'
            }</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="cube-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={truckType}
                onChangeText={setTruckType}
                placeholder={language === 'hi' ? 'जैसे Heavy Truck' : 'e.g. Heavy Truck'}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                editable={!loading}
              />
            </View>

            {/* Capacity */}
            <Text style={[styles.label, styles.labelSpacing]}>{
              language === 'hi' ? 'क्षमता (टन)' : 'CAPACITY (TONS)'
            }</Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="speedometer-outline"
                size={20}
                color={colors.textSecondary}
              />

              <TextInput
                value={capacity}
                onChangeText={setCapacity}
                placeholder={language === 'hi' ? 'जैसे 25' : 'e.g. 25'}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={styles.input}
                editable={!loading}
                onSubmitEditing={handleAddTruck}
              />
            </View>

            {/* Add Truck */}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && !loading && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleAddTruck}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text style={styles.buttonText}>{
                    language === 'hi' ? 'ट्रक जोड़ा जा रहा है...' : 'Adding truck...'
                  }</Text>
                </>
              ) : (
                <>
                  <Text style={styles.buttonText}>{
                    language === 'hi' ? 'ट्रक जोड़ें' : 'Add Truck'
                  }</Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                </>
              )}
            </Pressable>
          </View>

          {/* Security */}
          <View style={styles.security}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={colors.textSecondary}
            />

            <Text style={styles.securityText}>{
              language === 'hi' ? 'आपकी फ्लीट जानकारी सुरक्षित रूप से संग्रहीत है' : 'Your fleet information is securely stored'
            }</Text>
          </View>
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

  content: {
    paddingBottom: 30,
  },

  header: {
    paddingTop: Platform.OS === 'android' ? 52 : 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  hero: {
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 24,
  },

  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: isDark ? '#172F4A' : '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 330,
  },

  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 18,
    borderRadius: 22,
    padding: 22,

    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,

    elevation: 6,
  },

  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 7,
  },

  labelSpacing: {
    marginTop: 17,
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

  button: {
    height: 54,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 25,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  security: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  securityText: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 6,
  },
});