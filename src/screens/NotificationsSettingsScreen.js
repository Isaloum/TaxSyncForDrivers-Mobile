import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  requestPermissions,
  scheduleAllNotifications,
  cancelAllNotifications,
  getScheduledNotifications,
} from '../services/notificationService';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { lightTap, successNotification } from '../utils/haptics';

export default function NotificationsSettingsScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const [prefs, setPrefs] = useState({
    taxDeadlineReminder: true,
    weeklyReceiptReminder: true,
    mileageReminder: true,
    gstFilingReminder: true,
  });
  const [permissionGranted, setPermissionGranted] = useState(null);
  const [scheduledCount, setScheduledCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await getNotificationPrefs();
        setPrefs(p);
        const perm = await requestPermissions();
        setPermissionGranted(perm.granted);
        const scheduled = await getScheduledNotifications();
        setScheduledCount(scheduled.length);
      })();
    }, [])
  );

  const togglePref = async (key) => {
    lightTap();
    const updated = await saveNotificationPrefs({ [key]: !prefs[key] });
    setPrefs(updated);
    await scheduleAllNotifications(language);
    const scheduled = await getScheduledNotifications();
    setScheduledCount(scheduled.length);
  };

  const handleRefresh = async () => {
    lightTap();
    await scheduleAllNotifications(language);
    successNotification();
    const scheduled = await getScheduledNotifications();
    setScheduledCount(scheduled.length);
    Alert.alert(t('common.success'), t('notifications.refreshed'));
  };

  const handleClearAll = async () => {
    lightTap();
    await cancelAllNotifications();
    setScheduledCount(0);
    Alert.alert(t('common.success'), t('notifications.cleared'));
  };

  const TOGGLES = [
    { key: 'taxDeadlineReminder', label: t('notifications.taxDeadline'), desc: t('notifications.taxDeadlineDesc') },
    { key: 'gstFilingReminder', label: t('notifications.gstFiling'), desc: t('notifications.gstFilingDesc') },
    { key: 'weeklyReceiptReminder', label: t('notifications.weeklyReceipt'), desc: t('notifications.weeklyReceiptDesc') },
    { key: 'mileageReminder', label: t('notifications.mileageReminder'), desc: t('notifications.mileageReminderDesc') },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {permissionGranted === false && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.warning }]}>
          <Text style={[styles.warningText, { color: colors.warning }]}>
            {t('notifications.permissionDenied')}
          </Text>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {TOGGLES.map((item, idx) => (
          <React.Fragment key={item.key}>
            {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            <View style={styles.row}>
              <View style={styles.labelCol}>
                <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.desc, { color: colors.muted }]}>{item.desc}</Text>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={() => togglePref(item.key)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={prefs[item.key] ? colors.primary : colors.muted}
                accessibilityLabel={item.label}
                accessibilityRole="switch"
                accessibilityState={{ checked: prefs[item.key] }}
              />
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.infoText, { color: colors.muted }]}>
          {t('notifications.scheduledCount', { count: scheduledCount })}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.refresh')}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>
              {t('notifications.refresh')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.danger }]}
            onPress={handleClearAll}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.clearAll')}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>
              {t('notifications.clearAll')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.footer, { color: colors.muted }]}>
        {t('notifications.footer')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg },
  card: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  labelCol: { flex: 1, marginRight: SPACING.md },
  label: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold },
  desc: { fontSize: FONT_SIZES.xs, marginTop: 2 },
  divider: { height: 1, marginVertical: SPACING.xs },
  warningText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, textAlign: 'center' },
  infoText: { fontSize: FONT_SIZES.sm, marginBottom: SPACING.md, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: SPACING.sm },
  button: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  buttonText: { fontWeight: FONT_WEIGHTS.semibold, fontSize: FONT_SIZES.sm },
  footer: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
  },
});
