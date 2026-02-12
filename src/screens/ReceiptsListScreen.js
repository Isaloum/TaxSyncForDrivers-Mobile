import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReceipts } from '../services/storageService';
import { RECEIPT_CATEGORIES } from '../constants/categories';
import { filterReceipts, sortReceipts } from '../utils/filterSort';
import ReceiptCard from '../components/ReceiptCard';
import SearchBar from '../components/SearchBar';
import FilterSortBar from '../components/FilterSortBar';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ReceiptsListScreen({ navigation }) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('date_desc');

  const loadReceipts = useCallback(async () => {
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch {
      setReceipts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReceipts();
    }, [loadReceipts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReceipts();
  };

  const categoryFilters = useMemo(() => {
    const allLabel = t('filter.all');
    const cats = RECEIPT_CATEGORIES.map((c) => ({
      key: c.key,
      label: language === 'fr' ? c.labelFr : c.label,
    }));
    return [{ key: 'all', label: allLabel }, ...cats];
  }, [t, language]);

  const sortOptions = useMemo(() => [
    { key: 'date_desc', label: t('filter.sortNewest') },
    { key: 'date_asc', label: t('filter.sortOldest') },
    { key: 'amount_desc', label: t('filter.sortHighest') },
    { key: 'amount_asc', label: t('filter.sortLowest') },
  ], [t]);

  const filteredReceipts = useMemo(() => {
    const filtered = filterReceipts(receipts, { search, category: activeCategory });
    return sortReceipts(filtered, activeSort);
  }, [receipts, search, activeCategory, activeSort]);

  const hasData = receipts.length > 0;
  const isFiltered = search.trim() !== '' || activeCategory !== 'all';

  if (loading && receipts.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ReceiptAdd')}
        >
          <Text style={[styles.addButtonText, { color: colors.white }]}>{t('receipts.addReceipt')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => navigation.navigate('CameraCapture')}
        >
          <Text style={styles.scanButtonText}>📷</Text>
        </TouchableOpacity>
      </View>

      {hasData && (
        <>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={t('filter.searchReceipts')}
          />
          <FilterSortBar
            filters={categoryFilters}
            activeFilter={activeCategory}
            onFilterChange={setActiveCategory}
            sortOptions={sortOptions}
            activeSort={activeSort}
            onSortChange={setActiveSort}
            resultCount={filteredReceipts.length}
            resultLabel={t('filter.receipts')}
          />
        </>
      )}

      <FlatList
        data={filteredReceipts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {isFiltered ? t('filter.noResults') : t('receipts.noReceipts')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              {isFiltered ? t('filter.noResultsHint') : t('receipts.noReceiptsHint')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ReceiptCard
            receipt={item}
            onPress={() =>
              navigation.navigate('ReceiptDetail', { receiptId: item.id })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  addButtonText: {
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  scanButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  scanButtonText: {
    fontSize: FONT_SIZES.lg,
  },
  emptyContainer: {
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
});
