-- PodScape Vendor Directory (apply to the customer Supabase project before enabling).
-- Owner approval is enforced in server actions; no member can self-publish.
create table if not exists public.vendor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 80),
  tagline text not null default '' check (char_length(tagline) <= 140),
  description text not null default '' check (char_length(description) <= 1000),
  website_url text not null default '' check (char_length(website_url) <= 500),
  instagram_url text not null default '' check (char_length(instagram_url) <= 500),
  facebook_url text not null default '' check (char_length(facebook_url) <= 500),
  location_label text not null default '' check (char_length(location_label) <= 100),
  logo_path text not null default '' check (char_length(logo_path) <= 400),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vendor_profiles_status_name_idx on public.vendor_profiles(status,business_name);
alter table public.vendor_profiles enable row level security;
drop policy if exists "Published vendors are visible" on public.vendor_profiles;
create policy "Published vendors are visible" on public.vendor_profiles for select to anon, authenticated
 using (status = 'approved');
-- Member application reads use an identity-checked server action; no direct personal-profile policy.
drop policy if exists "Members can read their own application" on public.vendor_profiles;
-- No direct user INSERT/UPDATE/DELETE policies. Reviewed server actions use service key and verified identity.
-- Expose only public listing fields, never the member's user_id or review metadata.
revoke all on public.vendor_profiles from anon, authenticated;
grant select (id,business_name,tagline,description,location_label,website_url,
  instagram_url,facebook_url,logo_path,status,created_at,updated_at)
  on public.vendor_profiles to anon, authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('vendor-logos','vendor-logos',true,2097152,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true,file_size_limit=2097152,
allowed_mime_types=array['image/png','image/jpeg','image/webp'];
-- No storage.objects write policies: writes occur only through authenticated server actions.
