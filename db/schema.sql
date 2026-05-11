We need to output the complete modified code as per the suggested edit. The suggested edit modifies the original code by introducing a helper function `public.get_my_list_ids()` and revising several policies to use it, resolving recursion issues. The output should be the entire file, including comments.

We'll output exactly the suggested edit content, as it's the full modified file. We must not add extra commentary.-- ── Tables ───────────────────────────────────────────────────
create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  parent_id  uuid references public.folders(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  comment    text,
  created_at timestamptz not null default now()
);

create table if not exists public.lists (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  folder_id  uuid references public.folders(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  comment    text,
  created_at timestamptz not null default now()
);

create table if not exists public.list_members (
  list_id uuid not null references public.lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (list_id, user_id)
);

create table if not exists public.items (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null references public.lists(id) on delete cascade,
  title        text not null,
  added_by     uuid not null references auth.users(id) on delete set null,
  is_completed boolean not null default false,
  comment      text,
  created_at   timestamptz not null default now()
);

-- ── Helper Function ──────────────────────────────────────────
-- Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion

create or replace function public.get_my_list_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select list_id from public.list_members where user_id = auth.uid();
$$;

-- Get user ID by email (for partner lookup in auto-sharing)
create or replace function public.get_user_id_by_email(email_param text)
returns uuid
language sql
security definer
stable
as $$
  select id from auth.users where email = email_param limit 1;
$$;

-- ── Indexes ──────────────────────────────────────────────────

create index if not exists idx_folders_parent on public.folders(parent_id);
create index if not exists idx_lists_folder  on public.lists(folder_id);
create index if not exists idx_items_list    on public.items(list_id);

-- ── Enable Row Level Security ────────────────────────────────

alter table public.folders       enable row level security;
alter table public.lists         enable row level security;
alter table public.list_members  enable row level security;
alter table public.items         enable row level security;

-- ── Folder Policies ──────────────────────────────────────────
-- No recursive self-reference — uses the helper function for list lookups

create policy "Users can read folders they own or contain their lists"
  on public.folders for select
  using (
    created_by = auth.uid()
    or id in (
      select folder_id from public.lists
      where id in (select public.get_my_list_ids())
    )
  );

create policy "Users can create folders"
  on public.folders for insert
  with check ( created_by = auth.uid());

create policy "Users can update their own folders"
  on public.folders for update
  using ( created_by = auth.uid());

create policy "Users can delete their own folders"
  on public.folders for delete
  using ( created_by = auth.uid());

-- ── List Policies ────────────────────────────────────────────

create policy "Users can read lists in folders they own or are members of"
  on public.lists for select
  using (
    created_by = auth.uid()
    or id in (select public.get_my_list_ids())
    or folder_id in (select id from public.folders where created_by = auth.uid())
  );

create policy "Users can create lists"
  on public.lists for insert
  with check ( created_by = auth.uid());

create policy "List creator can update their list"
  on public.lists for update
  using ( created_by = auth.uid());

create policy "List creator can delete their list"
  on public.lists for delete
  using ( created_by = auth.uid());

-- ── List Members Policies ────────────────────────────────────
-- Uses the helper function to avoid self-referential recursion

create policy "Users can read members of lists they belong to"
  on public.list_members for select
  using (
    list_id in (select public.get_my_list_ids())
  );

create policy "Users can join a list (self-insert)"
  on public.list_members for insert
  with check ( user_id = auth.uid());

create policy "Users can leave a list (self-delete)"
  on public.list_members for delete
  using ( user_id = auth.uid());

-- ── Item Policies ────────────────────────────────────────────

create policy "Members can read items of their lists"
  on public.items for select
  using (
    list_id in (select public.get_my_list_ids())
  );

create policy "Members can create items in their lists"
  on public.items for insert
  with check (
    added_by = auth.uid()
    and list_id in (select public.get_my_list_ids())
  );

create policy "Members can update items in their lists"
  on public.items for update
  using (
    list_id in (select public.get_my_list_ids())
  );

create policy "Members can delete items in their lists"
  on public.items for delete
  using (
    list_id in (select public.get_my_list_ids())
  );

