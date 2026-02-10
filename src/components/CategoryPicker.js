import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RECEIPT_CATEGORIES } from '../constants/categories';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function CategoryPicker({ value, onChange }) {
  const { t, language } = useLanguage();
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('receipts.category')}</Text>
      <View style={styles.row}>
        {RECEIPT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.chip, value === cat.key && styles.active]}
            onPress={() => onChange(cat.key)}
          >
            <Text style={[styles.chipText, value === cat.key && styles.activeText]}>
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
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.border,
  },
  chipText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
  },
  active: { backgroundColor: COLORS.primary },
  activeText: { color: COLORS.white },
});
