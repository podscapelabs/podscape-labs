-- Curated platform release notes. Drafts never appear in the public feed.
create table if not exists public.podscape_updates (
 id uuid primary key default gen_random_uuid(),
 category text not null check (category in ('leaf_ledger','whats_improved','new_features','field_guide','shop_vendors','fun_podbound')),
 title text not null check (char_length(title) between 3 and 100),
 summary text not null check (char_length(summary) between 5 and 240),
 href text not null check (char_length(href) between 1 and 300 and left(href,1)='/' and left(href,2)<>'//'),
 status text not null default 'draft' check (status in ('draft','published')),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint update_published_at_consistency check ((status='draft' and published_at is null) or (status='published' and published_at is not null))
);
create index if not exists podscape_updates_published_idx on public.podscape_updates(category,published_at desc) where status='published';
alter table public.podscape_updates enable row level security;
revoke all on public.podscape_updates from anon,authenticated;
grant select (id,category,title,summary,href,published_at) on public.podscape_updates to anon,authenticated;
drop policy if exists "Public sees published PodScape updates" on public.podscape_updates;
create policy "Public sees published PodScape updates" on public.podscape_updates for select to anon,authenticated using (status='published');
-- Publishing, editing and unpublishing are restricted to validated Owner Studio server actions.
