import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Monthly trend bar chart with 12 months.
 * Props:
 *   monthlyData: array of 12 numbers (one per month)
 *   year: the year label
 *   color: bar color (default primary)
 *   height: chart height (default 140)
 */
export default function MonthlyTrendChart({ monthlyData = [], year, color, height = 140 }) {
  const data = monthlyData.length === 12 ? monthlyData : new Array(12).fill(0);
  const maxValue = Math.max(...data, 1);
  const barColor = color || COLORS.primary;

  return (
    <View style={styles.container}>
      {year && <Text style={styles.yearLabel}>{year}</Text>}
      <View style={[styles.chartArea, { height }]}>
        {data.map((value, i) => {
          const barHeight = (value / maxValue) * (height - 24);
          return (
            <View key={i} style={styles.barGroup}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(barHeight, 2),
                    backgroundColor: value > 0 ? barColor : COLORS.border,
                  },
                ]}
              />
              <Text style={styles.monthLabel}>{MONTH_LABELS[i]}</Text>
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
  yearLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.muted,
    marginBottom: SPACING.sm,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 2,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minWidth: 8,
  },
  monthLabel: {
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 3,
    textAlign: 'center',
  },
});
