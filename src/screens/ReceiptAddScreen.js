import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CategoryPicker from '../components/CategoryPicker';
import DatePickerField from '../components/DatePickerField';
import { addReceipt, updateReceipt } from '../services/storageService';
import { validateReceipt } from '../utils/validation';
import { successNotification, errorNotification } from '../utils/haptics';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ReceiptAddScreen({ navigation, route }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const editMode = route.params?.editMode || false;
  const existing = route.params?.receipt || null;
  const capturedPhotoUri = route.params?.capturedPhotoUri || null;
  const ocrData = route.params?.ocrData || null;

  const [amount, setAmount] = useState(
    editMode ? String(existing.expense.amount) : ocrData?.amount || ''
  );
  const [date, setDate] = useState(
    editMode ? existing.expense.date : ocrData?.date || new Date().toISOString().split('T')[0]
  );
  const [vendor, setVendor] = useState(
    editMode ? existing.expense.vendor : ocrData?.vendor || ''
  );
  const [category, setCategory] = useState(
    editMode ? existing.expense.category : ocrData?.category || 'fuel'
  );
  const [description, setDescription] = useState(
    editMode ? existing.expense.description : ocrData?.description || ''
  );
  const [photoUri, setPhotoUri] = useState(
    editMode ? existing.metadata?.photoUri || null : capturedPhotoUri
  );
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const ocrConfidence = ocrData?.confidence || 0;

  const onSave = async () => {
    const receiptData = { amount, date, vendor, category, description };
    const validation = validateReceipt(receiptData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      errorNotification();
      return;
    }

    setErrors([]);
    setSaving(true);

    try {
      const receiptPayload = { amount, date, vendor, category, description, photoUri };
      if (editMode) {
        await updateReceipt(existing.id, {
          amount: Number(amount),
          date,
          vendor,
          category,
          description,
          photoUri,
        });
      } else {
        await addReceipt(receiptPayload);
      }
      successNotification();
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('common.error'), err.message || 'Failed to save receipt.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {ocrConfidence > 0 && (
          <View style={[styles.ocrBanner, { backgroundColor: ocrConfidence >= 60 ? '#ecfdf5' : '#fef3c7', borderColor: ocrConfidence >= 60 ? '#10b981' : '#f59e0b' }]}>
            <Text style={[styles.ocrBannerTitle, { color: ocrConfidence >= 60 ? '#065f46' : '#92400e' }]}>
              🔍 {t('ocr.autoFilled')}
            </Text>
            <Text style={[styles.ocrBannerText, { color: ocrConfidence >= 60 ? '#047857' : '#b45309' }]}>
              {t('ocr.confidence')}: {ocrConfidence}% — {t('ocr.reviewFields')}
            </Text>
          </View>
        )}

        {errors.length > 0 && (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
            {errors.map((e, i) => (
              <Text key={i} style={[styles.errorText, { color: colors.danger }]}>{e}</Text>
            ))}
          </View>
        )}

        {photoUri && (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setPhotoUri(null)}
            >
              <Text style={[styles.removePhotoText, { color: colors.danger }]}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.label, { color: colors.text }]}>{t('receipts.amount')}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
          placeholder="0.00"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          accessibilityLabel={t('receipts.amount')}
        />

        <DatePickerField
          label={t('receipts.date')}
          value={date}
          onChange={setDate}
        />

        <Text style={[styles.label, { color: colors.text }]}>{t('receipts.vendor')}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
          placeholder="e.g., Shell, Costco"
          placeholderTextColor={colors.muted}
          value={vendor}
          onChangeText={setVendor}
          accessibilityLabel={t('receipts.vendor')}
        />

        <CategoryPicker value={category} onChange={setCategory} />

        <Text style={[styles.label, { color: colors.text }]}>{t('receipts.description')}</Text>
        <TextInput
          style={[styles.input, styles.multiline, { borderColor: colors.border, backgroundColor: colors.white, color: colors.text }]}
          placeholder={t('receipts.optionalNotes')}
          placeholderTextColor={colors.muted}
          value={description}
          onChangeText={setDescription}
          multiline
          accessibilityLabel={t('receipts.description')}
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled, { backgroundColor: colors.primary }]}
          onPress={onSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={editMode ? t('receipts.updateReceipt') : t('receipts.saveReceipt')}
        >
          <Text style={[styles.saveButtonText, { color: colors.white }]}>
            {saving ? t('receipts.saving') : editMode ? t('receipts.updateReceipt') : t('receipts.saveReceipt')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, },
  content: { padding: SPACING.lg },
  label: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.lg,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  photoPreview: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.sm,
    resizeMode: 'cover',
    marginBottom: SPACING.sm,
  },
  removePhotoButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  removePhotoText: {
    fontSize: FONT_SIZES.sm,
  },
  ocrBanner: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  ocrBannerTitle: {
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
    marginBottom: 2,
  },
  ocrBannerText: {
    fontSize: FONT_SIZES.xs,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
  },
});
