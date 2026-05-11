import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Folder, List } from '../types';
import { PARTNER_EMAIL } from '../config';
import { loadCachedDirectory, saveCachedDirectory } from '../lib/cache';

export function useDirectory(userId: string) {
  // Navigation & Hierarchy State
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const currentFolder = folderPath.length > 0 ? folderPath[folderPath.length - 1] : null;

  // Data States
  const [folders, setFolders] = useState<Folder[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // ── Fetch directory contents ──
  const fetchDirectoryContents = useCallback(async () => {
    const folderId = currentFolder ? currentFolder.id : null;
    setLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      // Fetch Folders
      let folderQuery = supabase.from('folders').select('*').order('name');
      if (folderId) folderQuery = folderQuery.eq('parent_id', folderId);
      else folderQuery = folderQuery.is('parent_id', null);

      const { data: fData, error: fErr } = await folderQuery;
      if (fErr) {
        setError(`Failed to load folders: ${fErr.message}`);
        setLoading(false);
        return;
      }
      if (fData) setFolders(fData);

      // Fetch Lists
      let listQuery = supabase.from('lists').select('*').order('created_at', { ascending: false });
      if (folderId) listQuery = listQuery.eq('folder_id', folderId);
      else listQuery = listQuery.is('folder_id', null);

      const { data: allLists, error: lErr } = await listQuery;
      if (lErr) {
        setError(`Failed to load lists: ${lErr.message}`);
        setLoading(false);
        return;
      }

      const { data: myMemberships, error: mErr } = await supabase
        .from('list_members')
        .select('list_id')
        .eq('user_id', userId);

      if (mErr) {
        setError(`Failed to load memberships: ${mErr.message}`);
        setLoading(false);
        return;
      }

      if (allLists && myMemberships) {
        const myIds = myMemberships.map((m) => m.list_id);
        const myLists = allLists.filter((l) => myIds.includes(l.id));
        setLists(myLists);
      }

      // Cache the data for offline use
      if (fData && allLists && myMemberships) {
        const myIds = myMemberships.map((m) => m.list_id);
        const myLists = allLists.filter((l) => myIds.includes(l.id));
        await saveCachedDirectory(folderId, fData, myLists);
      }
    } catch (e: any) {
      // Network error — try loading from cache
      if (e?.message?.includes('Network') || e?.message?.includes('Failed to fetch')) {
        setIsOffline(true);
        const cached = await loadCachedDirectory(folderId);
        if (cached) {
          setFolders(cached.folders);
          setLists(cached.lists);
          setError(null);
        } else {
          setError('No internet connection and no cached data available.');
        }
      } else {
        setError(`Unexpected error: ${e?.message || 'Unknown'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [currentFolder, userId]);

  useEffect(() => {
    fetchDirectoryContents();
  }, [fetchDirectoryContents]);

  // ── Create a folder ──
  async function createFolder(name: string): Promise<boolean> {
    if (!name.trim()) {
      Alert.alert('Oops', 'Please enter a name for the folder.');
      return false;
    }
    setError(null);
    const { error: err } = await supabase.from('folders').insert([
      {
        name: name.trim(),
        parent_id: currentFolder ? currentFolder.id : null,
        created_by: userId,
      },
    ]);
    if (err) {
      setError(`Failed to create folder: ${err.message}`);
      Alert.alert('Error', err.message);
      return false;
    }
    await fetchDirectoryContents();
    return true;
  }

  // ── Create a list ──
  async function createList(name: string): Promise<List | null> {
    if (!name.trim()) {
      Alert.alert('Oops', 'Please enter a name for the list.');
      return null;
    }
    setError(null);
    const { data: listData, error: err } = await supabase
      .from('lists')
      .insert([
        {
          name: name.trim(),
          folder_id: currentFolder ? currentFolder.id : null,
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (err) {
      setError(`Failed to create list: ${err.message}`);
      Alert.alert('Error', err.message);
      return null;
    }

    // Creator auto-joins
    const { error: joinErr } = await supabase
      .from('list_members')
      .insert([{ list_id: listData.id, user_id: userId }]);

    if (joinErr) {
      setError(`Failed to join list: ${joinErr.message}`);
      Alert.alert('Error', joinErr.message);
      return null;
    }

    // Auto-add partner if configured
    if (PARTNER_EMAIL) {
      try {
        const { data: partnerData, error: partnerErr } = await supabase.rpc('get_user_id_by_email', {
          email_param: PARTNER_EMAIL,
        });

        if (!partnerErr && partnerData) {
          const { error: partnerJoinErr } = await supabase
            .from('list_members')
            .insert([{ list_id: listData.id, user_id: partnerData }]);

          if (partnerJoinErr) {
            console.warn(`Warning: Could not auto-add partner to list: ${partnerJoinErr.message}`);
          }
        } else if (partnerErr) {
          console.warn(`Warning: Could not find partner user: ${partnerErr.message}`);
        }
      } catch (e) {
        console.warn('Warning: Auto-share with partner failed:', e);
      }
    }

    await fetchDirectoryContents();
    return listData;
  }

  // ── Delete a list ──
  async function deleteList(listId: string): Promise<boolean> {
    setError(null);
    const { error: err } = await supabase.from('lists').delete().eq('id', listId);
    if (err) {
      setError(`Failed to delete list: ${err.message}`);
      Alert.alert('Error', err.message);
      return false;
    }
    await fetchDirectoryContents();
    return true;
  }

  // ── Update list name ──
  async function updateListName(listId: string, newName: string): Promise<boolean> {
    if (!newName.trim()) return false;
    setError(null);
    const { error: err } = await supabase
      .from('lists')
      .update({ name: newName.trim() })
      .eq('id', listId);
    if (err) {
      setError(`Failed to rename list: ${err.message}`);
      Alert.alert('Error', err.message);
      return false;
    }
    await fetchDirectoryContents();
    return true;
  }

  // ── Set comment on a folder ──
  async function setFolderComment(folderId: string, comment: string | null) {
    setError(null);
    const { error: err } = await supabase
      .from('folders')
      .update({ comment })
      .eq('id', folderId);
    if (err) {
      setError(`Failed to save comment: ${err.message}`);
      Alert.alert('Error', err.message);
      return;
    }
    // Optimistic local update
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, comment } : f)));
  }

  // ── Set comment on a list ──
  async function setListComment(listId: string, comment: string | null) {
    setError(null);
    const { error: err } = await supabase
      .from('lists')
      .update({ comment })
      .eq('id', listId);
    if (err) {
      setError(`Failed to save comment: ${err.message}`);
      Alert.alert('Error', err.message);
      return;
    }
    // Optimistic local update
    setLists((prev) => prev.map((l) => (l.id === listId ? { ...l, comment } : l)));
  }

  // ── Navigation ──
  function goIntoFolder(folder: Folder) {
    setFolderPath([...folderPath, folder]);
  }

  function goUpOneFolder() {
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
  }

  function getBackLabel(): string {
    if (folderPath.length > 1) return folderPath[folderPath.length - 2].name;
    return 'Hub';
  }

  return {
    folderPath,
    currentFolder,
    folders,
    lists,
    loading,
    error,
    isOffline,
    createFolder,
    createList,
    deleteList,
    updateListName,
    setFolderComment,
    setListComment,
    goIntoFolder,
    goUpOneFolder,
    getBackLabel,
    refetch: fetchDirectoryContents,
  };
}
