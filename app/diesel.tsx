import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/spacing';
import { radius } from '../constants/radius';
import { typography } from '../constants/typography';
import { Button, Card, EmptyState } from '../components/ui';

const API_URL = 'https://truckfleetpro-backend-1.onrender.com';

type DieselRecord = {
  _id?: string;
  id?: string;
  date?: string;
  litres?: number;
  rate?: number;
  totalAmount?: number;
  odometer?: number;
  fuelStation?: string;
  notes?: string;
};

export default function DieselScreen() {
  const params = useLocalSearchParams<{
    truckId?: string;
    truckNumber?: string;
  }>();

  const truckId = String(params.truckId || '');
  const truckNumber = String(params.truckNumber || '');

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [records, setRecords] = useState<DieselRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState('');
  const [litres, setLitres] = useState('');
  const [rate, setRate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [notes, setNotes] = useState('');

  const getDieselRecords = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      if (!truckId) {
        Alert.alert(
          'Truck ID missing',
          'Unable to load diesel records for this truck.'
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/api/diesel?truckId=${truckId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Unable to load diesel records.'
        );
      }

      const list: DieselRecord[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.records)
          ? data.records
          : Array.isArray(data?.diesel)
            ? data.diesel
            : Array.isArray(data?.data)
              ? data.data
              : [];

      setRecords(list);
    } catch (error) {
      console.error('Diesel loading error:', error);

      Alert.alert(
        'Diesel unavailable',
        error instanceof Error
          ? error.message
          : 'Unable to load diesel records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDieselRecords();
  }, [truckId]);

  const saveDiesel = async () => {
    if (!date.trim() || !litres.trim() || !rate.trim()) {
      Alert.alert('Missing details', 'Date, litres and rate are required.');
      return;
    }

    const litresNumber = Number(litres);
    const rateNumber = Number(rate);

    if (!Number.isFinite(litresNumber) || litresNumber <= 0) {
      Alert.alert('Invalid litres', 'Please enter a valid litres value.');
      return;
    }

    if (!Number.isFinite(rateNumber) || rateNumber <= 0) {
      Alert.alert('Invalid rate', 'Please enter a valid fuel rate.');
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      const totalAmount = litresNumber * rateNumber;

      const response = await fetch(`${API_URL}/api/diesel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          truckId,
          date,
          litres: litresNumber,
          rate: rateNumber,
          totalAmount,
          odometer: odometer ? Number(odometer) : 0,
          fuelStation: fuelStation.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Unable to save diesel record.'
        );
      }

      Alert.alert('Diesel added', 'Fuel record saved successfully.');

      setDate('');
      setLitres('');
      setRate('');
      setOdometer('');
      setFuelStation('');
      setNotes('');
      setShowForm(false);

      await getDieselRecords();
    } catch (error) {
      console.error('Save diesel error:', error);

      Alert.alert(
        'Save failed',
        error instanceof Error
          ? error.message
          : 'Unable to save diesel record.'
      );
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = () => {
    const l = Number(litres);
    const r = Number(rate);

    if (Number.isFinite(l) && Number.isFinite(r)) {
      return l * r;
    }

    return 0;
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>Diesel</Text>
          <Text style={styles.subtitle}>{truckNumber || 'Truck'} • Fuel records</Text>
        </View>

        <Pressable
          onPress={() => setShowForm((value) => !value)}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {showForm && (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Add Diesel Entry</Text>

            <Text style={styles.label}>Date</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Litres</Text>
            <TextInput
              value={litres}
              onChangeText={setLitres}
              placeholder="e.g. 120"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Text style={styles.label}>Rate / Litre</Text>
            <TextInput
              value={rate}
              onChangeText={setRate}
              placeholder="e.g. 95.50"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
            </View>

            <Text style={styles.label}>Odometer</Text>
            <TextInput
              value={odometer}
              onChangeText={setOdometer}
              placeholder="e.g. 125430"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />

            <Text style={styles.label}>Fuel Station</Text>
            <TextInput
              value={fuelStation}
              onChangeText={setFuelStation}
              placeholder="Fuel station name"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, styles.notesInput]}
            />

            <Button
              label="Save Diesel Entry"
              onPress={saveDiesel}
              loading={saving}
              disabled={saving}
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Diesel History</Text>
          <Text style={styles.sectionSubtitle}>
            {records.length} fuel record{records.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.warning} />
            <Text style={styles.loadingText}>Loading diesel records...</Text>
          </View>
        ) : records.length === 0 ? (
          <Card>
            <EmptyState
              icon="water-outline"
              title="No diesel records"
              subtitle="Add your first fuel entry for this truck."
              actionLabel="Add Diesel"
              onAction={() => setShowForm(true)}
            />
          </Card>
        ) : (
          records.map((record, index) => {
            const total =
              Number(record.totalAmount) ||
              Number(record.litres || 0) * Number(record.rate || 0);

            return (
              <Card key={record._id || record.id || String(index)} style={styles.recordCard}>
                <View style={styles.recordTop}>
                  <View style={styles.fuelIcon}>
                    <Ionicons name="water" size={20} color={colors.warning} />
                  </View>

                  <View style={styles.recordMain}>
                    <Text style={styles.recordDate}>
                      {record.date
                        ? new Date(record.date).toLocaleDateString('en-IN')
                        : '--'}
                    </Text>
                    <Text style={styles.recordStation}>
                      {record.fuelStation || 'Fuel station'}
                    </Text>
                  </View>

                  <Text style={styles.recordAmount}>₹{total.toFixed(2)}</Text>
                </View>

                <View style={styles.recordDetails}>
                  <View>
                    <Text style={styles.detailLabel}>Litres</Text>
                    <Text style={styles.detailValue}>{record.litres || 0} L</Text>
                  </View>

                  <View>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>
                      ₹{Number(record.rate || 0).toFixed(2)}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.detailLabel}>Odometer</Text>
                    <Text style={styles.detailValue}>{record.odometer || '--'}</Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      paddingTop: 55,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.md,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.input,
    },

    pressed: {
      opacity: 0.7,
    },

    headerText: {
      flex: 1,
    },

    title: {
      ...typography.h1,
      color: colors.text,
    },

    subtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 3,
      fontWeight: '500',
    },

    addButton: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.warning,
      alignItems: 'center',
      justifyContent: 'center',
    },

    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },

    formCard: {
      marginBottom: spacing.xl,
    },

    formTitle: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.md,
    },

    label: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '700',
      marginBottom: spacing.xs + 2,
      marginTop: spacing.sm + 2,
    },

    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      color: colors.text,
      backgroundColor: colors.input,
      fontSize: 14,
    },

    notesInput: {
      height: 85,
      paddingTop: spacing.md,
      textAlignVertical: 'top',
    },

    totalBox: {
      marginTop: spacing.md,
      padding: spacing.md + 3,
      borderRadius: radius.lg,
      backgroundColor: colors.warningSoft,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    totalLabel: {
      ...typography.bodyStrong,
      color: colors.warning,
    },

    totalValue: {
      ...typography.h1,
      color: colors.warning,
    },

    sectionHeader: {
      marginBottom: spacing.md,
    },

    sectionTitle: {
      ...typography.h2,
      color: colors.text,
    },

    sectionSubtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 3,
      fontWeight: '500',
    },

    center: {
      paddingVertical: spacing.xxl + spacing.lg,
      alignItems: 'center',
    },

    loadingText: {
      ...typography.body,
      color: colors.textMuted,
      marginTop: spacing.md,
    },

    recordCard: {
      marginBottom: spacing.md,
    },

    recordTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    fuelIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.warningSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    recordMain: {
      flex: 1,
      marginLeft: spacing.md,
    },

    recordDate: {
      ...typography.bodyStrong,
      color: colors.text,
      fontSize: 15,
    },

    recordStation: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 3,
      fontWeight: '500',
    },

    recordAmount: {
      ...typography.h3,
      color: colors.warning,
    },

    recordDetails: {
      marginTop: spacing.md + 2,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    detailLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontSize: 11,
    },

    detailValue: {
      ...typography.bodyStrong,
      color: colors.textSecondary,
      marginTop: 3,
    },
  });
