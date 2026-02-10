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
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';

export default function DashboardScreen({ navigation }) {
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
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      <Text style={styles.title}>Dashboard</Text>

      {/* Summary cards */}
      <View style={styles.row}>
        <SummaryCard
          label="Total Expenses"
          value={`$${stats.totalExpenses.toFixed(2)}`}
          color={COLORS.primary}
        />
        <SummaryCard
          label="Receipts"
          value={String(stats.receiptCount)}
          color={COLORS.primaryLight}
        />
      </View>
      <View style={styles.row}>
        <SummaryCard
          label="Business Km"
          value={String(stats.totalKm)}
          unit="km"
          color={COLORS.success}
        />
        <SummaryCard
          label="Mileage Deduction"
          value={`$${stats.estimatedDeduction.toFixed(0)}`}
          color={COLORS.warning}
        />
      </View>

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses by Category</Text>
          <PieChart data={categoryData} />
        </View>
      )}

      {/* Monthly expenses trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Expenses</Text>
        <MonthlyTrendChart
          monthlyData={monthlyExpenses}
          year={String(currentYear)}
          color={COLORS.primary}
        />
      </View>

      {/* Monthly mileage trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Mileage (km)</Text>
        <MonthlyTrendChart
          monthlyData={monthlyKm}
          year={String(currentYear)}
          color={COLORS.success}
        />
      </View>

      {/* GST/QST summary */}
      {taxSummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Summary (Estimated)</Text>
          <View style={styles.taxCard}>
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>GST (5%)</Text>
              <Text style={styles.taxValue}>${taxSummary.gstPaid.toFixed(2)}</Text>
            </View>
            {taxSummary.qstPaid > 0 && (
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>QST (9.975%)</Text>
                <Text style={styles.taxValue}>${taxSummary.qstPaid.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.taxRow}>
              <Text style={[styles.taxLabel, styles.taxTotal]}>Total Tax Paid</Text>
              <Text style={[styles.taxValue, styles.taxTotal]}>
                ${taxSummary.totalTaxPaid.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('ReceiptsTab', { screen: 'ReceiptAdd' })
            }
          >
            <Text style={styles.actionIcon}>+</Text>
            <Text style={styles.actionText}>Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('MileageTab', { screen: 'MileageAdd' })
            }
          >
            <Text style={styles.actionIcon}>+</Text>
            <Text style={styles.actionText}>Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('ReceiptsTab', { screen: 'CameraCapture' })
            }
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
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
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  taxCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  taxLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  taxValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  taxTotal: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  actionText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
  },
});
