import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BusinessPersonalToggle from '../components/BusinessPersonalToggle';
import { addTrip, getTrips, updateTrip } from '../services/storageService';
import { getLastOdometerReading } from '../utils/mileageCalculations';
import { validateTrip } from '../utils/validation';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';

export default function MileageAddScreen({ navigation, route }) {
  const editMode = route.params?.editMode || false;
  const existing = route.params?.trip || null;

  const [date, setDate] = useState(
    editMode ? existing.date : new Date().toISOString().split('T')[0]
  );
  const [destination, setDestination] = useState(
    editMode ? existing.destination : ''
  );
  const [purpose, setPurpose] = useState(
    editMode ? existing.purpose : ''
  );
  const [startOdometer, setStartOdometer] = useState(
    editMode ? String(existing.startOdometer) : ''
  );
  const [endOdometer, setEndOdometer] = useState(
    editMode ? String(existing.endOdometer) : ''
  );
  const [isBusinessTrip, setIsBusinessTrip] = useState(
    editMode ? existing.isBusinessTrip : true
  );
  const [clientName, setClientName] = useState(
    editMode ? existing.clientName || '' : ''
  );
  const [notes, setNotes] = useState(
    editMode ? existing.notes || '' : ''
  );
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editMode) {
      (async () => {
        const trips = await getTrips();
        const lastReading = getLastOdometerReading(trips);
        if (lastReading > 0) {
          setStartOdometer(String(lastReading));
        }
      })();
    }
  }, [editMode]);

  const distance =
    Number(endOdometer) > Number(startOdometer)
      ? Number(endOdometer) - Number(startOdometer)
      : 0;

  const onSave = async () => {
    const tripData = { date, destination, purpose, startOdometer, endOdometer };
    const validation = validateTrip(tripData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors([]);
    setSaving(true);

    try {
      if (editMode) {
        await updateTrip(existing.id, {
          date,
          destination,
          purpose,
          startOdometer: Number(startOdometer),
          endOdometer: Number(endOdometer),
          isBusinessTrip,
          clientName: isBusinessTrip ? clientName : '',
          notes,
        });
      } else {
        await addTrip({
          date,
          destination,
          purpose,
          startOdometer,
          endOdometer,
          isBusinessTrip,
          clientName: isBusinessTrip ? clientName : '',
          notes,
        });
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save trip.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {errors.length > 0 && (
          <View style={styles.errorBox}>
            {errors.map((e, i) => (
              <Text key={i} style={styles.errorText}>{e}</Text>
            ))}
          </View>
        )}

        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.label}>Destination</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Client office downtown"
          value={destination}
          onChangeText={setDestination}
        />

        <Text style={styles.label}>Purpose</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Client meeting, delivery"
          value={purpose}
          onChangeText={setPurpose}
        />

        <Text style={styles.label}>Start Odometer (km)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          keyboardType="numeric"
          value={startOdometer}
          onChangeText={setStartOdometer}
        />

        <Text style={styles.label}>End Odometer (km)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          keyboardType="numeric"
          value={endOdometer}
          onChangeText={setEndOdometer}
        />

        {distance > 0 && (
          <View style={styles.distanceDisplay}>
            <Text style={styles.distanceLabel}>Distance</Text>
            <Text style={styles.distanceValue}>{distance} km</Text>
          </View>
        )}

        <BusinessPersonalToggle
          isBusinessTrip={isBusinessTrip}
          onChange={setIsBusinessTrip}
        />

        {isBusinessTrip && (
          <>
            <Text style={styles.label}>Client Name (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Uber, DoorDash"
              value={clientName}
              onChangeText={setClientName}
            />
          </>
        )}

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Additional details"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : editMode ? 'Update Trip' : 'Save Trip'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  label: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  distanceDisplay: {
    backgroundColor: COLORS.successLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: FONT_WEIGHTS.medium,
  },
  distanceValue: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.success,
    fontWeight: FONT_WEIGHTS.bold,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.lg,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  errorBox: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
  },
});
