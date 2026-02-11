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
import DatePickerField from '../components/DatePickerField';
import { addTrip, getTrips, updateTrip } from '../services/storageService';
import { getLastOdometerReading } from '../utils/mileageCalculations';
import { validateTrip } from '../utils/validation';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function MileageAddScreen({ navigation, route }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
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
      Alert.alert(t('common.error'), err.message || 'Failed to save trip.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        {errors.length > 0 && (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
            {errors.map((e, i) => (
              <Text key={i} style={[styles.errorText, { color: colors.danger }]}>{e}</Text>
            ))}
          </View>
        )}

        <DatePickerField
          label={t('mileage.date')}
          value={date}
          onChange={setDate}
        />

        <Text style={[styles.label, { color: colors.text }]}>{t('mileage.destination')}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
          placeholder="e.g., Client office downtown"
          value={destination}
          onChangeText={setDestination}
        />

        <Text style={[styles.label, { color: colors.text }]}>{t('mileage.purpose')}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
          placeholder="e.g., Client meeting, delivery"
          value={purpose}
          onChangeText={setPurpose}
        />

        <Text style={[styles.label, { color: colors.text }]}>{t('mileage.startOdometerKm')}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
          placeholder="0"
          keyboardType="numeric"
          value={startOdometer}
          onChangeText={setStartOdometer}
        />

        <Text style={[styles.label, { color: colors.text }]}>{t('mileage.endOdometerKm')}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
          placeholder="0"
          keyboardType="numeric"
          value={endOdometer}
          onChangeText={setEndOdometer}
        />

        {distance > 0 && (
          <View style={[styles.distanceDisplay, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.distanceLabel, { color: colors.success }]}>{t('mileage.distance')}</Text>
            <Text style={[styles.distanceValue, { color: colors.success }]}>{distance} km</Text>
          </View>
        )}

        <BusinessPersonalToggle
          isBusinessTrip={isBusinessTrip}
          onChange={setIsBusinessTrip}
        />

        {isBusinessTrip && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>{t('mileage.clientNameOptional')}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
              placeholder="e.g., Uber, DoorDash"
              value={clientName}
              onChangeText={setClientName}
            />
          </>
        )}

        <Text style={[styles.label, { color: colors.text }]}>{t('mileage.notesOptional')}</Text>
        <TextInput
          style={[styles.input, styles.multiline, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
          placeholder="Additional details"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled, { backgroundColor: colors.primary }]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={[styles.saveButtonText, { color: colors.white }]}>
            {saving ? 'Saving...' : editMode ? t('mileage.updateTrip') : t('mileage.saveTrip')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, },
  content: { padding: SPACING.lg },
  label: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  distanceDisplay: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  distanceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  saveButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.lg,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
  },
});
