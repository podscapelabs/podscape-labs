-- Allow keepers to undo their own care logs without permitting changes to other accounts.
-- This mirrors the production migration keeper_events_owner_scoped_undo.
grant delete on table public.keeper_events to authenticated;

drop policy if exists "Members undo own keeper activity" on public.keeper_events;
create policy "Members undo own keeper activity"
on public.keeper_events for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.keeper_enclosures e
    where e.id = enclosure_id
      and e.user_id = (select auth.uid())
  )
);
