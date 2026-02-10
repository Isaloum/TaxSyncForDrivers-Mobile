import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings } from '../services/storageService';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({ province: 'QC', language: 'en' });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const data = await getSettings();
        setSettings(data);
      })();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Province</Text>
          <Text style={styles.value}>{settings.province}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Language</Text>
          <Text style={styles.value}>
            {settings.language === 'en' ? 'English' : 'Français'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>1.0.0</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        TaxSyncForDrivers Mobile{'\n'}
        Built for Canadian rideshare and delivery drivers.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  value: {
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xxl,
    lineHeight: 20,
  },
});
