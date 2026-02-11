import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, CHART_COLORS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Pure React Native "pie chart" using horizontal stacked bar + legend.
 * No SVG needed, works everywhere.
 * Props:
 *   data: [{ label, value, color? }]
 */
export default function PieChart({ data = [] }) {
  const { colors } = useTheme();
  if (!data.length) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const sorted = [...data]
    .map((d, i) => ({ ...d, color: d.color || CHART_COLORS[i % CHART_COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
              <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>${item.value.toFixed(0)}</Text>
              <Text style={[styles.legendPct, { color: colors.muted }]}>{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
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
  },
  legendValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    width: 60,
    textAlign: 'right',
  },
  legendPct: {
    fontSize: FONT_SIZES.xs,
    width: 45,
    textAlign: 'right',
  },
});
