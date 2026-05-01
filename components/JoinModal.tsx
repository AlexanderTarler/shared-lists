import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { List } from '../types';

type Props = {
  visible: boolean;
  otherLists: List[];
  loading: boolean;
  onJoin: (listId: string) => void;
  onClose: () => void;
};

export default function JoinModal({ visible, otherLists, loading, onJoin, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <Text style={styles.header}>Available Lists</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : otherLists.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyStateText}>
              No other lists available to join here.
            </Text>
          </View>
        ) : (
          otherLists.map((list) => (
            <View key={list.id} style={styles.joinRow}>
              <Text style={styles.listCardText}>📝 {list.name}</Text>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => onJoin(list.id)}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 'auto' }]}
          onPress={onClose}
        >
          <Text style={styles.secondaryButtonText}>Close</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#F4F7F6', padding: 20 },
  header: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { color: '#9CA3AF', fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  joinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  listCardText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  joinButton: {
    backgroundColor: '#E0E7FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  joinButtonText: { color: '#4338CA', fontWeight: '600' },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#E0E7FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  secondaryButtonText: { color: '#4338CA', fontSize: 16, fontWeight: '700' },
});