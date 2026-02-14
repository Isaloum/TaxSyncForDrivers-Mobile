import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { addReceipt, addTrip } from '../services/storageService';
import { importCSV } from '../services/csvImportService';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { successNotification, errorNotification, lightTap } from '../utils/haptics';

export default function CSVImportScreen({ navigation }) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const pickAndParseCSV = async () => {
    lightTap();
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (picked.canceled) return;

      const asset = picked.assets?.[0];
      if (!asset?.uri) return;

      setLoading(true);
      const csvText = await FileSystem.readAsStringAsync(asset.uri);
      const parsed = importCSV(csvText);

      if (parsed.trips.length === 0 && parsed.receipts.length === 0) {
        Alert.alert(t('common.error'), t('csvImport.noDataFound'));
        setLoading(false);
        return;
      }

      setResult(parsed);
    } catch (err) {
      errorNotification();
      Alert.alert(t('common.error'), err.message || t('csvImport.parseFailed'));
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!result) return;
    setImporting(true);
    try {
      let tripCount = 0;
      let receiptCount = 0;

      // Import trips
      for (const trip of result.trips) {
        await addTrip({
          date: trip.date,
          destination: trip.destination,
          purpose: trip.purpose,
          startOdometer: trip.startOdometer,
          endOdometer: trip.endOdometer,
          isBusinessTrip: trip.isBusinessTrip,
          clientName: trip.clientName,
          notes: trip.notes,
        });
        tripCount++;
      }

      // Import receipts (earnings records)
      for (const receipt of result.receipts) {
        await addReceipt({
          date: receipt.expense.date,
          amount: receipt.expense.amount,
          vendor: receipt.expense.vendor,
          category: receipt.expense.category,
          description: receipt.expense.description,
        });
        receiptCount++;
      }

      successNotification();
      Alert.alert(
        t('common.success'),
        t('csvImport.importSuccess', { trips: tripCount, receipts: receiptCount }),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      setResult(null);
    } catch (err) {
      errorNotification();
      Alert.alert(t('common.error'), err.message || t('csvImport.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  const isFr = language === 'fr';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('csvImport.title')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
          {t('csvImport.subtitle')}
        </Text>
      </View>

      {/* Supported Platforms */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          {t('csvImport.supportedPlatforms')}
        </Text>
        <View style={styles.platformRow}>
          <View style={[styles.platformBadge, { backgroundColor: '#000' }]}>
            <Text style={styles.platformBadgeText}>Uber</Text>
          </View>
          <Text style={[styles.platformDesc, { color: colors.muted }]}>
            {t('csvImport.uberDesc')}
          </Text>
        </View>
        <View style={styles.platformRow}>
          <View style={[styles.platformBadge, { backgroundColor: '#FF00BF' }]}>
            <Text style={styles.platformBadgeText}>Lyft</Text>
          </View>
          <Text style={[styles.platformDesc, { color: colors.muted }]}>
            {t('csvImport.lyftDesc')}
          </Text>
        </View>
        <View style={styles.platformRow}>
          <View style={[styles.platformBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.platformBadgeText}>CSV</Text>
          </View>
          <Text style={[styles.platformDesc, { color: colors.muted }]}>
            {t('csvImport.genericDesc')}
          </Text>
        </View>
      </View>

      {/* Pick File Button */}
      {!result && (
        <TouchableOpacity
          style={[styles.pickButton, { backgroundColor: colors.primary }]}
          onPress={pickAndParseCSV}
          disabled={loading}
          accessibilityLabel={t('csvImport.selectFile')}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={[styles.pickButtonText, { color: colors.white }]}>
              📁 {t('csvImport.selectFile')}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Preview Results */}
      {result && (
        <>
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {t('csvImport.preview')}
            </Text>

            <View style={[styles.previewBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.previewPlatform, { color: colors.primary }]}>
                {result.summary.platform}
              </Text>
            </View>

            <View style={styles.previewGrid}>
              <View style={styles.previewItem}>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {result.summary.totalTrips}
                </Text>
                <Text style={[styles.previewLabel, { color: colors.muted }]}>
                  {isFr ? 'Trajets' : 'Trips'}
                </Text>
              </View>
              <View style={styles.previewItem}>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {result.summary.totalReceipts}
                </Text>
                <Text style={[styles.previewLabel, { color: colors.muted }]}>
                  {isFr ? 'Reçus' : 'Receipts'}
                </Text>
              </View>
              <View style={styles.previewItem}>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  {result.summary.totalDistanceKm} km
                </Text>
                <Text style={[styles.previewLabel, { color: colors.muted }]}>
                  {isFr ? 'Distance' : 'Distance'}
                </Text>
              </View>
              <View style={styles.previewItem}>
                <Text style={[styles.previewValue, { color: colors.text }]}>
                  ${result.summary.totalEarnings.toFixed(2)}
                </Text>
                <Text style={[styles.previewLabel, { color: colors.muted }]}>
                  {isFr ? 'Revenus' : 'Earnings'}
                </Text>
              </View>
            </View>

            {/* Sample rows */}
            {result.trips.length > 0 && (
              <View style={styles.sampleSection}>
                <Text style={[styles.sampleTitle, { color: colors.text }]}>
                  {isFr ? 'Aperçu des trajets' : 'Sample Trips'}
                </Text>
                {result.trips.slice(0, 3).map((trip, i) => (
                  <View key={i} style={[styles.sampleRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.sampleDate, { color: colors.muted }]}>{trip.date}</Text>
                    <Text style={[styles.sampleDest, { color: colors.text }]} numberOfLines={1}>
                      {trip.destination}
                    </Text>
                    <Text style={[styles.sampleKm, { color: colors.primary }]}>
                      {trip.distance} km
                    </Text>
                  </View>
                ))}
                {result.trips.length > 3 && (
                  <Text style={[styles.moreText, { color: colors.muted }]}>
                    +{result.trips.length - 3} {isFr ? 'de plus' : 'more'}...
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.importButton, { backgroundColor: colors.primary }]}
            onPress={confirmImport}
            disabled={importing}
            accessibilityLabel={t('csvImport.confirmImport')}
          >
            {importing ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={[styles.importButtonText, { color: colors.white }]}>
                ✅ {t('csvImport.confirmImport')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => setResult(null)}
            disabled={importing}
          >
            <Text style={[styles.cancelButtonText, { color: colors.muted }]}>
              {t('csvImport.cancel')}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Instructions */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          {t('csvImport.howToExport')}
        </Text>
        <Text style={[styles.instruction, { color: colors.text }]}>
          {t('csvImport.uberInstructions')}
        </Text>
        <Text style={[styles.instruction, { color: colors.text }]}>
          {t('csvImport.lyftInstructions')}
        </Text>
      </View>

      <Text style={[styles.footer, { color: colors.muted }]}>
        {t('csvImport.footer')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  headerCard: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  section: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  platformBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 56,
    alignItems: 'center',
  },
  platformBadgeText: {
    color: '#fff',
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.xs,
  },
  platformDesc: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  pickButton: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    minHeight: 52,
    justifyContent: 'center',
  },
  pickButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
  },
  previewPlatform: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  previewItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  previewValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  previewLabel: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  sampleSection: {
    marginTop: SPACING.sm,
  },
  sampleTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
  },
  sampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  sampleDate: {
    fontSize: FONT_SIZES.xs,
    width: 80,
  },
  sampleDest: {
    fontSize: FONT_SIZES.sm,
    flex: 1,
  },
  sampleKm: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  moreText: {
    fontSize: FONT_SIZES.xs,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  importButton: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    minHeight: 52,
    justifyContent: 'center',
  },
  importButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  cancelButton: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
  },
  instruction: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  footer: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
});
