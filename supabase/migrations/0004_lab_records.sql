create table if not exists public.lab_records (
  id text primary key,
  slug text not null unique,
  record jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists lab_records_slug_idx
  on public.lab_records (slug);

alter table public.lab_records enable row level security;
