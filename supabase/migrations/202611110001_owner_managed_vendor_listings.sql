-- Owner-managed directory listings need no customer account.
-- Existing member applications remain linked to auth.users.
alter table public.vendor_profiles alter column user_id drop not null;
comment on column public.vendor_profiles.user_id is 'NULL indicates a manually curated owner listing; non-NULL is a member-submitted application.';
