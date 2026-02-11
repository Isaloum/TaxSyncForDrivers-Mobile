import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function parseDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return { year: y, month: m, day: d };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function formatDate(year, month, day) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function formatDisplayDate(year, month, day, language) {
  const months = language === 'fr' ? MONTHS_FR : MONTHS_EN;
  return `${months[month]} ${day}, ${year}`;
}

export default function DatePickerField({ value, onChange, label }) {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const parsed = parseDate(value);
  const [selectedYear, setSelectedYear] = useState(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState(parsed.month);
  const [selectedDay, setSelectedDay] = useState(parsed.day);

  const openPicker = () => {
    const p = parseDate(value);
    setSelectedYear(p.year);
    setSelectedMonth(p.month);
    setSelectedDay(p.day);
    setVisible(true);
  };

  const confirm = () => {
    const maxDay = daysInMonth(selectedYear, selectedMonth);
    const day = Math.min(selectedDay, maxDay);
    onChange(formatDate(selectedYear, selectedMonth, day));
    setVisible(false);
  };

  const cancel = () => {
    setVisible(false);
  };

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }

  const months = language === 'fr' ? MONTHS_FR : MONTHS_EN;

  const maxDay = daysInMonth(selectedYear, selectedMonth);
  const days = [];
  for (let d = 1; d <= maxDay; d++) {
    days.push(d);
  }

  // Clamp day if month changed
  if (selectedDay > maxDay) {
    setSelectedDay(maxDay);
  }

  const displayValue = value
    ? formatDisplayDate(parsed.year, parsed.month, parsed.day, language)
    : language === 'fr' ? 'Sélectionner une date' : 'Select a date';

  return (
    <>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={label || 'Date picker'}
      >
        <Text style={styles.calendarIcon}>📅</Text>
        <Text style={styles.dateText}>{displayValue}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={cancel}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {language === 'fr' ? 'Choisir une date' : 'Choose a Date'}
            </Text>

            <View style={styles.pickerRow}>
              {/* Month */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerHeader}>
                  {language === 'fr' ? 'Mois' : 'Month'}
                </Text>
                <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
                  {months.map((m, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.pickerItem,
                        selectedMonth === idx && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedMonth(idx)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMonth === idx && styles.pickerItemTextActive,
                        ]}
                      >
                        {m.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Day */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerHeader}>
                  {language === 'fr' ? 'Jour' : 'Day'}
                </Text>
                <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
                  {days.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.pickerItem,
                        selectedDay === d && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedDay(d)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDay === d && styles.pickerItemTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerHeader}>
                  {language === 'fr' ? 'Année' : 'Year'}
                </Text>
                <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
                  {years.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.pickerItem,
                        selectedYear === y && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedYear(y)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedYear === y && styles.pickerItemTextActive,
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewText}>
                {formatDisplayDate(selectedYear, selectedMonth, Math.min(selectedDay, maxDay), language)}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancel}>
                <Text style={styles.cancelButtonText}>
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirm}>
                <Text style={styles.confirmButtonText}>
                  {language === 'fr' ? 'Confirmer' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  calendarIcon: {
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.sm,
  },
  dateText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  chevron: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.muted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerHeader: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  scrollColumn: {
    height: 180,
  },
  pickerItem: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    marginBottom: 2,
  },
  pickerItemActive: {
    backgroundColor: COLORS.primary,
  },
  pickerItemText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  pickerItemTextActive: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  previewRow: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  previewText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
    fontWeight: FONT_WEIGHTS.medium,
  },
  confirmButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});
