import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { lightTap } from '../utils/haptics';

/**
 * Horizontal filter chips + sort toggle.
 *
 * Props:
 *   filters: [{ key, label }]
 *   activeFilter: string (key)
 *   onFilterChange: (key) => void
 *   sortOptions: [{ key, label }]
 *   activeSort: string (key)
 *   onSortChange: (key) => void
 *   resultCount: number (optional, shows "X results")
 *   resultLabel: string (optional, e.g. "receipts" / "trips")
 */
export default function FilterSortBar({
  filters = [],
  activeFilter,
  onFilterChange,
  sortOptions = [],
  activeSort,
  onSortChange,
  resultCount,
  resultLabel,
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      {filters.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((f) => {
            const isActive = f.key === activeFilter;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.chip,
                  { backgroundColor: colors.mutedLight, borderColor: colors.border },
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => { lightTap(); onFilterChange(f.key); }}
                accessibilityRole="button"
                accessibilityLabel={f.label}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: colors.text },
                    isActive && { color: colors.white },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Sort + result count row */}
      <View style={styles.sortRow}>
        {resultCount !== undefined && (
          <Text style={[styles.resultCount, { color: colors.muted }]}>
            {resultCount} {resultLabel || ''}
          </Text>
        )}
        <View style={styles.sortButtons}>
          {sortOptions.map((s) => {
            const isActive = s.key === activeSort;
            return (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.sortChip,
                  { borderColor: colors.border },
                  isActive && { borderColor: colors.primary },
                ]}
                onPress={() => { lightTap(); onSortChange(s.key); }}
                accessibilityRole="button"
                accessibilityLabel={s.label}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.sortText,
                    { color: colors.muted },
                    isActive && { color: colors.primary, fontWeight: FONT_WEIGHTS.semibold },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  filterRow: {
    marginBottom: SPACING.sm,
  },
  filterContent: {
    gap: SPACING.xs,
  },
  chip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultCount: {
    fontSize: FONT_SIZES.sm,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  sortChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  sortText: {
    fontSize: FONT_SIZES.xs,
  },
});
