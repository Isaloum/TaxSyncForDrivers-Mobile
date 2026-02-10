import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReceipts, getTrips } from '../services/storageService';
import SummaryCard from '../components/SummaryCard';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    receiptCount: 0,
    totalExpenses: 0,
    tripCount: 0,
    totalKm: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [receipts, trips] = await Promise.all([getReceipts(), getTrips()]);
        if (!active) return;
        const totalExpenses = receipts.reduce(
          (sum, r) => sum + (r.expense?.amount || 0),
          0
        );
        const totalKm = trips.reduce((sum, t) => sum + (t.distance || 0), 0);
        setStats({
          receiptCount: receipts.length,
          totalExpenses,
          tripCount: trips.length,
          totalKm,
        });
      })();
      return () => { active = false; };
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Dashboard</Text>

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
          label="Total Distance"
          value={String(stats.totalKm)}
          unit="km"
          color={COLORS.success}
        />
        <SummaryCard
          label="Trips"
          value={String(stats.tripCount)}
          color={COLORS.warning}
        />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('ReceiptsTab', { screen: 'ReceiptAdd' })
          }
        >
          <Text style={styles.actionText}>+ Add Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('MileageTab', { screen: 'MileageAdd' })
          }
        >
          <Text style={styles.actionText}>+ Log Trip</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  quickActions: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actionButton: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  actionText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
});
