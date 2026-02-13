import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import BusinessPersonalToggle from '../components/BusinessPersonalToggle';
import {
  requestLocationPermission,
  calculateRouteDistance,
  formatDuration,
} from '../services/locationService';
import { addTrip, getTrips } from '../services/storageService';
import { getLastOdometerReading } from '../utils/mileageCalculations';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { lightTap, mediumTap, successNotification, errorNotification } from '../utils/haptics';

const TRACKING_INTERVAL = 5000; // 5 seconds between GPS reads
const MIN_DISTANCE_METERS = 10; // Min movement to record point

export default function GPSTrackingScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  const [permissionGranted, setPermissionGranted] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState([]);
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tripComplete, setTripComplete] = useState(false);

  // Trip details (filled after stopping)
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isBusinessTrip, setIsBusinessTrip] = useState(true);
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const watchRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Request permission on mount
  useEffect(() => {
    (async () => {
      const result = await requestLocationPermission();
      setPermissionGranted(result.granted);
    })();
    return () => {
      stopWatching();
    };
  }, []);

  const stopWatching = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStart = async () => {
    mediumTap();
    setPoints([]);
    setDistance(0);
    setElapsed(0);
    setTripComplete(false);
    startTimeRef.current = Date.now();

    // Start elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // Start location watching
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: TRACKING_INTERVAL,
        distanceInterval: MIN_DISTANCE_METERS,
      },
      (location) => {
        const newPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        };
        setPoints((prev) => {
          const updated = [...prev, newPoint];
          setDistance(calculateRouteDistance(updated));
          return updated;
        });
      }
    );
    watchRef.current = sub;
    setTracking(true);
  };

  const handleStop = () => {
    mediumTap();
    stopWatching();
    setTracking(false);
    setTripComplete(true);
  };

  const handleSave = async () => {
    if (distance < 0.1) {
      errorNotification();
      Alert.alert(t('common.error'), t('gps.tooShort'));
      return;
    }

    setSaving(true);
    try {
      const trips = await getTrips();
      const lastOdo = getLastOdometerReading(trips);
      const startOdo = lastOdo > 0 ? lastOdo : 0;
      const endOdo = startOdo + Math.round(distance);

      await addTrip({
        date: new Date().toISOString().split('T')[0],
        destination: destination || t('gps.gpsTrip'),
        purpose: purpose || '',
        startOdometer: startOdo,
        endOdometer: endOdo,
        isBusinessTrip,
        clientName: isBusinessTrip ? clientName : '',
        notes: notes
          ? `${notes}\n[GPS: ${distance} km, ${formatDuration(elapsed)}]`
          : `[GPS: ${distance} km, ${formatDuration(elapsed)}]`,
      });
      successNotification();
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('common.error'), err.message || 'Failed to save trip.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    lightTap();
    Alert.alert(t('gps.discardTitle'), t('gps.discardMessage'), [
      { text: t('receipts.cancel'), style: 'cancel' },
      {
        text: t('gps.discard'),
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  // Permission denied state
  if (permissionGranted === false) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.permText, { color: colors.warning }]}>
          {t('gps.permissionDenied')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Live Stats */}
      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t('gps.distance')}</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{distance.toFixed(1)} km</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t('gps.duration')}</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{formatDuration(elapsed)}</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t('gps.points')}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{points.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t('gps.status')}</Text>
            <Text
              style={[
                styles.statValue,
                { color: tracking ? colors.success : tripComplete ? colors.warning : colors.muted },
              ]}
            >
              {tracking ? t('gps.recording') : tripComplete ? t('gps.stopped') : t('gps.ready')}
            </Text>
          </View>
        </View>
      </View>

      {/* Controls */}
      {!tripComplete && (
        <View style={styles.controlRow}>
          {!tracking ? (
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.success }]}
              onPress={handleStart}
              disabled={permissionGranted !== true}
              accessibilityRole="button"
              accessibilityLabel={t('gps.startTrip')}
            >
              <Text style={[styles.controlText, { color: colors.white }]}>
                {t('gps.startTrip')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.danger }]}
              onPress={handleStop}
              accessibilityRole="button"
              accessibilityLabel={t('gps.stopTrip')}
            >
              <Text style={[styles.controlText, { color: colors.white }]}>
                {t('gps.stopTrip')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Trip details form (after stopping) */}
      {tripComplete && (
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>{t('gps.tripDetails')}</Text>

          <Text style={[styles.label, { color: colors.text }]}>{t('mileage.destination')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
            placeholder={t('gps.destinationPlaceholder')}
            placeholderTextColor={colors.muted}
            value={destination}
            onChangeText={setDestination}
          />

          <Text style={[styles.label, { color: colors.text }]}>{t('mileage.purpose')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
            placeholder={t('gps.purposePlaceholder')}
            placeholderTextColor={colors.muted}
            value={purpose}
            onChangeText={setPurpose}
          />

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
                placeholderTextColor={colors.muted}
                value={clientName}
                onChangeText={setClientName}
              />
            </>
          )}

          <Text style={[styles.label, { color: colors.text }]}>{t('mileage.notesOptional')}</Text>
          <TextInput
            style={[styles.input, styles.multiline, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
            placeholder={t('gps.notesPlaceholder')}
            placeholderTextColor={colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabled, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={t('gps.saveTrip')}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>
              {saving ? t('receipts.saving') : t('gps.saveTrip')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.discardButton, { borderColor: colors.danger }]}
            onPress={handleDiscard}
            accessibilityRole="button"
            accessibilityLabel={t('gps.discard')}
          >
            <Text style={[styles.discardText, { color: colors.danger }]}>
              {t('gps.discard')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.footer, { color: colors.muted }]}>
        {t('gps.footer')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  permText: { fontSize: FONT_SIZES.md, textAlign: 'center', fontWeight: FONT_WEIGHTS.medium },
  statsCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  statRow: { flexDirection: 'row', marginBottom: SPACING.md },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: FONT_SIZES.xs, marginBottom: SPACING.xs },
  statValue: { fontSize: FONT_SIZES.title, fontWeight: FONT_WEIGHTS.bold },
  controlRow: { marginBottom: SPACING.lg },
  controlButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  controlText: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold },
  formCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  formTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
  },
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
  saveButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  disabled: { opacity: 0.6 },
  buttonText: { fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.md },
  discardButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  discardText: { fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.sm },
  footer: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
});
