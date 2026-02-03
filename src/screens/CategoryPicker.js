import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CATEGORIES = ['Gas', 'Food', 'Parking', 'Maintenance', 'Supplies', 'Other'];

/**
 * Category picker component.
 */
export default function CategoryPicker({ value, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, value === cat && styles.active]}
            onPress={() => onChange(cat)}
          >
            <Text style={[styles.chipText, value === cat && styles.activeText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontWeight: '600', marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  chipText: { color: '#111827' },
  active: { backgroundColor: '#2563eb' },
  activeText: { color: '#fff' },
});
