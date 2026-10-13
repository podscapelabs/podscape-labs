-- Private keeper details attached to an existing member-owned collection row.
alter table public.member_species_collection
  add column if not exists quantity integer not null default 1,
  add column if not exists acquired_on date,
  add column if not exists colony_status text not null default 'stable',
  add column if not exists private_notes text not null default '',
  add column if not exists updated_at timestamptz not null default now();

alter table public.member_species_collection
  drop constraint if exists member_species_collection_quantity_check,
  add constraint member_species_collection_quantity_check check (quantity between 1 and 9999),
  drop constraint if exists member_species_collection_colony_status_check,
  add constraint member_species_collection_colony_status_check check (
    colony_status in ('planning', 'establishing', 'stable', 'thriving', 'declining', 'no-longer-kept')
  ),
  drop constraint if exists member_species_collection_private_notes_check,
  add constraint member_species_collection_private_notes_check check (char_length(private_notes) <= 5000);

grant update (quantity, acquired_on, colony_status, private_notes, updated_at)
  on public.member_species_collection to authenticated;

drop policy if exists "Members can update their own collection details" on public.member_species_collection;
create policy "Members can update their own collection details"
  on public.member_species_collection for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
