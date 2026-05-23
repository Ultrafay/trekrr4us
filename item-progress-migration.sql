-- Run in Supabase SQL Editor → New Query → Run
-- Creates item_progress and migrates existing item status/rating/note data.
-- After running: Settings → API → Reload schema cache

-- 1. Create table
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

-- 2. Migrate existing data: one progress row per item, for the user who added it
insert into public.item_progress (item_id, user_email, user_name, status, rating, note)
select
  id,
  added_by,
  added_by_name,
  coalesce(status, 'want'),
  rating,
  note
from public.items
on conflict (item_id, user_email) do nothing;

-- 3. Grants (required for PostgREST to introspect the table)
grant usage on schema public to anon, authenticated;
grant all on public.item_progress to authenticated;
grant select on public.item_progress to anon;

-- 4. RLS
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

-- 5. Auto-update trigger
create or replace function public.set_progress_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists item_progress_updated_at on public.item_progress;
create trigger item_progress_updated_at
  before update on public.item_progress
  for each row execute procedure public.set_progress_updated_at();
