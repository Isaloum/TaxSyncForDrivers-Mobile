import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Text, View } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { lightTap } from '../utils/haptics';

export default function SearchBar({ value, onChangeText, placeholder }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.mutedLight, borderColor: colors.border }]}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => { lightTap(); onChangeText(''); }}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={[styles.clearText, { color: colors.muted }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    height: 44,
  },
  icon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    paddingVertical: 0,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
