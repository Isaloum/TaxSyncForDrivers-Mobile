import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReceiptById, deleteReceipt } from '../services/storageService';
import { RECEIPT_CATEGORIES } from '../constants/categories';
import LoadingIndicator from '../components/LoadingIndicator';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';

function getCategoryLabel(key) {
  const cat = RECEIPT_CATEGORIES.find((c) => c.key === key);
  return cat ? cat.label : key || 'Other';
}

export default function ReceiptDetailScreen({ navigation, route }) {
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
      'Delete Receipt',
      'Are you sure you want to delete this receipt? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
      <View style={styles.center}>
        <Text style={styles.notFound}>Receipt not found</Text>
      </View>
    );
  }

  const { expense, metadata } = receipt;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.amount}>${expense.amount?.toFixed(2)}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getCategoryLabel(expense.category)}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Date</Text>
          <Text style={styles.fieldValue}>{expense.date}</Text>
        </View>

        {expense.vendor ? (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Vendor</Text>
            <Text style={styles.fieldValue}>{expense.vendor}</Text>
          </View>
        ) : null}

        {expense.description ? (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <Text style={styles.fieldValue}>{expense.description}</Text>
          </View>
        ) : null}

        {metadata?.retainUntil ? (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Retain Until (CRA)</Text>
            <Text style={styles.fieldValue}>
              {new Date(metadata.retainUntil).toLocaleDateString()}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>Edit Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  notFound: {
    fontSize: FONT_SIZES.md,
    color: COLORS.muted,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amount: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  field: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.muted,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  deleteButton: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
});
