import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SPACING, FONT_SIZES } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function LoadingIndicator({ message }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={[styles.text, { color: colors.muted }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
  },
});
