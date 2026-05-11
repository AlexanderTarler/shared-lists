import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

type Props = {
  visible: boolean;
  mode: 'folder' | 'list';
  onCancel: () => void;
  onCreate: (name: string) => void;
};

export default function CreateModal({ visible, mode, onCancel, onCreate }: Props) {
  const [name, setName] = useState('');

  function handleCreate() {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName('');
  }

  function handleCancel() {
    setName('');
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalHeader}>
            {mode === 'folder' ? 'Name your folder' : 'Name your list'}
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder={mode === 'folder' ? 'e.g. Home Stuff' : 'e.g. Groceries'}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <View style={styles.modalButtonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleCreate}>
              <Text style={styles.saveButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(92, 64, 51, 0.2)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFBF7',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#E8DCC8',
  },
  modalHeader: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#5C4033', fontFamily: 'Georgia' },
  modalInput: {
    backgroundColor: '#FFF8F0',
    padding: 16,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 24,
    color: '#5C4033',
    borderWidth: 1,
    borderColor: '#E8DCC8',
  },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelButtonText: { color: '#8B7355', fontSize: 16, fontWeight: '600' },
  saveButton: {
    backgroundColor: '#D4A574',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B8905A',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});