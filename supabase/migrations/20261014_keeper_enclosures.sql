-- Apply to the CUSTOMER Supabase project, NOT the separate PodBound project.
-- Existing member_species_collection records are preserved unchanged.
create table if not exists public.keeper_enclosures (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 species_id text not null,
 name text not null check (char_length(name) between 1 and 80),
 label text not null default '',
 quantity integer not null default 0 check (quantity between 0 and 99999),
 status text not null default 'establishing' check (status in ('planning','establishing','stable','thriving','declining','no-longer-kept')),
 breeding text not null default 'unknown' check (breeding in ('unknown','not-observed','observed','active')),
 enclosure_type text not null default '',
 notes text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists keeper_enclosures_user_idx on public.keeper_enclosures(user_id);
alter table public.keeper_enclosures enable row level security;
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
alter table public.keeper_events enable row level security;
create policy "Members read own keeper activity" on public.keeper_events for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.keeper_enclosures e where e.id = enclosure_id and e.user_id = (select auth.uid())));
create policy "Members log own keeper activity" on public.keeper_events for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.keeper_enclosures e where e.id = enclosure_id and e.user_id = (select auth.uid())));
