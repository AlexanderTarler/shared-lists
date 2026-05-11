import AsyncStorage from '@react-native-async-storage/async-storage';
import { Folder, List, Item } from '../types';

// ── Directory Cache ──

const DIRECTORY_CACHE_PREFIX = 'dir_cache_';

type CachedDirectory = {
  folders: Folder[];
  lists: List[];
};

export async function saveCachedDirectory(
  folderId: string | null,
  folders: Folder[],
  lists: List[],
): Promise<void> {
  const key = DIRECTORY_CACHE_PREFIX + (folderId ?? '__root__');
  const data: CachedDirectory = { folders, lists };
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function loadCachedDirectory(
  folderId: string | null,
): Promise<CachedDirectory | null> {
  try {
    const key = DIRECTORY_CACHE_PREFIX + (folderId ?? '__root__');
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as CachedDirectory;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Items Cache ──

const ITEMS_CACHE_PREFIX = 'items_cache_';

export async function saveCachedItems(listId: string, items: Item[]): Promise<void> {
  const key = ITEMS_CACHE_PREFIX + listId;
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function loadCachedItems(listId: string): Promise<Item[] | null> {
  try {
    const key = ITEMS_CACHE_PREFIX + listId;
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as Item[];
    }
    return null;
  } catch {
    return null;
  }
}
