-- Extend the first puzzle-desk schema without discarding existing draft puzzles.
alter table public.picture_puzzles
 add column if not exists puzzle_type text not null default 'jigsaw',
 add column if not exists level integer not null default 1,
 add column if not exists image_alt text not null default '',
 add column if not exists learning_note text not null default '';
do $$ begin
 if not exists(select 1 from pg_constraint where conname='picture_puzzles_puzzle_type_check') then
  alter table public.picture_puzzles add constraint picture_puzzles_puzzle_type_check check(puzzle_type in ('jigsaw','sliding'));
 end if;
 if not exists(select 1 from pg_constraint where conname='picture_puzzles_level_check') then
  alter table public.picture_puzzles add constraint picture_puzzles_level_check check(level between 1 and 6);
 end if;
end $$;
create index if not exists picture_puzzles_level_idx on public.picture_puzzles(status,puzzle_type,level,created_at);
