-- Private, member-owned colony records. A saved Leaf Ledger species can have
-- several independently managed colonies or enclosures.
create table if not exists public.keeper_colonies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  species_id text not null,
  name text not null default 'Primary colony',
  quantity integer not null default 1,
  acquired_on date,
  source text not null default '',
  enclosure_details text not null default '',
  colony_status text not null default 'stable',
  private_notes text not null default '',
  is_primary boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint keeper_colonies_member_species_fkey
    foreign key (user_id, species_id)
    references public.member_species_collection (user_id, species_id)
    on delete cascade,
  constraint keeper_colonies_name_check check (char_length(trim(name)) between 1 and 120),
  constraint keeper_colonies_quantity_check check (quantity between 1 and 9999),
  constraint keeper_colonies_source_check check (char_length(source) <= 300),
  constraint keeper_colonies_enclosure_details_check check (char_length(enclosure_details) <= 1000),
  constraint keeper_colonies_status_check check (
    colony_status in ('planning', 'establishing', 'stable', 'thriving', 'declining', 'no-longer-kept')
  ),
  constraint keeper_colonies_private_notes_check check (char_length(private_notes) <= 5000)
);

create index if not exists keeper_colonies_member_species_idx
  on public.keeper_colonies (user_id, species_id);
create index if not exists keeper_colonies_member_active_idx
  on public.keeper_colonies (user_id, is_archived, updated_at desc);
create unique index if not exists keeper_colonies_one_primary_idx
  on public.keeper_colonies (user_id, species_id)
  where is_primary;

-- Preserve every existing private keeper record as the species' first colony.
insert into public.keeper_colonies (
  user_id, species_id, name, quantity, acquired_on, colony_status,
  private_notes, is_primary, created_at, updated_at
)
select
  member.user_id,
  member.species_id,
  'Primary colony',
  member.quantity,
  member.acquired_on,
  member.colony_status,
  member.private_notes,
  true,
  member.added_at,
  member.updated_at
from public.member_species_collection as member
where not exists (
  select 1 from public.keeper_colonies as colony
  where colony.user_id = member.user_id
    and colony.species_id = member.species_id
    and colony.is_primary
);

-- New saved species receive a usable primary colony automatically.
create or replace function public.create_primary_keeper_colony()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.keeper_colonies (
    user_id, species_id, name, quantity, acquired_on, colony_status,
    private_notes, is_primary, created_at, updated_at
  ) values (
    new.user_id, new.species_id, 'Primary colony', new.quantity,
    new.acquired_on, new.colony_status, new.private_notes, true,
    new.added_at, new.updated_at
  )
  on conflict (user_id, species_id) where is_primary do nothing;
  return new;
end;
$$;

revoke all on function public.create_primary_keeper_colony() from public, anon, authenticated;

create trigger create_primary_keeper_colony_after_insert
after insert on public.member_species_collection
for each row execute function public.create_primary_keeper_colony();

alter table public.keeper_colonies enable row level security;
revoke all on public.keeper_colonies from public, anon, authenticated;
grant select, insert, update, delete on public.keeper_colonies to authenticated;

create policy "Members can view their own keeper colonies"
  on public.keeper_colonies for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Members can add their own keeper colonies"
  on public.keeper_colonies for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Members can update their own keeper colonies"
  on public.keeper_colonies for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Members can delete their own keeper colonies"
  on public.keeper_colonies for delete to authenticated
  using ((select auth.uid()) = user_id);
