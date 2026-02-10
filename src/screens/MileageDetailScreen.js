import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTripById, deleteTrip } from '../services/storageService';
import { calculateSimplifiedDeduction } from '../utils/mileageCalculations';
import LoadingIndicator from '../components/LoadingIndicator';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function MileageDetailScreen({ navigation, route }) {
  const { t } = useLanguage();
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
      <View style={styles.center}>
        <Text style={styles.notFound}>{t('mileage.tripNotFound')}</Text>
      </View>
    );
  }

  const deductionEstimate = trip.isBusinessTrip
    ? calculateSimplifiedDeduction(trip.distance)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.destination}>{trip.destination}</Text>

        <View
          style={[
            styles.typeBadge,
            trip.isBusinessTrip ? styles.businessBadge : styles.personalBadge,
          ]}
        >
          <Text
            style={[
              styles.typeText,
              trip.isBusinessTrip ? styles.businessText : styles.personalText,
            ]}
          >
            {trip.isBusinessTrip ? t('mileage.business') : t('mileage.personal')}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('mileage.date')}</Text>
          <Text style={styles.fieldValue}>{trip.date}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('mileage.purpose')}</Text>
          <Text style={styles.fieldValue}>{trip.purpose}</Text>
        </View>

        <View style={styles.odometerRow}>
          <View style={styles.odometerBox}>
            <Text style={styles.odometerLabel}>{t('mileage.start')}</Text>
            <Text style={styles.odometerValue}>{trip.startOdometer} km</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
          <View style={styles.odometerBox}>
            <Text style={styles.odometerLabel}>{t('mileage.end')}</Text>
            <Text style={styles.odometerValue}>{trip.endOdometer} km</Text>
          </View>
        </View>

        <View style={styles.distanceBox}>
          <Text style={styles.distanceLabel}>{t('mileage.distance')}</Text>
          <Text style={styles.distanceValue}>{trip.distance} km</Text>
        </View>

        {trip.isBusinessTrip && trip.clientName ? (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('mileage.clientName')}</Text>
            <Text style={styles.fieldValue}>{trip.clientName}</Text>
          </View>
        ) : null}

        {trip.notes ? (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('mileage.notes')}</Text>
            <Text style={styles.fieldValue}>{trip.notes}</Text>
          </View>
        ) : null}

        {trip.isBusinessTrip && (
          <View style={styles.deductionBox}>
            <Text style={styles.deductionLabel}>{t('mileage.estimatedDeduction')}</Text>
            <Text style={styles.deductionValue}>
              ${deductionEstimate.toFixed(2)}
            </Text>
            <Text style={styles.deductionNote}>{t('mileage.craSimplified')}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>{t('mileage.editTrip')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>{t('mileage.delete')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  notFound: {
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  destination: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  typeBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
  },
  businessBadge: { backgroundColor: COLORS.successLight },
  personalBadge: { backgroundColor: COLORS.mutedLight },
  typeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  businessText: { color: COLORS.success },
  personalText: { color: COLORS.muted },
  field: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  odometerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  odometerBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  odometerLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    marginBottom: SPACING.xs,
  },
  odometerValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  arrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.muted,
  },
  distanceBox: {
    backgroundColor: COLORS.successLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
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
  deductionBox: {
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  deductionLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontWeight: FONT_WEIGHTS.medium,
  },
  deductionValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.warning,
    marginTop: SPACING.xs,
  },
  deductionNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  deleteButton: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
});
