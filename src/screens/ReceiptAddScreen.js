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
import { addReceipt, updateReceipt } from '../services/storageService';
import { validateReceipt } from '../utils/validation';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function ReceiptAddScreen({ navigation, route }) {
  const { t } = useLanguage();
  const editMode = route.params?.editMode || false;
  const existing = route.params?.receipt || null;
  const capturedPhotoUri = route.params?.capturedPhotoUri || null;

  const [amount, setAmount] = useState(
    editMode ? String(existing.expense.amount) : ''
  );
  const [date, setDate] = useState(
    editMode ? existing.expense.date : new Date().toISOString().split('T')[0]
  );
  const [vendor, setVendor] = useState(
    editMode ? existing.expense.vendor : ''
  );
  const [category, setCategory] = useState(
    editMode ? existing.expense.category : 'fuel'
  );
  const [description, setDescription] = useState(
    editMode ? existing.expense.description : ''
  );
  const [photoUri, setPhotoUri] = useState(
    editMode ? existing.metadata?.photoUri || null : capturedPhotoUri
  );
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const receiptData = { amount, date, vendor, category, description };
    const validation = validateReceipt(receiptData);

    if (!validation.isValid) {
      setErrors(validation.errors);
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {errors.length > 0 && (
          <View style={styles.errorBox}>
            {errors.map((e, i) => (
              <Text key={i} style={styles.errorText}>{e}</Text>
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
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>{t('receipts.amount')}</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>{t('receipts.date')}</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.label}>{t('receipts.vendor')}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Shell, Costco"
          value={vendor}
          onChangeText={setVendor}
        />

        <CategoryPicker value={category} onChange={setCategory} />

        <Text style={styles.label}>{t('receipts.description')}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder={t('receipts.optionalNotes')}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? t('receipts.saving') : editMode ? t('receipts.updateReceipt') : t('receipts.saveReceipt')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  label: {
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.lg,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    color: COLORS.white,
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
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
  },
  errorBox: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
  },
});
