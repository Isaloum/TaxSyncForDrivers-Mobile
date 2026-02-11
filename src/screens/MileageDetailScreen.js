import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTripById, deleteTrip } from '../services/storageService';
import { calculateSimplifiedDeduction } from '../utils/mileageCalculations';
import LoadingIndicator from '../components/LoadingIndicator';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function MileageDetailScreen({ navigation, route }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const data = await getTripById(tripId);
        if (active) {
          setTrip(data);
          setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [tripId])
  );

  const handleDelete = () => {
    Alert.alert(
      t('mileage.deleteTrip'),
      t('mileage.areYouSure'),
      [
        { text: t('mileage.cancel'), style: 'cancel' },
        {
          text: t('mileage.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteTrip(tripId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('MileageAdd', { editMode: true, trip });
  };

  if (loading) return <LoadingIndicator message={t('common.loading')} />;

  if (!trip) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.muted }]}>{t('mileage.tripNotFound')}</Text>
      </View>
    );
  }

  const deductionEstimate = trip.isBusinessTrip
    ? calculateSimplifiedDeduction(trip.distance)
    : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.destination, { color: colors.text }]}>{trip.destination}</Text>

        <View
          style={[
            styles.typeBadge,
            { backgroundColor: trip.isBusinessTrip ? colors.successLight : colors.mutedLight },
          ]}
        >
          <Text
            style={[
              styles.typeText,
              { color: trip.isBusinessTrip ? colors.success : colors.muted },
            ]}
          >
            {trip.isBusinessTrip ? t('mileage.business') : t('mileage.personal')}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t('mileage.date')}</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>{trip.date}</Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t('mileage.purpose')}</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>{trip.purpose}</Text>
        </View>

        <View style={styles.odometerRow}>
          <View style={[styles.odometerBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.odometerLabel, { color: colors.muted }]}>{t('mileage.start')}</Text>
            <Text style={[styles.odometerValue, { color: colors.text }]}>{trip.startOdometer} km</Text>
          </View>
          <Text style={[styles.arrow, { color: colors.muted }]}>→</Text>
          <View style={[styles.odometerBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.odometerLabel, { color: colors.muted }]}>{t('mileage.end')}</Text>
            <Text style={[styles.odometerValue, { color: colors.text }]}>{trip.endOdometer} km</Text>
          </View>
        </View>

        <View style={[styles.distanceBox, { backgroundColor: colors.successLight }]}>
          <Text style={[styles.distanceLabel, { color: colors.success }]}>{t('mileage.distance')}</Text>
          <Text style={[styles.distanceValue, { color: colors.success }]}>{trip.distance} km</Text>
        </View>

        {trip.isBusinessTrip && trip.clientName ? (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t('mileage.clientName')}</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{trip.clientName}</Text>
          </View>
        ) : null}

        {trip.notes ? (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t('mileage.notes')}</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{trip.notes}</Text>
          </View>
        ) : null}

        {trip.isBusinessTrip && (
          <View style={[styles.deductionBox, { backgroundColor: colors.warningLight }]}>
            <Text style={[styles.deductionLabel, { color: colors.warning }]}>{t('mileage.estimatedDeduction')}</Text>
            <Text style={[styles.deductionValue, { color: colors.warning }]}>
              ${deductionEstimate.toFixed(2)}
            </Text>
            <Text style={[styles.deductionNote, { color: colors.muted }]}>{t('mileage.craSimplified')}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.primary }]} onPress={handleEdit}>
          <Text style={[styles.editButtonText, { color: colors.white }]}>{t('mileage.editTrip')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.white, borderColor: colors.danger }]} onPress={handleDelete}>
          <Text style={[styles.deleteButtonText, { color: colors.danger }]}>{t('mileage.delete')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, },
  content: { padding: SPACING.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: FONT_SIZES.md,
  },
  card: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    borderWidth: 1,
  },
  destination: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
  },
  typeBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
  },
  typeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  field: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: FONT_SIZES.md,
  },
  odometerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  odometerBox: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  odometerLabel: {
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
  },
  odometerValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  arrow: {
    fontSize: FONT_SIZES.xl,
  },
  distanceBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  distanceLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  distanceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  deductionBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  deductionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  deductionValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.xs,
  },
  deductionNote: {
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  editButton: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  deleteButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  deleteButtonText: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
});
