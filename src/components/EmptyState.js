import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants/theme';

export default function EmptyState({ title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 64,
    paddingHorizontal: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
});
