create table if not exists public.product_records (
  id text primary key,
  slug text not null unique,
  record jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.product_records enable row level security;

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public product photographs are readable" on storage.objects;
create policy "Public product photographs are readable"
on storage.objects for select
using (bucket_id = 'product-photos');
