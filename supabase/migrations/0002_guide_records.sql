create table if not exists public.guide_records (
  id text primary key,
  slug text not null unique,
  record jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists guide_records_slug_idx
  on public.guide_records (slug);

alter table public.guide_records enable row level security;
