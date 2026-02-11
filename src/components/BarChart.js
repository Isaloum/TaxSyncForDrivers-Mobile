import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Pure React Native bar chart — no external library needed.
 * Props:
 *   data: [{ label, value, color? }]
 *   height: chart height (default 180)
 */
export default function BarChart({ data = [], height = 180 }) {
  const { colors } = useTheme();
  if (!data.length) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.chartArea, { height }]}>
        {data.map((item, i) => {
          const barHeight = (item.value / maxValue) * (height - 30);
          return (
            <View key={i} style={styles.barGroup}>
              <Text style={[styles.barValue, { color: colors.muted }]}>
                ${item.value >= 1000
                  ? `${(item.value / 1000).toFixed(1)}k`
                  : item.value.toFixed(0)}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(barHeight, 4),
                    backgroundColor: item.color || colors.primary,
                  },
                ]}
              />
              <Text style={[styles.barLabel, { color: colors.muted }]} numberOfLines={1}>
                {item.label}
              </Text>
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
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: SPACING.sm,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minWidth: 20,
    maxWidth: 50,
  },
  barValue: {
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  barLabel: {
    fontSize: 10,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
