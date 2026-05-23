-- Run this in Supabase → SQL Editor → New Query → Run
-- Fixes the insert policy AND adds the grants that prevent the
-- "Could not find the table 'public.items' in the schema cache" error.
-- After running, go to: Supabase Dashboard → Settings → API → "Reload schema cache"

-- Fix INSERT policy: allow any authenticated user to add items
drop policy if exists "auth users insert" on public.items;
create policy "auth users insert"
  on public.items for insert
  to authenticated
  with check (auth.uid() is not null);

-- Grants so PostgREST can introspect the table (required even with RLS)
grant usage on schema public to anon, authenticated;
grant all on public.items to authenticated;
grant select on public.items to anon;

-- Verify all four policies exist:
-- select policyname from pg_policies where tablename = 'items';
