-- Customer-owned Leaf Ledger species selections (after customer profiles).
-- A catalogue entry is referenced by permanent ID, not duplicated into a member's account.
create table if not exists public.member_species_collection (
  user_id uuid not null references auth.users(id) on delete cascade,
  species_id text not null references public.species_records(id) on delete restrict,
  added_at timestamptz not null default now(),
  constraint member_species_collection_pkey primary key (user_id, species_id)
);

create index if not exists member_species_collection_species_idx
  on public.member_species_collection (species_id);

alter table public.member_species_collection enable row level security;
revoke all on public.member_species_collection from public, anon, authenticated;
grant select, insert, delete on public.member_species_collection to authenticated;

-- Existing species_records has admin-only access, so this narrow function checks
-- whether the supplied catalogue ID is eligible without exposing catalogue rows.
create or replace function public.is_collectible_species(target_species_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.species_records s
    where s.id = target_species_id
      and s.record->>'kind' = 'species'
      and coalesce(s.record->>'archivedAt', '') = ''
  );
$$;
revoke all on function public.is_collectible_species(text) from public, anon;
grant execute on function public.is_collectible_species(text) to authenticated;

drop policy if exists "Members can view their own collection" on public.member_species_collection;
create policy "Members can view their own collection"
  on public.member_species_collection for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Members can add eligible species to their own collection" on public.member_species_collection;
create policy "Members can add eligible species to their own collection"
  on public.member_species_collection for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.is_collectible_species(species_id)
  );

drop policy if exists "Members can remove species from their own collection" on public.member_species_collection;
create policy "Members can remove species from their own collection"
  on public.member_species_collection for delete to authenticated
  using ((select auth.uid()) = user_id);
