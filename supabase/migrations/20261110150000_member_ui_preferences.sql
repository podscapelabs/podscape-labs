-- Member-owned device-to-account customization. Migration is staged in Git;
-- do not execute against production until the consolidated release.
create table if not exists public.member_ui_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 1 check (revision >= 1),
 home_layout jsonb not null,
 home_nav jsonb not null,
 bottom_nav jsonb not null,
 manager_layout jsonb not null,
 species_layout jsonb not null,
 updated_at timestamptz not null default now(),
 constraint member_ui_preferences_payload_objects check (
  jsonb_typeof(home_layout) = 'object'
  and jsonb_typeof(home_nav) = 'array'
  and jsonb_typeof(bottom_nav) = 'array'
  and jsonb_typeof(manager_layout) = 'object'
  and jsonb_typeof(species_layout) = 'object'
 ),
 constraint member_ui_preferences_payload_size check (
  pg_column_size(home_layout) <= 4096
  and pg_column_size(home_nav) <= 2048
  and pg_column_size(bottom_nav) <= 2048
  and pg_column_size(manager_layout) <= 4096
  and pg_column_size(species_layout) <= 4096
 )
);
alter table public.member_ui_preferences enable row level security;
revoke all on table public.member_ui_preferences from public, anon, authenticated;
grant select, insert, update on table public.member_ui_preferences to authenticated;
create policy "Members read only their UI preferences"
 on public.member_ui_preferences for select to authenticated
 using ((select auth.uid()) = user_id);
create policy "Members create only their UI preferences"
 on public.member_ui_preferences for insert to authenticated
 with check ((select auth.uid()) = user_id);
create policy "Members update only their UI preferences"
 on public.member_ui_preferences for update to authenticated
 using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
-- No DELETE grant or policy: disconnecting a device must not destroy cloud settings.
create index if not exists member_ui_preferences_updated_at_idx
 on public.member_ui_preferences(updated_at desc);
