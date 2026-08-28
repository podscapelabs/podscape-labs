create table if not exists public.species_records (
  id text primary key,
  slug text not null unique,
  record jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists species_records_slug_idx
  on public.species_records (slug);

alter table public.species_records enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'species-photos',
  'species-photos',
  true,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
