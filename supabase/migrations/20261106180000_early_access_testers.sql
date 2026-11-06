create table if not exists public.early_access_testers (
  email text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint early_access_email_format check (email = lower(trim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')
);
alter table public.early_access_testers enable row level security;
revoke all on table public.early_access_testers from anon, authenticated;
grant select on table public.early_access_testers to authenticated;
create policy "Testers can check only their own access" on public.early_access_testers
for select to authenticated
using (email = lower((select auth.jwt() ->> 'email')));
