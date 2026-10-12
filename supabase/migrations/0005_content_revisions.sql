create table if not exists public.content_revisions (
  revision_id bigint generated always as identity primary key,
  entity_type text not null,
  entity_id text not null,
  record jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists content_revisions_entity_idx
  on public.content_revisions (entity_type, entity_id, created_at desc);

alter table public.content_revisions enable row level security;

create or replace function public.capture_content_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.content_revisions (entity_type, entity_id, record)
  values (tg_table_name, new.id, new.record);
  return new;
end;
$$;

drop trigger if exists species_records_capture_revision on public.species_records;
create trigger species_records_capture_revision
  after insert or update on public.species_records
  for each row execute function public.capture_content_revision();

drop trigger if exists guide_records_capture_revision on public.guide_records;
create trigger guide_records_capture_revision
  after insert or update on public.guide_records
  for each row execute function public.capture_content_revision();

drop trigger if exists product_records_capture_revision on public.product_records;
create trigger product_records_capture_revision
  after insert or update on public.product_records
  for each row execute function public.capture_content_revision();

drop trigger if exists lab_records_capture_revision on public.lab_records;
create trigger lab_records_capture_revision
  after insert or update on public.lab_records
  for each row execute function public.capture_content_revision();
