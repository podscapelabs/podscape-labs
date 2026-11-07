-- Curated homepage spotlights. Admin-only writes through the server service role.
create table if not exists public.podscape_spotlights (
  slot integer primary key check (slot between 1 and 5),
  href text not null,
  updated_at timestamptz not null default now()
);
alter table public.podscape_spotlights enable row level security;
revoke all on public.podscape_spotlights from anon, authenticated;
grant select, insert, update, delete on public.podscape_spotlights to service_role;
