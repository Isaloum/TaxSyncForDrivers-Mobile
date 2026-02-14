import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReceipts, getTrips, getSettings } from '../services/storageService';
import { generateTaxSummary, formatTaxReport } from '../utils/taxSummary';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { successNotification } from '../utils/haptics';

export default function TaxSummaryScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const [summary, setSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const [receipts, trips, settings] = await Promise.all([
        getReceipts(),
        getTrips(),
        getSettings(),
      ]);
      const province = settings?.province || 'QC';
      const report = generateTaxSummary(receipts, trips, province, selectedYear);
      setSummary(report);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, t]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  const handleShare = async () => {
    if (!summary) return;
    try {
      const report = formatTaxReport(summary, language);
      await Share.share({
        message: report,
        title: `TaxSync T2125 Report ${selectedYear}`,
      });
      successNotification();
    } catch (err) {
      // User cancelled share
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const curr = (n) => `$${(n || 0).toFixed(2)}`;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.muted }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Year Selector */}
      <View style={styles.yearSelector}>
        {yearOptions.map(year => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              { borderColor: colors.border },
              selectedYear === year && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setSelectedYear(year)}
          >
            <Text style={[
              styles.yearText,
              { color: colors.text },
              selectedYear === year && { color: colors.white },
            ]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          📊 {t('taxSummary.title')} {selectedYear}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
          {t('taxSummary.subtitle')}
        </Text>
      </View>

      {summary && (
        <>
          {/* Expense Section */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {t('taxSummary.expensesByCategory')}
            </Text>

            {Object.keys(summary.expenses.categories).map(key => {
              const cat = summary.expenses.categories[key];
              if (cat.count === 0) return null;
              const label = language === 'fr' ? cat.labelFr : cat.label;
              return (
                <View key={key} style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
                  <View style={styles.rowRight}>
                    <Text style={[styles.rowValue, { color: colors.text }]}>{curr(cat.total)}</Text>
                    <Text style={[styles.rowCount, { color: colors.muted }]}>({cat.count})</Text>
                  </View>
                </View>
              );
            })}

            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>{t('taxSummary.totalExpenses')}</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{curr(summary.expenses.totalExpenses)}</Text>
            </View>
          </View>

          {/* Mileage Section */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {t('taxSummary.mileageSummary')}
            </Text>

            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('taxSummary.businessKm')}</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{summary.mileage.totalBusinessKm} km</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('taxSummary.personalKm')}</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{summary.mileage.totalPersonalKm} km</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('taxSummary.totalKm')}</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{summary.mileage.totalKm} km</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('taxSummary.businessPercent')}</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{summary.mileage.businessPercent}%</Text>
            </View>

            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>{t('taxSummary.mileageDeduction')}</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{curr(summary.mileage.deduction)}</Text>
            </View>
            <Text style={[styles.footnote, { color: colors.muted }]}>{t('taxSummary.craSimplified')}</Text>
          </View>

          {/* Tax Section */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {t('taxSummary.taxesPaid')}
            </Text>

            {summary.tax.hstPaid > 0 ? (
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>HST</Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>{curr(summary.tax.hstPaid)}</Text>
              </View>
            ) : (
              <>
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{language === 'fr' ? 'TPS (5%)' : 'GST (5%)'}</Text>
                  <Text style={[styles.rowValue, { color: colors.text }]}>{curr(summary.tax.gstPaid)}</Text>
                </View>
                {summary.tax.qstPaid > 0 && (
                  <View style={styles.row}>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>{language === 'fr' ? 'TVQ (9,975%)' : 'QST (9.975%)'}</Text>
                    <Text style={[styles.rowValue, { color: colors.text }]}>{curr(summary.tax.qstPaid)}</Text>
                  </View>
                )}
              </>
            )}

            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>{t('taxSummary.totalTaxPaid')}</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{curr(summary.tax.totalTaxPaid)}</Text>
            </View>
          </View>

          {/* Grand Total */}
          <View style={[styles.grandTotal, { backgroundColor: colors.primary }]}>
            <Text style={[styles.grandTotalLabel, { color: colors.white }]}>{t('taxSummary.totalDeductions')}</Text>
            <Text style={[styles.grandTotalValue, { color: colors.white }]}>{curr(summary.totals.totalDeductions)}</Text>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleShare}
            accessibilityLabel={t('taxSummary.shareReport')}
          >
            <Text style={[styles.shareButtonText, { color: colors.primary }]}>📤 {t('taxSummary.shareReport')}</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={[styles.footer, { color: colors.muted }]}>{t('taxSummary.footer')}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: FONT_SIZES.md },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  yearButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  yearText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  section: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  rowLabel: { fontSize: FONT_SIZES.sm, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  rowValue: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semibold },
  rowCount: { fontSize: FONT_SIZES.xs },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  totalLabel: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold },
  totalValue: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold },
  footnote: { fontSize: FONT_SIZES.xs, marginTop: SPACING.xs, fontStyle: 'italic' },
  grandTotal: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold },
  grandTotalValue: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold },
  shareButton: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  shareButtonText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold },
  footer: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
});
