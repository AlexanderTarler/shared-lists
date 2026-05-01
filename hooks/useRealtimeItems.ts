import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Item } from '../types';

export function useRealtimeItems(activeListId: string | null) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection mode for batch delete
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Track which list IDs have unread changes (for the red badge)
  const [unreadLists, setUnreadLists] = useState<Set<string>>(new Set());
  const activeListIdRef = useRef(activeListId);

  // Keep ref in sync
  useEffect(() => {
    activeListIdRef.current = activeListId;
  }, [activeListId]);

  // ── Fetch items (defined before effects that use it) ──
  const fetchItems = useCallback(async (listId: string) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });

    if (err) {
      setError(`Failed to load items: ${err.message}`);
    } else if (data) {
      setItems(data);
    }
    setLoading(false);
  }, []);

  // Fetch items when active list changes (and reset selection on list change)
  useEffect(() => {
    if (activeListId) {
      fetchItems(activeListId);
      setSelectionMode(false);
      setSelectedIds(new Set());
    } else {
      setItems([]);
    }
  }, [activeListId, fetchItems]);

  // Global real-time listener for item changes (badge + auto-refresh)
  useEffect(() => {
    const channel = supabase
      .channel('global-item-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items' },
        (payload) => {
          const changedListId = (payload.new as any)?.list_id || (payload.old as any)?.list_id;
          if (!changedListId) return;

          if (activeListIdRef.current && activeListIdRef.current === changedListId) {
            fetchItems(changedListId);
          } else {
            setUnreadLists((prev) => new Set(prev).add(changedListId));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  async function addItem(title: string, userId: string) {
    if (!activeListId || !title.trim()) return null;
    setError(null);
    const { data, error: err } = await supabase
      .from('items')
      .insert([{ list_id: activeListId, title: title.trim(), added_by: userId }])
      .select()
      .single();

    if (err) {
      setError(`Failed to add item: ${err.message}`);
      return null;
    }
    setItems((prev) => [data, ...prev]);
    return data;
  }

  async function toggleComplete(item: Item) {
    const wasCompleted = item.is_completed;
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_completed: !i.is_completed } : i)),
    );

    const { error: err } = await supabase
      .from('items')
      .update({ is_completed: !wasCompleted })
      .eq('id', item.id);

    if (err) {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_completed: wasCompleted } : i)),
      );
      setError(`Failed to update item: ${err.message}`);
    }
  }

  // ── Comment on an item ──
  async function setItemComment(itemId: string, comment: string) {
    setError(null);
    const { error: err } = await supabase
      .from('items')
      .update({ comment })
      .eq('id', itemId);

    if (err) {
      setError(`Failed to save comment: ${err.message}`);
      return;
    }
    // Optimistic local update
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, comment } : i)));
  }

  // ── Selection mode for batch delete ──
  function toggleSelectionMode() {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedIds(new Set());
    } else {
      setSelectionMode(true);
    }
  }

  function toggleItemSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(items.map((i) => i.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  // ── Delete single item ──
  async function deleteItem(itemId: string) {
    setError(null);
    const { error: err } = await supabase.from('items').delete().eq('id', itemId);
    if (err) {
      setError(`Failed to delete item: ${err.message}`);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  // ── Batch delete selected items ──
  async function deleteSelected() {
    if (selectedIds.size === 0) return;
    setError(null);
    const ids = Array.from(selectedIds);
    const { error: err } = await supabase.from('items').delete().in('id', ids);
    if (err) {
      setError(`Failed to delete items: ${err.message}`);
      return;
    }
    setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setSelectionMode(false);
  }

  async function clearAllItems() {
    if (!activeListId) return;
    setError(null);
    const { error: err } = await supabase.from('items').delete().eq('list_id', activeListId);
    if (err) {
      setError(`Failed to clear items: ${err.message}`);
      return;
    }
    setItems([]);
  }

  function markAsRead(listId: string) {
    setUnreadLists((prev) => {
      const next = new Set(prev);
      next.delete(listId);
      return next;
    });
  }

  return {
    items,
    loading,
    error,
    unreadLists,
    selectionMode,
    selectedIds,
    selectAll,
    deselectAll,
    toggleSelectionMode,
    toggleItemSelected,
    addItem,
    toggleComplete,
    deleteItem,
    deleteSelected,
    setItemComment,
    clearAllItems,
    markAsRead,
    refetch: activeListId ? () => fetchItems(activeListId) : undefined,
  };
}
