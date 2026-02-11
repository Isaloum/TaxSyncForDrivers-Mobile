import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReceiptById, deleteReceipt } from '../services/storageService';
import { RECEIPT_CATEGORIES } from '../constants/categories';
import LoadingIndicator from '../components/LoadingIndicator';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

function getCategoryLabel(key, language) {
  const cat = RECEIPT_CATEGORIES.find((c) => c.key === key);
  if (!cat) return key || 'Other';
  return language === 'fr' ? cat.labelFr : cat.label;
}

export default function ReceiptDetailScreen({ navigation, route }) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const { receiptId } = route.params;
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const data = await getReceiptById(receiptId);
        if (active) {
          setReceipt(data);
          setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [receiptId])
  );

  const handleDelete = () => {
    Alert.alert(
      t('receipts.deleteReceipt'),
      t('receipts.areYouSure'),
      [
        { text: t('receipts.cancel'), style: 'cancel' },
        {
          text: t('receipts.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteReceipt(receiptId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('ReceiptAdd', { editMode: true, receipt });
  };

  if (loading) return <LoadingIndicator message="Loading receipt..." />;

  if (!receipt) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.muted }]}>{t('receipts.receiptNotFound')}</Text>
      </View>
    );
  }

  const { expense, metadata } = receipt;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.amount, { color: colors.text }]}>${expense.amount?.toFixed(2)}</Text>

        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.white }]}>{getCategoryLabel(expense.category, language)}</Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t('receipts.date')}</Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>{expense.date}</Text>
        </View>

        {expense.vendor ? (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t('receipts.vendor')}</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{expense.vendor}</Text>
          </View>
        ) : null}

        {expense.description ? (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t('receipts.description')}</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{expense.description}</Text>
          </View>
        ) : null}

        {metadata?.retainUntil ? (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t('receipts.retainUntilCRA')}</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>
              {new Date(metadata.retainUntil).toLocaleDateString()}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.primary }]} onPress={handleEdit}>
          <Text style={[styles.editButtonText, { color: colors.white }]}>{t('receipts.editReceipt')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.white, borderColor: colors.danger }]} onPress={handleDelete}>
          <Text style={[styles.deleteButtonText, { color: colors.danger }]}>{t('receipts.delete')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, },
  content: { padding: SPACING.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: FONT_SIZES.md,
  },
  card: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    borderWidth: 1,
  },
  amount: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
  },
  badge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
  },
  badgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  field: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: FONT_SIZES.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  editButton: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  deleteButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  deleteButtonText: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
});
