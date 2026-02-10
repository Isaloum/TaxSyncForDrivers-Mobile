import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTrips } from '../services/storageService';
import { getTripSummary } from '../utils/mileageCalculations';
import SummaryCard from '../components/SummaryCard';
import TripCard from '../components/TripCard';
import EmptyState from '../components/EmptyState';
import LoadingIndicator from '../components/LoadingIndicator';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function MileageListScreen({ navigation }) {
  const { t } = useLanguage();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);

  const loadTrips = useCallback(async () => {
    try {
      const data = await getTrips();
      setTrips(data);
      setSummary(getTripSummary(data));
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadTrips();
    }, [loadTrips])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  if (loading && trips.length === 0) {
    return <LoadingIndicator message={t('common.loading')} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          summary && trips.length > 0 ? (
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <SummaryCard
                  label={t('mileage.total')}
                  value={String(summary.totalKm)}
                  unit="km"
                  color={COLORS.primary}
                />
                <SummaryCard
                  label={t('mileage.businessPercent')}
                  value={`${summary.businessPercent}%`}
                  color={COLORS.success}
                />
              </View>
              <View style={styles.summaryRow}>
                <SummaryCard
                  label={t('mileage.deductionEst')}
                  value={`$${summary.estimatedDeduction.toFixed(2)}`}
                  color={COLORS.warning}
                />
                <SummaryCard
                  label={t('mileage.trips')}
                  value={String(summary.totalTrips)}
                  color={COLORS.primaryLight}
                />
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title={t('mileage.noTripsAlt')}
            subtitle={t('mileage.noTripsHintAlt')}
            actionLabel={t('mileage.logFirstTrip')}
            onAction={() => navigation.navigate('MileageAdd')}
          />
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            onPress={() =>
              navigation.navigate('MileageDetail', { tripId: item.id })
            }
          />
        )}
        contentContainerStyle={styles.list}
      />

      {trips.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('MileageAdd')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg },
  summarySection: {
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: -2,
  },
});
