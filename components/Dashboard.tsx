import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { useDirectory } from '../hooks/useDirectory';
import { useRealtimeItems } from '../hooks/useRealtimeItems';
import { List } from '../types';
import DirectoryView from './DirectoryView';
import ActiveListView from './ActiveListView';
import CreateModal from './CreateModal';
import JoinModal from './JoinModal';

export default function Dashboard({ session }: { session: Session }) {
  const [activeList, setActiveList] = useState<List | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  const directory = useDirectory(session.user.id);
  const items = useRealtimeItems(activeList ? activeList.id : null);

  function openList(list: List) {
    setActiveList(list);
    items.markAsRead(list.id);
  }

  async function handleCreateList(name: string) {
    const newList = await directory.createList(name);
    if (newList) {
      setShowListModal(false);
      setActiveList(newList);
      items.markAsRead(newList.id);
    }
  }

  async function handleDeleteList() {
    if (!activeList) return;
    const ok = await directory.deleteList(activeList.id);
    if (ok) setActiveList(null);
  }

  async function handleUpdateListName(newName: string) {
    if (!activeList) return;
    const ok = await directory.updateListName(activeList.id, newName);
    if (ok) setActiveList({ ...activeList, name: newName.trim() });
  }

  function handleClearAll() {
    items.clearAllItems();
  }

  if (activeList) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActiveListView
          activeList={activeList}
          items={items.items}
          loading={items.loading}
          error={items.error}
          currentFolderName={directory.currentFolder?.name ?? ''}
          selectionMode={items.selectionMode}
          selectedIds={items.selectedIds}
          onBack={() => setActiveList(null)}
          onAddItem={(title) => items.addItem(title, session.user.id)}
          onToggleComplete={items.toggleComplete}
          onClearAll={handleClearAll}
          onDeleteList={handleDeleteList}
          onUpdateListName={handleUpdateListName}
          onToggleSelectionMode={items.toggleSelectionMode}
          onToggleItemSelected={items.toggleItemSelected}
          onSelectAll={items.selectAll}
          onDeselectAll={items.deselectAll}
          onDeleteSelected={items.deleteSelected}
          onDeleteItem={items.deleteItem}
          onSetItemComment={items.setItemComment}
        />
            </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <DirectoryView
        sessionEmail={session.user.email ?? ''}
        currentFolder={directory.currentFolder}
        folders={directory.folders}
        myLists={directory.myLists}
        unreadLists={items.unreadLists}
        loading={directory.loading}
        error={directory.error}
        getBackLabel={directory.getBackLabel}
        goUpOneFolder={directory.goUpOneFolder}
        goIntoFolder={directory.goIntoFolder}
        openList={openList}
        onShowFolderModal={() => setShowFolderModal(true)}
        onShowListModal={() => setShowListModal(true)}
        onShowJoinModal={() => setShowJoinModal(true)}
        onSetFolderComment={directory.setFolderComment}
        onSetListComment={directory.setListComment}
      />

      <CreateModal
        visible={showFolderModal}
        mode="folder"
        onCancel={() => setShowFolderModal(false)}
        onCreate={async (name) => {
          const ok = await directory.createFolder(name);
          if (ok) setShowFolderModal(false);
        }}
      />

      <CreateModal
        visible={showListModal}
        mode="list"
        onCancel={() => setShowListModal(false)}
        onCreate={handleCreateList}
      />

      <JoinModal
        visible={showJoinModal}
        otherLists={directory.otherLists}
        loading={directory.loading}
        onJoin={async (listId) => {
          const ok = await directory.joinList(listId);
          if (ok) setShowJoinModal(false);
        }}
        onClose={() => setShowJoinModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F4F8' },
});
