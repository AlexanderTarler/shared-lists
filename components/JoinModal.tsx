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
  modalContainer: { flex: 1, backgroundColor: '#FEF9F3', padding: 20 },
  header: { fontSize: 24, fontWeight: '700', color: '#5C4033', marginBottom: 20, fontFamily: 'Georgia' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { color: '#A39B87', fontSize: 16, fontStyle: 'italic', textAlign: 'center' },
  joinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBF7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8DCC8',
  },
  listCardText: { fontSize: 18, fontWeight: '600', color: '#5C4033' },
  joinButton: {
    backgroundColor: '#FFF0E6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  joinButtonText: { color: '#8B7355', fontWeight: '600' },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#D4A574',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#B8905A',
  },
  secondaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});