-- Community species photos: private personal gallery with explicit moderated publishing.
-- Apply only after reviewing in a non-production database.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('member-species-photos','member-species-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create table if not exists public.member_species_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  species_id text not null references public.species_records(id) on delete restrict,
  enclosure_id uuid references public.keeper_enclosures(id) on delete set null,
  storage_path text not null unique,
  original_name text not null default '',
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size integer not null check (byte_size between 1 and 5242880),
  credit_type text not null default 'username' check (credit_type in ('username','anonymous')),
  credit_name text not null default '',
  contribution_consent boolean not null default false,
  moderation_status text not null default 'private' check (moderation_status in ('private','pending','approved','rejected')),
  moderator_note text not null default '',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_photo_consent check (
    (moderation_status='private') or contribution_consent
  ),
  constraint photo_credit_length check (length(credit_name) <= 80),
  constraint photo_name_length check (length(original_name) <= 255)
);
create index if not exists member_species_photos_owner_idx on public.member_species_photos (user_id,species_id,created_at desc);
create index if not exists member_species_photos_public_idx on public.member_species_photos (species_id,created_at desc) where moderation_status='approved';
create index if not exists member_species_photos_queue_idx on public.member_species_photos (created_at) where moderation_status='pending';

alter table public.member_species_photos enable row level security;
-- A public approved row contains only voluntarily provided attribution, not private gallery rows.
create policy "Owners can see their photos and visitors can see approved photos"
on public.member_species_photos for select
using (user_id=(select auth.uid()) or moderation_status='approved');
-- No direct INSERT/UPDATE/DELETE from untrusted clients.
-- Trusted server handlers verify user identity, consent, species, size, ownership and moderation transitions.
-- Storage intentionally has no direct client policies: all operations occur through authorized server routes.
revoke insert, update, delete on public.member_species_photos from anon,authenticated;
grant select on public.member_species_photos to anon,authenticated;
