import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
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

  // Document validity dates
  fitnessExpiry?: string;
  fitnessValidUpto?: string;
  fitnessValidUpTo?: string;

  taxExpiry?: string;
  taxValidUpto?: string;
  taxValidUpTo?: string;

  insuranceExpiry?: string;
  insuranceValidUpto?: string;
  insuranceValidUpTo?: string;

  puccExpiry?: string;
  puccValidUpto?: string;
  puccValidUpTo?: string;

  permitExpiry?: string;
  permitValidUpto?: string;
  permitValidUpTo?: string;

  nationalPermitExpiry?: string;
  nationalPermitValidUpto?: string;
  nationalPermitValidUpTo?: string;
};

export default function PapersScreen() {
  const { colors, isDark } = useTheme();
  const { language } = useLanguage();
  const hi = language === 'hi';
  const styles = createStyles(colors, isDark);
  const params = useLocalSearchParams<{ truckId?: string; id?: string; truckNumber?: string }>();
  const truckId = String(params.truckId || params.id || '');
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState<{ key: string; title: string; value?: string } | null>(null);
  const [editDate, setEditDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) { router.replace('/'); return; }
        if (!truckId) { setLoading(false); return; }
        const response = await fetch(`${API_URL}/api/trucks`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const data = await response.json();
        const list: Truck[] = Array.isArray(data) ? data : Array.isArray(data?.trucks) ? data.trucks : Array.isArray(data?.data) ? data.data : [];
        const found = list.find((item) => String(item._id || item.id || '') === truckId) || null;
        setTruck(found);
      } catch (error) {
        console.error('Load papers error:', error);
      } finally { setLoading(false); }
    };
    load();
  }, [truckId]);

  const formatDate = (value?: string) => {
    if (!value) return hi ? 'उपलब्ध नहीं' : 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(hi ? 'en-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatus = (value?: string) => {
    if (!value) return { text: hi ? 'उपलब्ध नहीं' : 'Not available', tone: 'muted' as const };
    const date = new Date(value); date.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    const deadline = new Date(today); deadline.setDate(today.getDate() + 30);
    if (date < today) return { text: hi ? 'समाप्त' : 'Expired', tone: 'danger' as const };
    if (date <= deadline) return { text: hi ? 'जल्द समाप्त' : 'Expiring soon', tone: 'warning' as const };
    return { text: hi ? 'मान्य' : 'Valid', tone: 'success' as const };
  };

  // Keep the six paper fields exactly as required.
  // Multiple property names are supported so the screen works with
  // whichever naming convention the backend currently returns.
  const pickDate = (...values: Array<string | undefined>) =>
    values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');

  const docs = [
    {
      key: 'fitnessExpiry',
      title: hi ? 'फिटनेस वैधता' : 'Fitness Valid UpTo',
      subtitle: hi ? 'वाहन फिटनेस प्रमाणपत्र' : 'Vehicle fitness certificate',
      icon: 'shield-checkmark-outline' as const,
      expiry: pickDate(truck?.fitnessExpiry, truck?.fitnessValidUpto, truck?.fitnessValidUpTo),
    },
    {
      key: 'taxExpiry',
      title: hi ? 'टैक्स वैधता' : 'Tax Valid UpTo',
      subtitle: hi ? 'रोड टैक्स वैधता' : 'Road tax validity',
      icon: 'receipt-outline' as const,
      expiry: pickDate(truck?.taxExpiry, truck?.taxValidUpto, truck?.taxValidUpTo),
    },
    {
      key: 'insuranceExpiry',
      title: hi ? 'बीमा वैधता' : 'Insurance Valid UpTo',
      subtitle: hi ? 'वाहन बीमा वैधता' : 'Vehicle insurance validity',
      icon: 'shield-checkmark-outline' as const,
      expiry: pickDate(truck?.insuranceExpiry, truck?.insuranceValidUpto, truck?.insuranceValidUpTo),
    },
    {
      key: 'puccExpiry',
      title: hi ? 'PUCC वैधता' : 'PUCC Valid Upto',
      subtitle: hi ? 'प्रदूषण प्रमाणपत्र वैधता' : 'Pollution certificate validity',
      icon: 'leaf-outline' as const,
      expiry: pickDate(truck?.puccExpiry, truck?.puccValidUpto, truck?.puccValidUpTo),
    },
    {
      key: 'permitExpiry',
      title: hi ? 'परमिट वैधता' : 'Permit Valid UpTo',
      subtitle: hi ? 'वाहन परमिट वैधता' : 'Vehicle permit validity',
      icon: 'document-text-outline' as const,
      expiry: pickDate(truck?.permitExpiry, truck?.permitValidUpto, truck?.permitValidUpTo),
    },
    {
      key: 'nationalPermitExpiry',
      title: hi ? 'राष्ट्रीय परमिट वैधता' : 'National Permit Valid UpTo',
      subtitle: hi ? 'राष्ट्रीय परमिट वैधता' : 'National permit validity',
      icon: 'map-outline' as const,
      expiry: pickDate(
        truck?.nationalPermitExpiry,
        truck?.nationalPermitValidUpto,
        truck?.nationalPermitValidUpTo
      ),
    },
  ];


  const toInputDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const toISODate = (value: string) => {
    const match = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date.toISOString();
  };

  const openEditor = (doc: { key: string; title: string; expiry?: string }) => {
    setEditingDoc({ key: doc.key, title: doc.title, value: doc.expiry });
    setEditDate(toInputDate(doc.expiry));
  };

  const saveDocumentDate = async () => {
    if (!truckId || !editingDoc) return;
    const isoDate = toISODate(editDate);
    if (!isoDate) {
      Alert.alert('Invalid date', 'Enter date in DD-MM-YYYY format.');
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(`${API_URL}/api/trucks/${truckId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [editingDoc.key]: isoDate }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Document date could not be saved.');

      setTruck(data?.truck || data?.data || { ...truck, [editingDoc.key]: isoDate });
      setEditingDoc(null);
      setEditDate('');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save document date.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>{hi ? 'गाड़ी के पेपर्स' : 'Vehicle Papers'}</Text>
            <Text style={styles.subtitle}>{params.truckNumber || truck?.registrationNumber || (hi ? 'वाहन दस्तावेज़' : 'Document records')}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="documents-outline" size={30} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{hi ? 'दस्तावेज़ स्थिति' : 'Document status'}</Text>
            <Text style={styles.heroSubtitle}>
            {hi
              ? 'फिटनेस, टैक्स, बीमा, PUCC और परमिट की वैधता एक जगह देखें।'
              : 'Track fitness, tax, insurance, PUCC and permit validity in one place.'}
          </Text>
          </View>
        </View>

        {loading ? <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary} /></View> : docs.map((doc) => {
          const status = getStatus(doc.expiry);
          const toneColor = status.tone === 'danger' ? colors.danger : status.tone === 'warning' ? colors.warning : status.tone === 'success' ? colors.success : colors.textMuted;
          const toneBg = status.tone === 'danger' ? (isDark ? '#3A1D28' : '#FDE8EE') : status.tone === 'warning' ? (isDark ? '#3A2D13' : '#FFF7DF') : status.tone === 'success' ? (isDark ? '#123329' : '#E8FAF3') : (isDark ? '#1E293B' : '#F1F5F9');
          return (
            <Pressable
              key={doc.title}
             style={styles.card}
              onPress={() => openEditor(doc)}
            >
              <View style={[styles.docIcon, { backgroundColor: isDark ? '#122A45' : '#E8F2FF' }]}>
                <Ionicons name={doc.icon} size={25} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{doc.title}</Text>
                <Text style={styles.cardSubtitle}>{doc.subtitle}</Text>
                <Text style={styles.expiry}>{hi ? 'समाप्ति: ' : 'Expiry: '}{formatDate(doc.expiry)}</Text>
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.statusPill, { backgroundColor: toneBg }]}>
                  <Text style={[styles.statusText, { color: toneColor }]}>{status.text}</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
              </View>
            </Pressable>
          );
        })}

        <View style={styles.footer}><Ionicons name="shield-checkmark-outline" size={16} color={colors.success} /><Text style={styles.footerText}>{hi ? 'TruckFleet Pro • सुरक्षित दस्तावेज़ प्रबंधन' : 'TruckFleet Pro • Secure document management'}</Text></View>
        <Modal
          visible={!!editingDoc}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => !saving && setEditingDoc(null)}
        >
          <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{editingDoc?.title}</Text>
                    <Text style={styles.modalSubtitle}>Update expiry date</Text>
                  </View>
                  <Pressable style={styles.modalClose} disabled={saving} onPress={() => setEditingDoc(null)}>
                    <Ionicons name="close" size={20} color={colors.text} />
                  </Pressable>
                </View>

                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="done"
                  style={styles.dateInput}
                />
                <Text style={styles.inputHint}>Example: 27-12-2027</Text>

                <Pressable
                  disabled={saving}
                  style={[styles.saveButton, saving && { opacity: 0.6 }]}
                  onPress={saveDocumentDate}
                >
                  {saving ? <ActivityIndicator color="#FFFFFF" /> : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save Date</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 32, paddingBottom: 44 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
  backButton: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerText: { marginLeft: 16, flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#08233F' : '#EAF4FF', borderRadius: 24, padding: 20, marginBottom: 20 },
  heroIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  heroTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  heroSubtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 18, marginBottom: 14 },
  docIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  cardSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  expiry: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 8 },
  cardRight: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8, gap: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  keyboardAvoiding: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  modalSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  modalClose: { width: 42, height: 42, borderRadius: 14, backgroundColor: isDark ? '#172033' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  dateInput: { height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingHorizontal: 15, color: colors.text, backgroundColor: isDark ? '#101827' : '#F8FAFC', fontSize: 16, fontWeight: '700' },
  inputHint: { color: colors.textMuted, fontSize: 11, marginTop: 7 },
  saveButton: { height: 52, marginTop: 20, borderRadius: 15, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  statusText: { fontSize: 10, fontWeight: '800' },
  loader: { paddingVertical: 60, alignItems: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  footerText: { color: colors.textMuted, fontSize: 12, marginLeft: 8 },

});
