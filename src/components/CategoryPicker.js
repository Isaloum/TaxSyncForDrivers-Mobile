import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RECEIPT_CATEGORIES } from '../constants/categories';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function CategoryPicker({ value, onChange }) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{t('receipts.category')}</Text>
      <View style={styles.row}>
        {RECEIPT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.chip,
              { backgroundColor: colors.border },
              value === cat.key && { backgroundColor: colors.primary },
            ]}
            onPress={() => onChange(cat.key)}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.text },
                value === cat.key && { color: colors.white },
              ]}
            >
              {language === 'fr' ? cat.labelFr : cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
  },
});
