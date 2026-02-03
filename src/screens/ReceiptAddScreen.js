import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CategoryPicker from '../components/CategoryPicker';
import { addReceipt } from '../services/storageService';

/**
 * Add receipt screen (manual entry for now).
 */
export default function ReceiptAddScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('Other');

  const onSave = async () => {
    if (!amount || !date) {
      Alert.alert('Missing fields', 'Amount and date are required.');
      return;
    }

    await addReceipt({
      amount: Number(amount),
      date,
      notes,
      category,
    });

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Receipt</Text>

      <TextInput
        style={styles.input}
        placeholder="Amount (e.g., 25.50)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />

      <CategoryPicker value={category} onChange={setCategory} />

      <TextInput
        style={[styles.input, styles.notes]}
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>Save Receipt</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  notes: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 8,
  },
  saveButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
