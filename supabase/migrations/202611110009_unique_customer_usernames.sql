-- Unique, mandatory usernames for new PodScape registrations.
-- Existing legacy names are retained; blank legacy names must be claimed on profile edit.
-- Case-insensitive uniqueness is enforced in PostgreSQL, not just the UI.
create unique index if not exists customer_profiles_unique_username_ci
 on public.customer_profiles (lower(btrim(display_name)))
 where btrim(display_name) <> '';

-- NOT VALID preserves legacy profiles while enforcing the rule for new or edited rows.
alter table public.customer_profiles
 add constraint customer_profiles_username_format
 check (display_name ~ '^[A-Za-z0-9_]{3,24}$') not valid;

create or replace function public.is_customer_username_available(p_username text)
returns boolean language sql stable security definer set search_path=''
as $$
 select p_username is not null
  and p_username ~ '^[A-Za-z0-9_]{3,24}$'
  and not exists (
   select 1 from public.customer_profiles p
   where lower(btrim(p.display_name))=lower(btrim(p_username))
  );
$$;
revoke all on function public.is_customer_username_available(text) from public;
grant execute on function public.is_customer_username_available(text) to anon,authenticated;

-- The signup trigger is the final protection against concurrent duplicate submissions.
create or replace function public.create_customer_profile()
returns trigger language plpgsql security definer set search_path=''
as $$
declare proposed text;
begin
 proposed:=btrim(coalesce(new.raw_user_meta_data->>'display_name',''));
 if proposed !~ '^[A-Za-z0-9_]{3,24}$' then
  raise exception 'A valid unique username is required' using errcode='23514';
 end if;
 insert into public.customer_profiles(id,display_name)
 values(new.id,proposed);
 return new;
end;
$$;

comment on index public.customer_profiles_unique_username_ci is
 'Case-insensitive unique PodScape usernames; existing blank legacy accounts can claim a name later.';
