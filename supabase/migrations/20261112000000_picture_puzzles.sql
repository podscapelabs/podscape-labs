-- Picture puzzles are owner-created. The server-side service role handles writes.
create table if not exists public.picture_puzzles (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 3 and 90),
 description text not null default '',
 image_path text not null unique,
 difficulty text not null check (difficulty in ('easy','medium','hard')),
 status text not null default 'draft' check (status in ('draft','published')),
 created_at timestamptz not null default now()
);
create index if not exists picture_puzzles_published_idx on public.picture_puzzles(status,created_at desc);
alter table public.picture_puzzles enable row level security;
-- No direct client access; server pages select only the intended rows with the service role.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('picture-puzzles','picture-puzzles',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- Public image reads only. Only the server's service role uploads and deletes artwork.
drop policy if exists "Public picture puzzle artwork read" on storage.objects;
create policy "Public picture puzzle artwork read" on storage.objects for select to public using(bucket_id='picture-puzzles');
