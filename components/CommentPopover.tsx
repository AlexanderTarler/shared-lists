import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';

type Props = {
  visible: boolean;
  mode: 'edit' | 'view';
  existingComment?: string | null;
  placeholder?: string;
  onSave: (comment: string) => void;
  onClose: () => void;
};

export default function CommentPopover({
  visible,
  mode,
  existingComment,
  placeholder = 'Add a comment...',
  onSave,
  onClose,
}: Props) {
  const [text, setText] = useState(existingComment || '');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      setText(existingComment || '');
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  function handleSave() {
    if (text.trim()) {
      onSave(text.trim());
    }
    setText('');
  }

  function handleClose() {
    setText('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="none">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.outerContainer}
        >
          <Animated.View
            style={[
              styles.bubble,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {/* Arrow pointer */}
            <View style={styles.arrow} />

            {mode === 'edit' ? (
              <>
                <Text style={styles.title}>Add Comment</Text>
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor="#9CA3AF"
                  value={text}
                  onChangeText={setText}
                  autoFocus
                  multiline
                  maxLength={200}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>Comment</Text>
                <Text style={styles.commentText}>
                  {existingComment || 'No comment.'}
                </Text>
                <TouchableOpacity style={styles.saveBtn} onPress={handleClose}>
                  <Text style={styles.saveBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  outerContainer: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  arrow: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    width: 20,
    height: 10,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  commentText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});