import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RECEIPT_CATEGORIES } from '../constants/categories';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

function getCategoryLabel(key) {
  const cat = RECEIPT_CATEGORIES.find((c) => c.key === key);
  return cat ? cat.label : key || 'Other';
}

export default function ReceiptCard({ receipt, onPress }) {
  const { colors } = useTheme();
  const { expense } = receipt;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${expense.vendor || 'Receipt'}, $${expense.amount?.toFixed(2)}, ${getCategoryLabel(expense.category)}, ${expense.date}`}
    >
      <View style={styles.header}>
        <Text style={[styles.amount, { color: colors.text }]}>${expense.amount?.toFixed(2)}</Text>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.white }]}>{getCategoryLabel(expense.category)}</Text>
        </View>
      </View>
      {expense.vendor ? (
        <Text style={[styles.vendor, { color: colors.text }]}>{expense.vendor}</Text>
      ) : null}
      <Text style={[styles.date, { color: colors.muted }]}>{expense.date}</Text>
      {expense.description ? (
        <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
          {expense.description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  badge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  vendor: {
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.sm,
  },
});
