export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: string;
  comment?: string | null;
}

export interface List {
  id: string;
  name: string;
  folder_id: string | null;
  created_by: string;
  created_at: string;
  comment?: string | null;
}

export interface ListMember {
  list_id: string;
  user_id: string;
}

export interface Item {
  id: string;
  list_id: string;
  title: string;
  added_by: string;
  is_completed: boolean;
  created_at: string;
  comment?: string | null;
}