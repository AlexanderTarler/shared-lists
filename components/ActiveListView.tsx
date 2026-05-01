import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  Platform,
  Pressable,
} from 'react-native';
import { List, Item } from '../types';
import CommentPopover from './CommentPopover';

type Props = {
  activeList: List;
  items: Item[];
  loading: boolean;
  error: string | null;
  currentFolderName: string;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onBack: () => void;
  onAddItem: (title: string) => void;
  onToggleComplete: (item: Item) => void;
  onClearAll: () => void;
  onDeleteList: () => void;
  onUpdateListName: (newName: string) => void;
  onToggleSelectionMode: () => void;
  onToggleItemSelected: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onDeleteItem: (itemId: string) => void;
  onSetItemComment: (itemId: string, comment: string) => void;
};

export default function ActiveListView({
  activeList,
  items,
  loading,
  error,
  currentFolderName,
  selectionMode,
  selectedIds,
  onBack,
  onAddItem,
  onToggleComplete,
  onClearAll,
  onDeleteList,
  onUpdateListName,
  onToggleSelectionMode,
  onToggleItemSelected,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onDeleteItem,
  onSetItemComment,
}: Props) {
  const [newGroceryText, setNewGroceryText] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameText, setEditNameText] = useState('');

  // Comment popover state
  const [commentTarget, setCommentTarget] = useState<Item | null>(null);
  const [commentMode, setCommentMode] = useState<'edit' | 'view'>('edit');

  // Long-press timer
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [longPressActive, setLongPressActive] = useState<string | null>(null);

  function handleAddItem() {
    if (!newGroceryText.trim()) return;
    onAddItem(newGroceryText.trim());
    setNewGroceryText('');
  }

  function confirmClearItems() {
    Alert.alert('Clear All', 'Delete every item in this list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: onClearAll },
    ]);
  }

  function confirmDeleteList() {
    Alert.alert(
      'Delete List',
      'This permanently deletes the list and all its items for everyone. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDeleteList },
      ],
    );
  }

  function handleSaveName() {
    if (!editNameText.trim()) return;
    onUpdateListName(editNameText.trim());
    setIsEditingName(false);
  }

  // Long-press handlers for items
  function handleLongPressIn(item: Item) {
    setLongPressActive(item.id);
    longPressTimer.current = setTimeout(() => {
      setLongPressActive(null);
      setCommentMode('edit');
      setCommentTarget(item);
    }, 1000);
  }

  function handleLongPressOut() {
    setLongPressActive(null);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleCommentTap(item: Item) {
    setCommentMode('view');
    setCommentTarget(item);
  }

  function confirmDeleteSelected() {
    const count = selectedIds.size;
    Alert.alert(
      'Delete Items',
      `Delete ${count} selected item${count > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDeleteSelected },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>{currentFolderName || 'Hub'}</Text>
        </TouchableOpacity>

        <View style={styles.topActions}>
          {!selectionMode ? (
            <>
              <TouchableOpacity onPress={confirmClearItems} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onToggleSelectionMode} style={styles.trashBtn}>
                <Text style={styles.trashIcon}>🗑️</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={onToggleSelectionMode} style={styles.cancelSelBtn}>
              <Text style={styles.cancelSelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Header */}
      {isEditingName ? (
        <View style={styles.editHeaderRow}>
          <TextInput
            style={styles.editInput}
            value={editNameText}
            onChangeText={setEditNameText}
            autoFocus
            onSubmitEditing={handleSaveName}
            placeholder="List name"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelEditBtn}
            onPress={() => setIsEditingName(false)}
          >
            <Text style={styles.cancelEditText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listHeaderRow}>
          <TouchableOpacity
            style={styles.listTitleArea}
            onPress={() => {
              setEditNameText(activeList.name);
              setIsEditingName(true);
            }}
          >
            <Text style={styles.listTitle}>{activeList.name}</Text>
            <Text style={styles.editHint}> ✎</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Item Row */}
      {!selectionMode && (
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Add an item..."
            placeholderTextColor="#A5B4C2"
            value={newGroceryText}
            onChangeText={setNewGroceryText}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selection Bar */}
      {selectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={selectedIds.size === items.length ? onDeselectAll : onSelectAll}>
            <Text style={styles.selectAllText}>
              {selectedIds.size === items.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectedCount}>{selectedIds.size} selected</Text>
        </View>
      )}

      {/* Items ScrollView */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emojiEmpty}>📭</Text>
            <Text style={styles.emptyText}>No items yet</Text>
            <Text style={styles.emptySub}>Tap "+ Add an item" to start!</Text>
          </View>
        ) : (
          items.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isLongPressing = longPressActive === item.id;

            return (
              <Pressable
                key={item.id}
                style={[
                  styles.itemCard,
                  item.is_completed && styles.itemCardDone,
                  isSelected && styles.itemCardSelected,
                  isLongPressing && styles.itemCardLongPress,
                ]}
                onPress={() => {
                  if (selectionMode) {
                    onToggleItemSelected(item.id);
                  } else {
                    onToggleComplete(item);
                  }
                }}
                onLongPress={() => {
                  if (!selectionMode) {
                    setCommentMode('edit');
                    setCommentTarget(item);
                  }
                }}
                onPressIn={() => handleLongPressIn(item)}
                onPressOut={handleLongPressOut}
                delayLongPress={800}
              >
                {/* Selection checkbox (selection mode) or completion checkbox */}
                {selectionMode ? (
                  <View
                    style={[
                      styles.selectBox,
                      isSelected && styles.selectBoxActive,
                    ]}
                  >
                    {isSelected && <Text style={styles.selectCheck}>✓</Text>}
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => onToggleComplete(item)}
                    style={[
                      styles.checkbox,
                      item.is_completed && styles.checkboxDone,
                    ]}
                  >
                    {item.is_completed && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Item content */}
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemTitle,
                      item.is_completed && styles.itemTitleDone,
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </View>

                {/* Comment indicator */}
                {item.comment ? (
                  <TouchableOpacity
                    style={styles.commentDot}
                    onPress={() => handleCommentTap(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.commentDotText}>💬</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Delete single item (non-selection mode) */}
                {!selectionMode && (
                  <TouchableOpacity
                    style={styles.itemDeleteBtn}
                    onPress={() => {
                      Alert.alert('Delete Item', 'Remove this item?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => onDeleteItem(item.id),
                        },
                      ]);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.itemDeleteIcon}>×</Text>
                  </TouchableOpacity>
                )}
              </Pressable>
            );
          })
        )}

        {/* Delete List at bottom */}
        <TouchableOpacity
          style={styles.deleteListBtn}
          onPress={confirmDeleteList}
        >
          <Text style={styles.deleteListText}>Delete Entire List</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Selection Action Bar */}
      {selectionMode && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.deleteSelectedBtn,
              selectedIds.size === 0 && styles.deleteSelectedBtnDisabled,
            ]}
            onPress={confirmDeleteSelected}
            disabled={selectedIds.size === 0}
          >
            <Text style={styles.deleteSelectedText}>
              🗑️ Delete {selectedIds.size > 0 ? selectedIds.size : ''} Items
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Comment Popover */}
      <CommentPopover
        visible={commentTarget !== null}
        mode={commentMode}
        existingComment={commentTarget?.comment}
        placeholder={`Comment on "${commentTarget?.title || ''}"`}
        onSave={(comment) => {
          if (commentTarget) {
            onSetItemComment(commentTarget.id, comment);
          }
          setCommentTarget(null);
        }}
        onClose={() => setCommentTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 12,
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingRight: 12,
  },
  backIcon: { fontSize: 22, color: '#6366F1', fontWeight: '700' },
  backLabel: { fontSize: 16, color: '#6366F1', fontWeight: '600' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
  },
  clearBtnText: { fontSize: 14, fontWeight: '600', color: '#F59E0B' },
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashIcon: { fontSize: 18 },
  cancelSelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  cancelSelText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },

  // ── List Header ──
  listHeaderRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  editHint: { fontSize: 20, color: '#CBD5E1' },

  editHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    fontSize: 18,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    color: '#1F2937',
  },
  saveBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cancelEditBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },

  // ── Add Row ──
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 16,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 28, fontWeight: '400', marginTop: -1 },

  // ── Selection Bar ──
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectAllText: { fontSize: 14, fontWeight: '600', color: '#6366F1' },
  selectedCount: { fontSize: 14, fontWeight: '600', color: '#4B5563' },

  // ── Scroll Area ──
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },

  // ── Items ──
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemCardDone: { backgroundColor: '#F9FAFB', opacity: 0.85 },
  itemCardSelected: {
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  itemCardLongPress: {
    backgroundColor: '#F3F4F6',
    transform: [{ scale: 0.98 }],
  },

  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  selectBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectBoxActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  selectCheck: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  itemContent: { flex: 1, paddingRight: 8 },
  itemTitle: { fontSize: 16, color: '#1F2937', fontWeight: '500', lineHeight: 22 },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
    fontWeight: '400',
  },

  commentDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  commentDotText: { fontSize: 16 },

  itemDeleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  itemDeleteIcon: { fontSize: 18, color: '#EF4444', fontWeight: '700', marginTop: -1 },

  // ── Empty State ──
  emojiEmpty: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#6B7280' },
  emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  errorText: { color: '#EF4444', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 },

  // ── Delete List ──
  deleteListBtn: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteListText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },

  // ── Bottom Selection Bar ──
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  deleteSelectedBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  deleteSelectedBtnDisabled: {
    backgroundColor: '#FECACA',
  },
  deleteSelectedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});