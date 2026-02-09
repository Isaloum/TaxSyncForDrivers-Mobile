import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';

export default function BusinessPersonalToggle({ isBusinessTrip, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Trip Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, isBusinessTrip && styles.businessActive]}
          onPress={() => onChange(true)}
        >
          <Text style={[styles.text, isBusinessTrip && styles.activeText]}>
            Business
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, !isBusinessTrip && styles.personalActive]}
          onPress={() => onChange(false)}
        >
          <Text style={[styles.text, !isBusinessTrip && styles.activeText]}>
            Personal
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  businessActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  personalActive: {
    backgroundColor: COLORS.muted,
    borderColor: COLORS.muted,
  },
  text: {
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  activeText: {
    color: COLORS.white,
  },
});
