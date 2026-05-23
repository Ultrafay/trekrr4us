-- Run this in Supabase → SQL Editor → New Query → Run
-- Fixes the insert policy so adding items actually works.

drop policy if exists "auth users insert" on public.items;
create policy "auth users insert"
  on public.items for insert
  to authenticated
  with check (true);

-- Verify all four policies exist:
-- select policyname from pg_policies where tablename = 'items';
