-- Optional structured detail lines for the in-app release note panel.
-- Existing published and draft updates remain valid with an empty list.
alter table public.podscape_updates
 add column if not exists details jsonb not null default '[]'::jsonb;
alter table public.podscape_updates
 drop constraint if exists podscape_updates_details_shape;
alter table public.podscape_updates
 add constraint podscape_updates_details_shape check (
   jsonb_typeof(details)='array'
   and jsonb_array_length(details)<=12
   and jsonb_path_exists(details, '$[*] ? (@.type() != "string" || @.size() > 220)')=false
 );
grant select (details) on public.podscape_updates to anon,authenticated;
