-- Podscape Labs customer identity foundation.
-- Apply only after explicit approval. Does NOT change existing content tables.
-- Authentication credentials belong exclusively to Supabase Auth (auth.users).

create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

-- The profile table is private, not a public directory.
revoke all on public.customer_profiles from PUBLIC, anon, authenticated;
grant select on public.customer_profiles to authenticated;
grant update (display_name) on public.customer_profiles to authenticated;

drop policy if exists customer_profiles_read_own on public.customer_profiles;
create policy customer_profiles_read_own on public.customer_profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists customer_profiles_update_own on public.customer_profiles;
create policy customer_profiles_update_own on public.customer_profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- The trigger runs with its migration owner's rights so clients never need INSERT.
create or replace function public.create_customer_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.customer_profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', ''), 60))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_customer_signup on auth.users;
create trigger on_customer_signup
  after insert on auth.users
  for each row execute function public.create_customer_profile();

create or replace function public.touch_customer_profile()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_customer_profile_update on public.customer_profiles;
create trigger on_customer_profile_update
  before update on public.customer_profiles
  for each row execute function public.touch_customer_profile();

-- If this Supabase project ever had early auth users, give them private profiles.
insert into public.customer_profiles (id, display_name)
select id, left(coalesce(raw_user_meta_data->>'display_name', ''), 60)
from auth.users
on conflict (id) do nothing;
