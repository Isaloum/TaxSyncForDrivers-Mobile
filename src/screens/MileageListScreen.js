import React, { useCallback, useMemo, useState } from 'react';
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
import { filterTrips, sortTrips } from '../utils/filterSort';
import SummaryCard from '../components/SummaryCard';
import TripCard from '../components/TripCard';
import EmptyState from '../components/EmptyState';
import LoadingIndicator from '../components/LoadingIndicator';
import FadeInView from '../components/FadeInView';
import SearchBar from '../components/SearchBar';
import FilterSortBar from '../components/FilterSortBar';
import { SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function MileageListScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTripType, setActiveTripType] = useState('all');
  const [activeSort, setActiveSort] = useState('date_desc');

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

  const tripTypeFilters = useMemo(() => [
    { key: 'all', label: t('filter.all') },
    { key: 'business', label: t('mileage.business') },
    { key: 'personal', label: t('mileage.personal') },
  ], [t]);

  const sortOptions = useMemo(() => [
    { key: 'date_desc', label: t('filter.sortNewest') },
    { key: 'date_asc', label: t('filter.sortOldest') },
    { key: 'distance_desc', label: t('filter.sortLongest') },
    { key: 'distance_asc', label: t('filter.sortShortest') },
  ], [t]);

  const filteredTrips = useMemo(() => {
    const filtered = filterTrips(trips, { search, tripType: activeTripType });
    return sortTrips(filtered, activeSort);
  }, [trips, search, activeTripType, activeSort]);

  const hasData = trips.length > 0;
  const isFiltered = search.trim() !== '' || activeTripType !== 'all';

  if (loading && trips.length === 0) {
    return <LoadingIndicator message={t('common.loading')} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredTrips}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {summary && hasData && (
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <SummaryCard
                    label={t('mileage.total')}
                    value={String(summary.totalKm)}
                    unit="km"
                    color={colors.primary}
                  />
                  <SummaryCard
                    label={t('mileage.businessPercent')}
                    value={`${summary.businessPercent}%`}
                    color={colors.success}
                  />
                </View>
                <View style={styles.summaryRow}>
                  <SummaryCard
                    label={t('mileage.deductionEst')}
                    value={`$${summary.estimatedDeduction.toFixed(2)}`}
                    color={colors.warning}
                  />
                  <SummaryCard
                    label={t('mileage.trips')}
                    value={String(summary.totalTrips)}
                    color={colors.primaryLight}
                  />
                </View>
              </View>
            )}
            {hasData && (
              <>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('filter.searchTrips')}
                />
                <FilterSortBar
                  filters={tripTypeFilters}
                  activeFilter={activeTripType}
                  onFilterChange={setActiveTripType}
                  sortOptions={sortOptions}
                  activeSort={activeSort}
                  onSortChange={setActiveSort}
                  resultCount={filteredTrips.length}
                  resultLabel={t('filter.trips')}
                />
              </>
            )}
          </>
        }
        ListEmptyComponent={
          isFiltered ? (
            <View style={styles.emptyFiltered}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('filter.noResults')}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>{t('filter.noResultsHint')}</Text>
            </View>
          ) : (
            <EmptyState
              title={t('mileage.noTripsAlt')}
              subtitle={t('mileage.noTripsHintAlt')}
              actionLabel={t('mileage.logFirstTrip')}
              onAction={() => navigation.navigate('MileageAdd')}
            />
          )
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={index * 50}>
            <TripCard
              trip={item}
              onPress={() =>
                navigation.navigate('MileageDetail', { tripId: item.id })
              }
            />
          </FadeInView>
        )}
        contentContainerStyle={styles.list}
      />

      {hasData && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
          onPress={() => navigation.navigate('MileageAdd')}
        >
          <Text style={[styles.fabText, { color: colors.white }]}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: SPACING.lg },
  summarySection: {
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  emptyFiltered: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: -2,
  },
});
