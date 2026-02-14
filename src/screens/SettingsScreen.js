import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getSettings, saveSettings, getReceipts, getTrips } from '../services/storageService';
import { exportReceiptsCSV, exportMileageCSV, exportBackupJSON, importBackupJSON } from '../utils/exportService';
import { exportReceiptsPDF, exportMileagePDF } from '../services/pdfExportService';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { lightTap, mediumTap, successNotification, errorNotification } from '../utils/haptics';

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

const THEME_OPTIONS = [
  { value: 'light', labelEn: 'Light', labelFr: 'Clair', icon: '☀️' },
  { value: 'dark', labelEn: 'Dark', labelFr: 'Sombre', icon: '🌙' },
  { value: 'system', labelEn: 'System', labelFr: 'Système', icon: '⚙️' },
];

function getProvinceLabel(code) {
  const p = PROVINCES.find((pr) => pr.code === code);
  return p ? p.label : code;
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme, colors } = useTheme();
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
    lightTap();
    setShowProvinces(false);
    const updated = await saveSettings({ province: code });
    setSettings(updated);
  };

  const toggleLanguage = async () => {
    mediumTap();
    const newLang = settings.language === 'en' ? 'fr' : 'en';
    setLanguage(newLang);
    setSettings({ ...settings, language: newLang });
  };

  const handleImport = async () => {
    try {
      const result = await importBackupJSON();
      if (!result) return; // User cancelled
      successNotification();
      Alert.alert(
        t('common.success'),
        t('settings.restoreSuccess', { receipts: result.receipts, trips: result.trips })
      );
    } catch (err) {
      Alert.alert(t('common.error'), err.message || t('settings.restoreFailed'));
    }
  };

  const confirmRestore = () => {
    lightTap();
    Alert.alert(
      t('settings.restoreBackup'),
      t('settings.restoreWarning'),
      [
        { text: t('receipts.cancel'), style: 'cancel' },
        { text: t('settings.restoreBackup'), style: 'destructive', onPress: handleImport },
      ]
    );
  };

  const handleExport = async (type) => {
    setExporting(true);
    try {
      if (type === 'receipts') {
        const result = await exportReceiptsCSV();
        successNotification();
        Alert.alert(t('common.success'), `Exported ${result.count} receipts.`);
      } else if (type === 'mileage') {
        const result = await exportMileageCSV();
        successNotification();
        Alert.alert(t('common.success'), `Exported ${result.count} trips.`);
      } else if (type === 'backup') {
        const result = await exportBackupJSON();
        successNotification();
        Alert.alert(t('common.success'), `Backup created: ${result.receipts} receipts, ${result.trips} trips.`);
      }
    } catch (err) {
      Alert.alert(t('common.error'), err.message || 'Failed to export.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async (type) => {
    setExporting(true);
    try {
      const currentYear = new Date().getFullYear();
      if (type === 'receipts') {
        const receipts = await getReceipts();
        await exportReceiptsPDF(receipts, language, currentYear);
      } else if (type === 'mileage') {
        const trips = await getTrips();
        await exportMileagePDF(trips, language, currentYear);
      }
      successNotification();
    } catch (err) {
      errorNotification();
      Alert.alert(t('common.error'), err.message || t('pdfExport.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    card: { backgroundColor: colors.card, borderColor: colors.border },
    text: { color: colors.text },
    muted: { color: colors.muted },
    primary: { color: colors.primary },
    divider: { backgroundColor: colors.border },
  };

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, dynamicStyles.text]}>{t('settings.title')}</Text>

      {/* Province */}
      <View style={[styles.card, dynamicStyles.card]}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => setShowProvinces(!showProvinces)}
        >
          <Text style={[styles.label, dynamicStyles.text]}>{t('settings.province')}</Text>
          <Text style={[styles.value, dynamicStyles.primary]}>{getProvinceLabel(settings.province)} ▾</Text>
        </TouchableOpacity>

        {showProvinces && (
          <View style={styles.pickerList}>
            {PROVINCES.map((p) => (
              <TouchableOpacity
                key={p.code}
                style={[
                  styles.pickerItem,
                  settings.province === p.code && { backgroundColor: colors.primary },
                ]}
                onPress={() => selectProvince(p.code)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    dynamicStyles.text,
                    settings.province === p.code && { color: '#ffffff', fontWeight: FONT_WEIGHTS.semibold },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.divider, dynamicStyles.divider]} />

        {/* Language */}
        <TouchableOpacity style={styles.settingRow} onPress={toggleLanguage}>
          <Text style={[styles.label, dynamicStyles.text]}>{t('settings.language')}</Text>
          <Text style={[styles.value, dynamicStyles.primary]}>
            {settings.language === 'en' ? 'English' : 'Français'} ↔
          </Text>
        </TouchableOpacity>

        <View style={[styles.divider, dynamicStyles.divider]} />

        {/* Theme */}
        <View style={styles.settingRow}>
          <Text style={[styles.label, dynamicStyles.text]}>
            {language === 'fr' ? 'Thème' : 'Theme'}
          </Text>
        </View>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.themeOption,
                { borderColor: colors.border },
                theme === opt.value && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
              ]}
              onPress={() => { lightTap(); setTheme(opt.value); }}
              accessibilityRole="button"
              accessibilityLabel={`${language === 'fr' ? opt.labelFr : opt.labelEn} theme`}
              accessibilityState={{ selected: theme === opt.value }}
            >
              <Text style={styles.themeIcon}>{opt.icon}</Text>
              <Text
                style={[
                  styles.themeLabel,
                  dynamicStyles.text,
                  theme === opt.value && { color: colors.primary, fontWeight: FONT_WEIGHTS.semibold },
                ]}
              >
                {language === 'fr' ? opt.labelFr : opt.labelEn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notifications */}
      <Text style={[styles.sectionTitle, dynamicStyles.text]}>{t('settings.notifications')}</Text>
      <View style={[styles.card, dynamicStyles.card]}>
        <TouchableOpacity
          style={styles.exportRow}
          onPress={() => { lightTap(); navigation.navigate('NotificationsSettings'); }}
          accessibilityRole="button"
          accessibilityLabel={t('settings.notifications')}
        >
          <Text style={[styles.exportLabel, dynamicStyles.text]}>{t('notifications.title')}</Text>
          <Text style={[styles.exportIcon, dynamicStyles.primary]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Data export */}
      <Text style={[styles.sectionTitle, dynamicStyles.text]}>{t('settings.dataExport')}</Text>
      <View style={[styles.card, dynamicStyles.card]}>
        <TouchableOpacity
          style={styles.exportRow}
          onPress={() => handleExport('receipts')}
          disabled={exporting}
        >
          <Text style={[styles.exportLabel, dynamicStyles.text]}>{t('settings.exportReceiptsCsv')}</Text>
          <Text style={[styles.exportIcon, dynamicStyles.primary]}>↗</Text>
        </TouchableOpacity>
        <View style={[styles.divider, dynamicStyles.divider]} />
        <TouchableOpacity
          style={styles.exportRow}
          onPress={() => handleExport('mileage')}
          disabled={exporting}
        >
          <Text style={[styles.exportLabel, dynamicStyles.text]}>{t('settings.exportMileageCsv')}</Text>
          <Text style={[styles.exportIcon, dynamicStyles.primary]}>↗</Text>
        </TouchableOpacity>
        <View style={[styles.divider, dynamicStyles.divider]} />
        <TouchableOpacity
          style={styles.exportRow}
          onPress={() => handleExport('backup')}
          disabled={exporting}
        >
          <Text style={[styles.exportLabel, dynamicStyles.text]}>{t('settings.fullBackupJson')}</Text>
          <Text style={[styles.exportIcon, dynamicStyles.primary]}>↗</Text>
        </TouchableOpacity>
        <View style={[styles.divider, dynamicStyles.divider]} />
        <TouchableOpacity
          style={styles.exportRow}
          onPress={() => handleExportPDF('receipts')}
          disabled={exporting}
        >
          <Text style={[styles.exportLabel, dynamicStyles.text]}>{t('pdfExport.exportReceipts')}</Text>
          <Text style={[styles.exportIcon, dynamicStyles.primary]}>↗</Text>
        </TouchableOpacity>
        <View style={[styles.divider, dynamicStyles.divider]} />
        <TouchableOpacity
          style={styles.exportRow}
          onPress={() => handleExportPDF('mileage')}
          disabled={exporting}
        >
          <Text style={[styles.exportLabel, dynamicStyles.text]}>{t('pdfExport.exportMileage')}</Text>
          <Text style={[styles.exportIcon, dynamicStyles.primary]}>↗</Text>
        </TouchableOpacity>
        <View style={[styles.divider, dynamicStyles.divider]} />
        <TouchableOpacity
          style={styles.exportRow}
          onPress={() => { lightTap(); navigation.navigate('CSVImport'); }}
          accessibilityRole="button"
          accessibilityLabel={t('csvImport.title')}
        >
          <Text style={[styles.exportLabel, dynamicStyles.text]}>{t('csvImport.importButton')}</Text>
          <Text style={[styles.exportIcon, dynamicStyles.primary]}>↙</Text>
        </TouchableOpacity>
        <View style={[styles.divider, dynamicStyles.divider]} />
        <TouchableOpacity
          style={styles.exportRow}
          onPress={confirmRestore}
          accessibilityRole="button"
          accessibilityLabel={t('settings.restoreBackup')}
        >
          <Text style={[styles.exportLabel, dynamicStyles.text]}>{t('settings.restoreBackup')}</Text>
          <Text style={[styles.exportIcon, dynamicStyles.primary]}>↙</Text>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <Text style={[styles.sectionTitle, dynamicStyles.text]}>{t('settings.about')}</Text>
      <View style={[styles.card, dynamicStyles.card]}>
        <View style={styles.settingRow}>
          <Text style={[styles.label, dynamicStyles.text]}>{t('settings.version')}</Text>
          <Text style={[styles.value, dynamicStyles.primary]}>1.0.0</Text>
        </View>
        <View style={[styles.divider, dynamicStyles.divider]} />
        <View style={styles.settingRow}>
          <Text style={[styles.label, dynamicStyles.text]}>{t('settings.craTaxYear')}</Text>
          <Text style={[styles.value, dynamicStyles.primary]}>2026</Text>
        </View>
      </View>

      <Text style={[styles.footer, dynamicStyles.muted]}>
        TaxSyncForDrivers Mobile{'\n'}
        Built for Canadian rideshare and delivery drivers.{'\n'}
        Data is stored locally on your device.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  card: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  label: { fontSize: FONT_SIZES.md },
  value: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium },
  divider: { height: 1, marginVertical: SPACING.xs },
  pickerList: { marginTop: SPACING.sm, marginBottom: SPACING.sm, gap: 2 },
  pickerItem: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  pickerText: { fontSize: FONT_SIZES.sm },
  themeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
  },
  themeIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  themeLabel: {
    fontSize: FONT_SIZES.xs,
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  exportLabel: { fontSize: FONT_SIZES.md },
  exportIcon: { fontSize: FONT_SIZES.lg },
  footer: {
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xxl,
    lineHeight: 20,
    marginBottom: SPACING.xxl,
  },
});
