-- Run this in Supabase → SQL Editor → New Query → Run.
-- It creates the items table and Row Level Security policies.

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

-- Row Level Security: only authenticated users (the allowlisted ones via auth) can do anything.
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
  with check (added_by = (auth.jwt() ->> 'email'));

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
