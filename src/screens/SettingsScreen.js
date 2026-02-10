import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, saveSettings } from '../services/storageService';
import { exportReceiptsCSV, exportMileageCSV, exportBackupJSON } from '../utils/exportService';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

const PROVINCES = [
  { code: 'AB', label: 'Alberta' },
  { code: 'BC', label: 'British Columbia' },
  { code: 'MB', label: 'Manitoba' },
  { code: 'NB', label: 'New Brunswick' },
  { code: 'NL', label: 'Newfoundland & Labrador' },
  { code: 'NS', label: 'Nova Scotia' },
  { code: 'NT', label: 'Northwest Territories' },
  { code: 'NU', label: 'Nunavut' },
  { code: 'ON', label: 'Ontario' },
  { code: 'PE', label: 'Prince Edward Island' },
  { code: 'QC', label: 'Quebec' },
  { code: 'SK', label: 'Saskatchewan' },
  { code: 'YT', label: 'Yukon' },
];

function getProvinceLabel(code) {
  const p = PROVINCES.find((pr) => pr.code === code);
  return p ? p.label : code;
}

export default function SettingsScreen() {
  const { t, setLanguage } = useLanguage();
  const [settings, setSettings] = useState({ province: 'QC', language: 'en' });
  const [showProvinces, setShowProvinces] = useState(false);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const data = await getSettings();
        setSettings(data);
      })();
    }, [])
  );

  const selectProvince = async (code) => {
    setShowProvinces(false);
    const updated = await saveSettings({ province: code });
    setSettings(updated);
  };

  const toggleLanguage = async () => {
    const newLang = settings.language === 'en' ? 'fr' : 'en';
    setLanguage(newLang);
    setSettings({ ...settings, language: newLang });
  };

  const handleExport = async (type) => {
    setExporting(true);
    try {
      if (type === 'receipts') {
        const result = await exportReceiptsCSV();
        Alert.alert(t('common.success'), `Exported ${result.count} receipts.`);
      } else if (type === 'mileage') {
        const result = await exportMileageCSV();
        Alert.alert(t('common.success'), `Exported ${result.count} trips.`);
      } else if (type === 'backup') {
        const result = await exportBackupJSON();
        Alert.alert(t('common.success'), `Backup created: ${result.receipts} receipts, ${result.trips} trips.`);
      }
    } catch (err) {
      Alert.alert(t('common.error'), err.message || 'Failed to export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      {/* Province */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setShowProvinces(!showProvinces)}
        >
          <Text style={styles.label}>{t('settings.province')}</Text>
          <Text style={styles.value}>{getProvinceLabel(settings.province)} ▾</Text>
        </TouchableOpacity>

        {showProvinces && (
          <View style={styles.pickerList}>
            {PROVINCES.map((p) => (
              <TouchableOpacity
                key={p.code}
                style={[
                  styles.pickerItem,
                  settings.province === p.code && styles.pickerItemActive,
                ]}
                onPress={() => selectProvince(p.code)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    settings.province === p.code && styles.pickerTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* Language */}
        <TouchableOpacity style={styles.settingRow} onPress={toggleLanguage}>
          <Text style={styles.label}>{t('settings.language')}</Text>
          <Text style={styles.value}>
            {settings.language === 'en' ? 'English' : 'Français'} ↔
          </Text>
        </TouchableOpacity>
      </View>

      {/* Data export */}
      <Text style={styles.sectionTitle}>{t('settings.dataExport')}</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.exportRow}
          onPress={() => handleExport('receipts')}
          disabled={exporting}
        >
          <Text style={styles.exportLabel}>{t('settings.exportReceiptsCsv')}</Text>
          <Text style={styles.exportIcon}>↗</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.exportRow}
          onPress={() => handleExport('mileage')}
          disabled={exporting}
        >
          <Text style={styles.exportLabel}>{t('settings.exportMileageCsv')}</Text>
          <Text style={styles.exportIcon}>↗</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.exportRow}
          onPress={() => handleExport('backup')}
          disabled={exporting}
        >
          <Text style={styles.exportLabel}>{t('settings.fullBackupJson')}</Text>
          <Text style={styles.exportIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <Text style={styles.label}>{t('settings.version')}</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <Text style={styles.label}>{t('settings.craTaxYear')}</Text>
          <Text style={styles.value}>2026</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        TaxSyncForDrivers Mobile{'\n'}
        Built for Canadian rideshare and delivery drivers.{'\n'}
        Data is stored locally on your device.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  label: { fontSize: FONT_SIZES.md, color: COLORS.text },
  value: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: FONT_WEIGHTS.medium },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs },
  pickerList: { marginTop: SPACING.sm, marginBottom: SPACING.sm, gap: 2 },
  pickerItem: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  pickerItemActive: { backgroundColor: COLORS.primary },
  pickerText: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  pickerTextActive: { color: COLORS.white, fontWeight: FONT_WEIGHTS.semibold },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  exportLabel: { fontSize: FONT_SIZES.md, color: COLORS.text },
  exportIcon: { fontSize: FONT_SIZES.lg, color: COLORS.primary },
  footer: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xxl,
    lineHeight: 20,
    marginBottom: SPACING.xxl,
  },
});
