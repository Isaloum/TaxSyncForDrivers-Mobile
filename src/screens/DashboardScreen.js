import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReceipts, getTrips, getSettings } from '../services/storageService';
import { getTripSummary } from '../utils/mileageCalculations';
import {
  getExpensesByCategory,
  getMonthlyExpenses,
  getMonthlyMileage,
  getGSTQSTSummary,
} from '../utils/dashboardCalculations';
import SummaryCard from '../components/SummaryCard';
import PieChart from '../components/PieChart';
import MonthlyTrendChart from '../components/MonthlyTrendChart';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function DashboardScreen({ navigation }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const currentYear = new Date().getFullYear();

  const [stats, setStats] = useState({
    receiptCount: 0,
    totalExpenses: 0,
    tripCount: 0,
    totalKm: 0,
    estimatedDeduction: 0,
    businessPercent: 0,
  });
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [monthlyKm, setMonthlyKm] = useState([]);
  const [taxSummary, setTaxSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [receipts, trips, settings] = await Promise.all([
        getReceipts(),
        getTrips(),
        getSettings(),
      ]);

      const totalExpenses = receipts.reduce(
        (sum, r) => sum + (r.expense?.amount || 0),
        0
      );
      const tripSummary = getTripSummary(trips);

      setStats({
        receiptCount: receipts.length,
        totalExpenses,
        tripCount: trips.length,
        totalKm: tripSummary.totalKm,
        estimatedDeduction: tripSummary.estimatedDeduction,
        businessPercent: tripSummary.businessPercent,
      });

      const catData = getExpensesByCategory(receipts);
      setCategoryData(catData.map((c) => ({ label: c.label, value: c.total })));

      setMonthlyExpenses(getMonthlyExpenses(receipts, currentYear));
      setMonthlyKm(getMonthlyMileage(trips, currentYear));
      setTaxSummary(getGSTQSTSummary(receipts, settings.province));
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  }, [currentYear]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={[styles.title, { color: colors.text }]}>{t('dashboard.title')}</Text>

      {/* Summary cards */}
      <View style={styles.row}>
        <SummaryCard
          label={t('dashboard.totalExpenses')}
          value={`$${stats.totalExpenses.toFixed(2)}`}
          color={colors.primary}
        />
        <SummaryCard
          label={t('dashboard.receipts')}
          value={String(stats.receiptCount)}
          color={colors.primaryLight}
        />
      </View>
      <View style={styles.row}>
        <SummaryCard
          label={t('dashboard.businessKm')}
          value={String(stats.totalKm)}
          unit="km"
          color={colors.success}
        />
        <SummaryCard
          label={t('dashboard.mileageDeduction')}
          value={`$${stats.estimatedDeduction.toFixed(0)}`}
          color={colors.warning}
        />
      </View>

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.expensesByCategory')}</Text>
          <PieChart data={categoryData} />
        </View>
      )}

      {/* Monthly expenses trend */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.monthlyExpenses')}</Text>
        <MonthlyTrendChart
          monthlyData={monthlyExpenses}
          year={String(currentYear)}
          color={colors.primary}
        />
      </View>

      {/* Monthly mileage trend */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.monthlyMileage')}</Text>
        <MonthlyTrendChart
          monthlyData={monthlyKm}
          year={String(currentYear)}
          color={colors.success}
        />
      </View>

      {/* GST/QST summary */}
      {taxSummary && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.taxSummary')}</Text>
          <View style={[styles.taxCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.taxRow}>
              <Text style={[styles.taxLabel, { color: colors.text }]}>{t('dashboard.gst')}</Text>
              <Text style={[styles.taxValue, { color: colors.text }]}>${taxSummary.gstPaid.toFixed(2)}</Text>
            </View>
            {taxSummary.qstPaid > 0 && (
              <View style={styles.taxRow}>
                <Text style={[styles.taxLabel, { color: colors.text }]}>{t('dashboard.qst')}</Text>
                <Text style={[styles.taxValue, { color: colors.text }]}>${taxSummary.qstPaid.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.taxRow}>
              <Text style={[styles.taxLabel, styles.taxTotal, { color: colors.text }]}>{t('dashboard.totalTaxPaid')}</Text>
              <Text style={[styles.taxValue, styles.taxTotal, { color: colors.text }]}>
                ${taxSummary.totalTaxPaid.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.quickActions')}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() =>
              navigation.navigate('ReceiptsTab', { screen: 'ReceiptAdd' })
            }
          >
            <Text style={[styles.actionIcon, { color: colors.primary }]}>+</Text>
            <Text style={[styles.actionText, { color: colors.primary }]}>{t('dashboard.receipt')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() =>
              navigation.navigate('MileageTab', { screen: 'MileageAdd' })
            }
          >
            <Text style={[styles.actionIcon, { color: colors.primary }]}>+</Text>
            <Text style={[styles.actionText, { color: colors.primary }]}>{t('dashboard.trip')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() =>
              navigation.navigate('ReceiptsTab', { screen: 'CameraCapture' })
            }
          >
            <Text style={[styles.actionIcon, { color: colors.primary }]}>📷</Text>
            <Text style={[styles.actionText, { color: colors.primary }]}>{t('dashboard.scan')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.taxReportButton, { backgroundColor: colors.card, borderColor: colors.primary }]}
          onPress={() => navigation.navigate('TaxSummary')}
          accessibilityLabel={t('taxSummary.title')}
        >
          <Text style={[styles.taxReportText, { color: colors.primary }]}>📊 {t('taxSummary.viewReport')}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, },
  content: { padding: SPACING.lg },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.md,
  },
  taxCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  taxLabel: {
    fontSize: FONT_SIZES.md,
  },
  taxValue: {
    fontSize: FONT_SIZES.md,
  },
  taxTotal: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.xs,
  },
  actionText: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
  },
  taxReportButton: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  taxReportText: {
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
  },
});
