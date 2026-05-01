import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Folder, List } from '../types';
import CommentPopover from './CommentPopover';

type Props = {
  sessionEmail: string;
  currentFolder: Folder | null;
  folders: Folder[];
  myLists: List[];
  unreadLists: Set<string>;
  loading: boolean;
  error: string | null;
  getBackLabel: () => string;
  goUpOneFolder: () => void;
  goIntoFolder: (folder: Folder) => void;
  openList: (list: List) => void;
  onShowFolderModal: () => void;
  onShowListModal: () => void;
  onShowJoinModal: () => void;
  onSetFolderComment: (folderId: string, comment: string) => void;
  onSetListComment: (listId: string, comment: string) => void;
};

export default function DirectoryView({
  sessionEmail,
  currentFolder,
  folders,
  myLists,
  unreadLists,
  loading,
  error,
  getBackLabel,
  goUpOneFolder,
  goIntoFolder,
  openList,
  onShowFolderModal,
  onShowListModal,
  onShowJoinModal,
  onSetFolderComment,
  onSetListComment,
}: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Comment popover state
  type CommentTarget =
    | { type: 'folder'; item: Folder }
    | { type: 'list'; item: List };
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null);
  const [commentMode, setCommentMode] = useState<'edit' | 'view'>('edit');

  // Long-press timer
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startLongPress(type: 'folder' | 'list', item: Folder | List) {
    longPressTimer.current = setTimeout(() => {
      setCommentMode('edit');
      setCommentTarget({ type, item } as CommentTarget);
    }, 1000);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleCommentTap(type: 'folder' | 'list', item: Folder | List) {
    setCommentMode('view');
    setCommentTarget({ type, item } as CommentTarget);
  }

  function getExistingComment(): string | null | undefined {
    if (!commentTarget) return null;
    return commentTarget.item.comment;
  }

  function handleSaveComment(comment: string) {
    if (!commentTarget) return;
    if (commentTarget.type === 'folder') {
      onSetFolderComment(commentTarget.item.id, comment);
    } else {
      onSetListComment(commentTarget.item.id, comment);
    }
    setCommentTarget(null);
  }

  return (
    <View style={styles.container}>
      {/* Top Nav Bar */}
      <View style={styles.topNav}>
        <Pressable style={styles.headerArea} onPress={goUpOneFolder}>
          <Text style={styles.headerTitle}>
            {currentFolder ? currentFolder.name : 'My Hub'}
          </Text>
          {currentFolder ? (
            <Text style={styles.backHint}>← Back to {getBackLabel()}</Text>
          ) : (
            <Text style={styles.subtitle}>Folder View</Text>
          )}
        </Pressable>

        <TouchableOpacity
          onPress={() => setIsMenuOpen(!isMenuOpen)}
          style={styles.menuBtn}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Burger Menu */}
      {isMenuOpen && (
        <>
          <Pressable
            style={styles.menuOverlay}
            onPress={() => setIsMenuOpen(false)}
          />
          <View style={styles.menuBox}>
            <Text style={styles.menuEmail}>{sessionEmail}</Text>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={() => supabase.auth.signOut()}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Main Content ScrollView */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSub}>Navigate back or pull to retry</Text>
          </View>
        ) : folders.length === 0 && myLists.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📂</Text>
            <Text style={styles.emptyTitle}>This folder is empty</Text>
            <Text style={styles.emptySub}>
              Create a folder or list to get started!
            </Text>
          </View>
        ) : (
          <>
            {/* Folders */}
            {folders.map((folder) => (
              <Pressable
                key={`folder-${folder.id}`}
                style={styles.card}
                onPress={() => goIntoFolder(folder)}
                onLongPress={() => {
                  setCommentMode('edit');
                  setCommentTarget({ type: 'folder', item: folder });
                }}
                onPressIn={() => startLongPress('folder', folder)}
                onPressOut={cancelLongPress}
                delayLongPress={800}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>📂</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {folder.name}
                  </Text>
                </View>
                {folder.comment ? (
                  <TouchableOpacity
                    style={styles.commentIndicator}
                    onPress={() => handleCommentTap('folder', folder)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.commentIndicatorText}>💬</Text>
                  </TouchableOpacity>
                ) : null}
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}

            {/* Lists */}
            {myLists.map((list) => (
              <Pressable
                key={`list-${list.id}`}
                style={styles.card}
                onPress={() => openList(list)}
                onLongPress={() => {
                  setCommentMode('edit');
                  setCommentTarget({ type: 'list', item: list });
                }}
                onPressIn={() => startLongPress('list', list)}
                onPressOut={cancelLongPress}
                delayLongPress={800}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>📝</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {list.name}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  {list.comment ? (
                    <TouchableOpacity
                      style={styles.commentIndicator}
                      onPress={() => handleCommentTap('list', list)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.commentIndicatorText}>💬</Text>
                    </TouchableOpacity>
                  ) : null}
                  {unreadLists.has(list.id) && <View style={styles.badge} />}
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.folderBtn]}
            onPress={onShowFolderModal}
          >
            <Text style={styles.actionBtnIcon}>📂</Text>
            <Text style={styles.actionBtnText}>Folder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.listBtn]}
            onPress={onShowListModal}
          >
            <Text style={styles.actionBtnIcon}>📝</Text>
            <Text style={styles.actionBtnText}>List</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.joinBtn} onPress={onShowJoinModal}>
          <Text style={styles.joinBtnText}>Join Existing List</Text>
        </TouchableOpacity>
      </View>

      {/* Comment Popover */}
      <CommentPopover
        visible={commentTarget !== null}
        mode={commentMode}
        existingComment={getExistingComment()}
        placeholder={`Add a note to "${commentTarget?.item?.name || ''}"`}
        onSave={handleSaveComment}
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

  // ── Top Nav ──
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 12,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerArea: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  backHint: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 4,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: { fontSize: 22, color: '#4B5563' },

  // ── Menu ──
  menuOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menuBox: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 52 : 20,
    right: 16,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 200,
  },
  menuEmail: {
    color: '#6B7280',
    marginBottom: 14,
    fontSize: 13,
    fontWeight: '500',
  },
  signOutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },

  // ── Scroll Area ──
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 6 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: { color: '#9CA3AF', fontSize: 15, marginTop: 12 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorText: { color: '#EF4444', fontSize: 16, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },
  errorSub: { color: '#9CA3AF', fontSize: 13, marginTop: 6 },
  emptyEmoji: { fontSize: 56, marginBottom: 14 },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },

  // ── Cards ──
  card: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardEmoji: { fontSize: 20 },
  cardContent: { flex: 1, paddingRight: 8 },
  cardName: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 4,
  },
  commentIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentIndicatorText: { fontSize: 15 },
  chevron: {
    fontSize: 22,
    color: '#D1D5DB',
    fontWeight: '300',
    marginLeft: 4,
  },
  badge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // ── Bottom Actions ──
  bottomActions: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  folderBtn: { backgroundColor: '#EEF2FF' },
  listBtn: { backgroundColor: '#6366F1' },
  actionBtnIcon: { fontSize: 18 },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  joinBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '600',
  },
});