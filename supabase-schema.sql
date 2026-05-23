-- Run this in Supabase → SQL Editor → New Query → Run.
-- It creates the items table, Row Level Security policies, and grants.
-- After running, go to: Supabase Dashboard → Settings → API → "Reload schema cache"

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('movie','series','book')),
  status text not null default 'want' check (status in ('want','in_progress','done')),
  rating int check (rating between 0 and 5),
  note text,
  cover_url text,
  year text,
  external_id text,
  added_by text not null,
  added_by_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Grants: required so PostgREST can see the table (fixes "schema cache" error)
grant usage on schema public to anon, authenticated;
grant all on public.items to authenticated;
grant select on public.items to anon;

create index if not exists items_created_at_idx on public.items (created_at desc);
create index if not exists items_status_idx on public.items (status);
create index if not exists items_type_idx on public.items (type);
create index if not exists items_added_by_idx on public.items (added_by);

-- updated_at auto trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists items_updated_at on public.items;
create trigger items_updated_at
  before update on public.items
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.items enable row level security;

drop policy if exists "auth users read" on public.items;
create policy "auth users read"
  on public.items for select
  to authenticated
  using (true);

drop policy if exists "auth users insert" on public.items;
create policy "auth users insert"
  on public.items for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "auth users update" on public.items;
create policy "auth users update"
  on public.items for update
  to authenticated
  using (true);

drop policy if exists "auth users delete" on public.items;
create policy "auth users delete"
  on public.items for delete
  to authenticated
  using (true);

-- item_progress: one row per (item, user) for per-person status/rating/note
create table if not exists public.item_progress (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_email text not null,
  user_name text not null,
  status text not null default 'want' check (status in ('want','in_progress','done')),
  rating int check (rating between 0 and 5),
  note text,
  updated_at timestamptz default now(),
  unique(item_id, user_email)
);

grant all on public.item_progress to authenticated;
grant select on public.item_progress to anon;

create or replace function public.set_progress_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists item_progress_updated_at on public.item_progress;
create trigger item_progress_updated_at
  before update on public.item_progress
  for each row execute procedure public.set_progress_updated_at();

alter table public.item_progress enable row level security;

drop policy if exists "auth read progress" on public.item_progress;
create policy "auth read progress" on public.item_progress
  for select to authenticated using (true);

drop policy if exists "auth insert progress" on public.item_progress;
create policy "auth insert progress" on public.item_progress
  for insert to authenticated with check (true);

drop policy if exists "auth update progress" on public.item_progress;
create policy "auth update progress" on public.item_progress
  for update to authenticated using (true);

drop policy if exists "auth delete progress" on public.item_progress;
create policy "auth delete progress" on public.item_progress
  for delete to authenticated using (true);
