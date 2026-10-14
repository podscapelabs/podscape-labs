-- Apply to the CUSTOMER Supabase project, NOT the separate PodBound project.
-- Existing member_species_collection records are preserved unchanged.
create table if not exists public.keeper_enclosures (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null,
 species_id text not null,
 name text not null check (char_length(name) between 1 and 80),
 label text not null default '' check (char_length(label) <= 70),
 quantity integer not null default 0 check (quantity between 0 and 99999),
 status text not null default 'establishing' check (status in ('planning','establishing','stable','thriving','declining','no-longer-kept')),
 breeding text not null default 'unknown' check (breeding in ('unknown','not-observed','observed','active')),
 enclosure_type text not null default '' check (char_length(enclosure_type) <= 120),
 acquired_on date,
 source text not null default '' check (char_length(source) <= 300),
 notes text not null default '' check (char_length(notes) <= 5000),
 is_primary boolean not null default false,
 is_archived boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint keeper_enclosures_member_species_fkey foreign key (user_id, species_id)
   references public.member_species_collection(user_id, species_id) on delete cascade
);
create index if not exists keeper_enclosures_user_idx on public.keeper_enclosures(user_id);
create index if not exists keeper_enclosures_user_active_idx on public.keeper_enclosures(user_id,is_archived,updated_at desc);
create unique index if not exists keeper_enclosures_one_primary_idx on public.keeper_enclosures(user_id,species_id) where is_primary;

-- Preserve every existing My Collection record as a usable first enclosure.
insert into public.keeper_enclosures (
 user_id,species_id,name,quantity,status,acquired_on,notes,is_primary,created_at,updated_at
)
select user_id,species_id,'Primary colony',quantity,colony_status,acquired_on,private_notes,true,added_at,updated_at
from public.member_species_collection
on conflict (user_id,species_id) where is_primary do nothing;

create or replace function public.create_primary_keeper_enclosure()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.keeper_enclosures (
  user_id,species_id,name,quantity,status,acquired_on,notes,is_primary,created_at,updated_at
 ) values (
  new.user_id,new.species_id,'Primary colony',new.quantity,new.colony_status,
  new.acquired_on,new.private_notes,true,new.added_at,new.updated_at
 ) on conflict (user_id,species_id) where is_primary do nothing;
 return new;
end;
$$;
revoke all on function public.create_primary_keeper_enclosure() from public,anon,authenticated;
create trigger create_primary_keeper_enclosure_after_insert
after insert on public.member_species_collection
for each row execute function public.create_primary_keeper_enclosure();

alter table public.keeper_enclosures enable row level security;
revoke all on public.keeper_enclosures from public,anon,authenticated;
grant select,insert,update,delete on public.keeper_enclosures to authenticated;
create policy "Members manage their enclosures" on public.keeper_enclosures for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.keeper_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 enclosure_id uuid not null references public.keeper_enclosures(id) on delete cascade,
 kind text not null check (kind in ('feeding','maintenance','breeding','observation','inventory')),
 note text not null check (char_length(note) between 1 and 1500),
 quantity_change integer,
 created_at timestamptz not null default now()
);
create index if not exists keeper_events_enclosure_idx on public.keeper_events(enclosure_id,created_at desc);
create index if not exists keeper_events_user_idx on public.keeper_events(user_id);
alter table public.keeper_events enable row level security;
revoke all on public.keeper_events from public,anon,authenticated;
grant select,insert on public.keeper_events to authenticated;
create policy "Members read own keeper activity" on public.keeper_events for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.keeper_enclosures e where e.id = enclosure_id and e.user_id = (select auth.uid())));
create policy "Members log own keeper activity" on public.keeper_events for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.keeper_enclosures e where e.id = enclosure_id and e.user_id = (select auth.uid())));
