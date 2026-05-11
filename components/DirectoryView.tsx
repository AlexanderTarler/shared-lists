import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Folder, List } from '../types';
import CommentPopover from './CommentPopover';

type Props = {
  sessionEmail: string;
  currentFolder: Folder | null;
  folders: Folder[];
  lists: List[];
  unreadLists: Set<string>;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  getBackLabel: () => string;
  goUpOneFolder: () => void;
  goIntoFolder: (folder: Folder) => void;
  openList: (list: List) => void;
  onShowFolderModal: () => void;
  onShowListModal: () => void;
  onSetFolderComment: (folderId: string, comment: string) => void;
  onSetListComment: (listId: string, comment: string) => void;
};

export default function DirectoryView({
  sessionEmail,
  currentFolder,
  folders,
  lists,
  unreadLists,
  loading,
  error,
  isOffline,
  getBackLabel,
  goUpOneFolder,
  goIntoFolder,
  openList,
  onShowFolderModal,
  onShowListModal,
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

      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>📡 Offline — showing cached data</Text>
        </View>
      )}

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
        ) : folders.length === 0 && lists.length === 0 ? (
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
                delayLongPress={2000}
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
            {lists.map((list) => (
              <Pressable
                key={`list-${list.id}`}
                style={styles.card}
                onPress={() => openList(list)}
                onLongPress={() => {
                  setCommentMode('edit');
                  setCommentTarget({ type: 'list', item: list });
                }}
                delayLongPress={2000}
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
        <View style={styles.autoShareNotice}>
          <Text style={styles.autoShareNoticeText}>
            Lists and folders are shared automatically with your partner.
          </Text>
        </View>
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
    backgroundColor: '#FEF9F3',
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
    borderBottomWidth: 2,
    borderBottomColor: '#E8DCC8',
  },
  headerArea: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5C4033',
    letterSpacing: -0.5,
    fontFamily: 'Georgia',
  },
  subtitle: {
    fontSize: 13,
    color: '#A39B87',
    marginTop: 2,
    fontWeight: '500',
  },
  backHint: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '600',
    marginTop: 4,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 101,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8DCC8',
  },
  menuIcon: { fontSize: 22, color: '#8B7355' },

  // ── Offline Banner ──
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
  },
  offlineBannerText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Menu ──
  menuOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'rgba(92, 64, 51, 0.15)',
  },
  menuBox: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 52 : 20,
    right: 16,
    backgroundColor: '#FFFBF7',
    padding: 18,
    borderRadius: 16,
    zIndex: 100,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#E8DCC8',
  },
  menuEmail: {
    color: '#8B7355',
    marginBottom: 14,
    fontSize: 13,
    fontWeight: '500',
  },
  signOutBtn: {
    backgroundColor: '#FDDCC4',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBAE86',
  },
  signOutText: { color: '#C45C3C', fontWeight: '700', fontSize: 14 },

  // ── Scroll Area ──
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: { color: '#A39B87', fontSize: 15, marginTop: 12 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorText: { color: '#C45C3C', fontSize: 16, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },
  errorSub: { color: '#A39B87', fontSize: 13, marginTop: 6 },
  emptyEmoji: { fontSize: 56, marginBottom: 14 },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: '#5C4033' },
  emptySub: { fontSize: 14, color: '#A39B87', marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },

  // ── Cards ──
  card: {
    backgroundColor: '#FFFBF7',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#D4A574',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8DCC8',
  },
  cardEmoji: { fontSize: 20 },
  cardContent: { flex: 1, paddingRight: 8 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#5C4033', fontFamily: 'Georgia' },
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
    color: '#C9B39F',
    fontWeight: '300',
    marginLeft: 4,
  },
  badge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4A574',
    borderWidth: 2,
    borderColor: '#FFFBF7',
  },

  // ── Bottom Actions ──
  bottomActions: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 2,
    borderTopColor: '#E8DCC8',
    backgroundColor: '#FEF9F3',
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
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
  },
  folderBtn: { 
    backgroundColor: '#FFF8F0',
    borderColor: '#D4A574',
  },
  listBtn: { 
    backgroundColor: '#D4A574',
    borderColor: '#B8905A',
  },
  actionBtnIcon: { fontSize: 18 },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5C4033',
  },
  autoShareNotice: {
    backgroundColor: '#FFF8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DCC8',
  },
  autoShareNoticeText: {
    color: '#8B7355',
    fontSize: 14,
    textAlign: 'center',
  },
});
