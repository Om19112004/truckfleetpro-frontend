import React, { useEffect, useState } from 'react';
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
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

      const token =
        await AsyncStorage.getItem('authToken');

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
          data?.message ||
            'Unable to load diesel records.'
        );
      }

      const list: DieselRecord[] =
        Array.isArray(data)
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
      console.error(
        'Diesel loading error:',
        error
      );

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
    if (
      !date.trim() ||
      !litres.trim() ||
      !rate.trim()
    ) {
      Alert.alert(
        'Missing details',
        'Date, litres and rate are required.'
      );
      return;
    }

    const litresNumber = Number(litres);
    const rateNumber = Number(rate);

    if (
      !Number.isFinite(litresNumber) ||
      litresNumber <= 0
    ) {
      Alert.alert(
        'Invalid litres',
        'Please enter a valid litres value.'
      );
      return;
    }

    if (
      !Number.isFinite(rateNumber) ||
      rateNumber <= 0
    ) {
      Alert.alert(
        'Invalid rate',
        'Please enter a valid fuel rate.'
      );
      return;
    }

    try {
      setSaving(true);

      const token =
        await AsyncStorage.getItem('authToken');

      if (!token) {
        router.replace('/');
        return;
      }

      const totalAmount =
        litresNumber * rateNumber;

      const response = await fetch(
        `${API_URL}/api/diesel`,
        {
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
            odometer: odometer
              ? Number(odometer)
              : 0,
            fuelStation: fuelStation.trim(),
            notes: notes.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Unable to save diesel record.'
        );
      }

      Alert.alert(
        'Diesel added',
        'Fuel record saved successfully.'
      );

      setDate('');
      setLitres('');
      setRate('');
      setOdometer('');
      setFuelStation('');
      setNotes('');
      setShowForm(false);

      await getDieselRecords();
    } catch (error) {
      console.error(
        'Save diesel error:',
        error
      );

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

    if (
      Number.isFinite(l) &&
      Number.isFinite(r)
    ) {
      return l * r;
    }

    return 0;
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#111827"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>
            Diesel
          </Text>

          <Text style={styles.subtitle}>
            {truckNumber || 'Truck'} • Fuel records
          </Text>
        </View>

        <Pressable
          onPress={() =>
            setShowForm((value) => !value)
          }
          style={styles.addButton}
        >
          <Ionicons
            name={
              showForm
                ? 'close'
                : 'add'
            }
            size={22}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              Add Diesel Entry
            </Text>

            <Text style={styles.label}>
              Date
            </Text>

            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={styles.label}>
              Litres
            </Text>

            <TextInput
              value={litres}
              onChangeText={setLitres}
              placeholder="e.g. 120"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Text style={styles.label}>
              Rate / Litre
            </Text>

            <TextInput
              value={rate}
              onChangeText={setRate}
              placeholder="e.g. 95.50"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>
                Total Amount
              </Text>

              <Text style={styles.totalValue}>
                ₹
                {calculateTotal().toFixed(2)}
              </Text>
            </View>

            <Text style={styles.label}>
              Odometer
            </Text>

            <TextInput
              value={odometer}
              onChangeText={setOdometer}
              placeholder="e.g. 125430"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              style={styles.input}
            />

            <Text style={styles.label}>
              Fuel Station
            </Text>

            <TextInput
              value={fuelStation}
              onChangeText={setFuelStation}
              placeholder="Fuel station name"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={styles.label}>
              Notes
            </Text>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor="#9CA3AF"
              multiline
              style={[
                styles.input,
                styles.notesInput,
              ]}
            />

            <Pressable
              onPress={saveDiesel}
              disabled={saving}
              style={[
                styles.saveButton,
                saving &&
                  styles.disabledButton,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>
                  Save Diesel Entry
                </Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Diesel History
            </Text>

            <Text style={styles.sectionSubtitle}>
              {records.length} fuel record
              {records.length !== 1
                ? 's'
                : ''}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color="#D97706"
            />

            <Text style={styles.loadingText}>
              Loading diesel records...
            </Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="water-outline"
                size={30}
                color="#D97706"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No diesel records
            </Text>

            <Text style={styles.emptyText}>
              Add your first fuel entry for this
              truck.
            </Text>

            <Pressable
              onPress={() =>
                setShowForm(true)
              }
              style={styles.emptyButton}
            >
              <Text
                style={styles.emptyButtonText}
              >
                Add Diesel
              </Text>
            </Pressable>
          </View>
        ) : (
          records.map((record, index) => {
            const total =
              Number(
                record.totalAmount
              ) ||
              Number(record.litres || 0) *
                Number(record.rate || 0);

            return (
              <View
                key={
                  record._id ||
                  record.id ||
                  String(index)
                }
                style={styles.recordCard}
              >
                <View style={styles.recordTop}>
                  <View style={styles.fuelIcon}>
                    <Ionicons
                      name="water"
                      size={22}
                      color="#D97706"
                    />
                  </View>

                  <View
                    style={
                      styles.recordMain
                    }
                  >
                    <Text
                      style={
                        styles.recordDate
                      }
                    >
                      {record.date
                        ? new Date(
                            record.date
                          ).toLocaleDateString(
                            'en-IN'
                          )
                        : '--'}
                    </Text>

                    <Text
                      style={
                        styles.recordStation
                      }
                    >
                      {record.fuelStation ||
                        'Fuel station'}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.recordAmount
                    }
                  >
                    ₹{total.toFixed(2)}
                  </Text>
                </View>

                <View
                  style={styles.recordDetails}
                >
                  <View>
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Litres
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {record.litres || 0} L
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Rate
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      ₹
                      {Number(
                        record.rate || 0
                      ).toFixed(2)}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Odometer
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {record.odometer || '--'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F8FC',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 13,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },

  notesInput: {
    height: 85,
    paddingTop: 13,
    textAlignVertical: 'top',
  },

  totalBox: {
    marginTop: 14,
    padding: 15,
    borderRadius: 13,
    backgroundColor: '#FFF7DF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },

  totalValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#B45309',
  },

  saveButton: {
    marginTop: 18,
    height: 50,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },

  center: {
    paddingVertical: 60,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFF7DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },

  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: '#D97706',
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  recordTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  fuelIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFF7DF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recordMain: {
    flex: 1,
    marginLeft: 12,
  },

  recordDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  recordStation: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },

  recordAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
  },

  recordDetails: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  detailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  detailValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
});