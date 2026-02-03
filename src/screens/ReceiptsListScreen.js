import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getReceipts } from '../services/storageService';

/**
 * Receipts list screen (read-only view for now).
 */
export default function ReceiptsListScreen({ navigation }) {
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await getReceipts();
      setReceipts(data);
    };
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receipts</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('ReceiptAdd')}
      >
        <Text style={styles.addButtonText}>+ Add Receipt</Text>
      </TouchableOpacity>

      <FlatList
        data={receipts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No receipts yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.amount}>${item.amount?.toFixed(2)}</Text>
            <Text style={styles.category}>{item.category || 'Other'}</Text>
            <Text style={styles.date}>{item.date}</Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  addButton: {
    backgroundColor: '#1d4ed8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  empty: { color: '#6b7280', marginTop: 24, textAlign: 'center' },
  card: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  amount: { fontSize: 18, fontWeight: '700' },
  category: { color: '#2563eb', marginTop: 4 },
  date: { color: '#6b7280', marginTop: 2 },
  notes: { color: '#374151', marginTop: 6 },
});
