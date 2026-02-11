import React, { useCallback, useState } from 'react';
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
import ReceiptCard from '../components/ReceiptCard';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ReceiptsListScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
          style={[styles.addButton, { flex: 1 }, { backgroundColor: colors.primary }]}
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

      <FlatList
        data={receipts}
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('receipts.noReceipts')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              {t('receipts.noReceiptsHint')}
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
  container: { flex: 1, padding: SPACING.lg, },
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
