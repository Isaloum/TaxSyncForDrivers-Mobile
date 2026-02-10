import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';

const CHART_COLORS = [
  COLORS.primary,
  COLORS.primaryLight,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  '#8b5cf6',
  '#ec4899',
  '#6366f1',
];

/**
 * Pure React Native "pie chart" using horizontal stacked bar + legend.
 * No SVG needed, works everywhere.
 * Props:
 *   data: [{ label, value, color? }]
 */
export default function PieChart({ data = [] }) {
  if (!data.length) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const sorted = [...data]
    .map((d, i) => ({ ...d, color: d.color || CHART_COLORS[i % CHART_COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  return (
    <View style={styles.container}>
      {/* Stacked bar */}
      <View style={styles.barRow}>
        {sorted.map((item, i) => {
          const pct = (item.value / total) * 100;
          if (pct < 1) return null;
          return (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  flex: item.value,
                  backgroundColor: item.color,
                },
                i === 0 && styles.segmentFirst,
                i === sorted.length - 1 && styles.segmentLast,
              ]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {sorted.map((item, i) => {
          const pct = ((item.value / total) * 100).toFixed(1);
          return (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.legendValue}>${item.value.toFixed(0)}</Text>
              <Text style={styles.legendPct}>{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barRow: {
    flexDirection: 'row',
    height: 24,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  segment: { minWidth: 4 },
  segmentFirst: { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  segmentLast: { borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  legend: { gap: SPACING.sm },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  legendValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    width: 60,
    textAlign: 'right',
  },
  legendPct: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    width: 45,
    textAlign: 'right',
  },
});
