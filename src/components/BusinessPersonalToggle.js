import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { mediumTap } from '../utils/haptics';

export default function BusinessPersonalToggle({ isBusinessTrip, onChange }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Trip Type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.button,
            { borderColor: colors.border, backgroundColor: colors.white },
            isBusinessTrip && { backgroundColor: colors.success, borderColor: colors.success },
          ]}
          onPress={() => { mediumTap(); onChange(true); }}
          accessibilityRole="button"
          accessibilityLabel={t('mileage.business')}
          accessibilityState={{ selected: isBusinessTrip }}
        >
          <Text style={[styles.text, { color: colors.text }, isBusinessTrip && { color: colors.white }]}>
            {t('mileage.business')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            { borderColor: colors.border, backgroundColor: colors.white },
            !isBusinessTrip && { backgroundColor: colors.muted, borderColor: colors.muted },
          ]}
          onPress={() => { mediumTap(); onChange(false); }}
          accessibilityRole="button"
          accessibilityLabel={t('mileage.personal')}
          accessibilityState={{ selected: !isBusinessTrip }}
        >
          <Text style={[styles.text, { color: colors.text }, !isBusinessTrip && { color: colors.white }]}>
            {t('mileage.personal')}
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
    alignItems: 'center',
  },
  text: {
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.md,
  },
});
