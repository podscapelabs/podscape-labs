-- Artist attribution is stored independently of the artwork file and title.
-- Existing drafts remain valid; new drafts and publication require a credit through owner actions.
alter table public.picture_puzzles
 add column if not exists artist_credit text not null default '';
do $$ begin
 if not exists(select 1 from pg_constraint where conname='picture_puzzles_artist_credit_length_check') then
  alter table public.picture_puzzles add constraint picture_puzzles_artist_credit_length_check
   check (char_length(artist_credit) <= 120);
 end if;
end $$;
comment on column public.picture_puzzles.artist_credit is
 'Display name of the original artist/photographer. Credit alone does not establish reproduction permission.';
