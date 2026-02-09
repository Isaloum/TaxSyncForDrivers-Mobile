import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RECEIPT_CATEGORIES } from '../constants/categories';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';

function getCategoryLabel(key) {
  const cat = RECEIPT_CATEGORIES.find((c) => c.key === key);
  return cat ? cat.label : key || 'Other';
}

export default function ReceiptCard({ receipt, onPress }) {
  const { expense } = receipt;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.amount}>${expense.amount?.toFixed(2)}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getCategoryLabel(expense.category)}</Text>
        </View>
      </View>
      {expense.vendor ? (
        <Text style={styles.vendor}>{expense.vendor}</Text>
      ) : null}
      <Text style={styles.date}>{expense.date}</Text>
      {expense.description ? (
        <Text style={styles.description} numberOfLines={2}>
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
    backgroundColor: COLORS.card,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  vendor: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: SPACING.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    marginTop: SPACING.sm,
  },
});
