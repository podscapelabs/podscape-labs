-- Extend existing one-time, transactional Fun Zone awards with 12-picture-puzzle launch milestones.
-- The achievement event's unique key prevents duplicate EXP on replay.
-- Extend existing transactional, one-time Fun Zone award routine.
-- Existing per-puzzle uniqueness and achievement event keys prevent repeat EXP.
create or replace function public.record_member_puzzle_completion(
 p_user_id uuid,p_game_key text,p_puzzle_id text,p_previous_puzzle_id text
)
returns table(achievement_key text,exp_awarded integer)
language plpgsql security definer set search_path to ''
as $function$
declare
 inserted_count bigint := 0;
 puzzle_count integer;
 legacy_count integer;
 game_count integer;
 picture_count integer;
 jigsaw_count integer;
 sliding_count integer;
 jigsaw_easy_count integer;
 jigsaw_medium_count integer;
 jigsaw_hard_count integer;
 sliding_easy_count integer;
 sliding_medium_count integer;
 sliding_hard_count integer;
 reward record;
 inserted_key text;
 event_id bigint;
begin
 if p_user_id is null or p_game_key is null or p_puzzle_id is null
    or length(p_game_key)>60 or length(p_puzzle_id)>80 then
  raise exception 'Invalid puzzle completion';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text || ':' || p_game_key,0));
 if p_previous_puzzle_id is not null and not exists (
  select 1 from public.member_puzzle_completions
  where user_id=p_user_id and game_key=p_game_key and puzzle_id=p_previous_puzzle_id
 ) then raise exception 'Previous puzzle must be completed first'; end if;

 insert into public.member_puzzle_completions(user_id,game_key,puzzle_id)
 values(p_user_id,p_game_key,p_puzzle_id)
 on conflict do nothing;
 get diagnostics inserted_count = row_count;
 if inserted_count=0 then return; end if;

 select count(*),
        count(*) filter (where game_key <> 'picture-puzzles'),
        count(distinct game_key) filter (where game_key <> 'picture-puzzles')
 into puzzle_count,legacy_count,game_count
 from public.member_puzzle_completions where user_id=p_user_id;

 select count(*),
        count(*) filter (where p.puzzle_type='jigsaw'),
        count(*) filter (where p.puzzle_type='sliding'),
        count(*) filter (where p.puzzle_type='jigsaw' and p.difficulty='easy'),
        count(*) filter (where p.puzzle_type='jigsaw' and p.difficulty='medium'),
        count(*) filter (where p.puzzle_type='jigsaw' and p.difficulty='hard'),
        count(*) filter (where p.puzzle_type='sliding' and p.difficulty='easy'),
        count(*) filter (where p.puzzle_type='sliding' and p.difficulty='medium'),
        count(*) filter (where p.puzzle_type='sliding' and p.difficulty='hard')
 into picture_count,jigsaw_count,sliding_count,jigsaw_easy_count,jigsaw_medium_count,jigsaw_hard_count,sliding_easy_count,sliding_medium_count,sliding_hard_count
 from public.member_puzzle_completions c
 join public.picture_puzzles p on c.game_key='picture-puzzles' and c.puzzle_id=p.id::text
 where c.user_id=p_user_id;

 for reward in
  select v.key,v.points from (values
   ('puzzle_pathfinder'::text,10,1),
   ('puzzle_five'::text,30,5),
   ('puzzle_sixteen'::text,80,16),
   ('puzzle_all_thirty_two'::text,200,32)
  ) as v(key,points,threshold)
  where case when v.key='puzzle_all_thirty_two' then legacy_count else puzzle_count end >= v.threshold
  union all select 'puzzle_all_eight_games',125 where game_count>=8
  union all select 'picture_first_jigsaw',20 where jigsaw_count>=1
  union all select 'picture_first_sliding',20 where sliding_count>=1
  union all select 'picture_five',45 where picture_count>=5
  union all select 'picture_jigsaw_easy_pair',25 where jigsaw_easy_count>=2
  union all select 'picture_jigsaw_medium_pair',40 where jigsaw_medium_count>=2
  union all select 'picture_jigsaw_hard_pair',65 where jigsaw_hard_count>=2
  union all select 'picture_sliding_easy_pair',25 where sliding_easy_count>=2
  union all select 'picture_sliding_medium_pair',40 where sliding_medium_count>=2
  union all select 'picture_sliding_hard_pair',65 where sliding_hard_count>=2
  union all select 'picture_all_six_jigsaw',90 where jigsaw_count>=6
  union all select 'picture_all_six_sliding',90 where sliding_count>=6
  union all select 'picture_all_twelve',150 where picture_count>=12
 loop
  inserted_key:=null;
  insert into public.member_achievements(user_id,achievement_key)
  values(p_user_id,reward.key)
  on conflict do nothing
  returning member_achievements.achievement_key into inserted_key;

  if inserted_key is not null then
   event_id:=null;
   insert into public.member_progress_events(user_id,event_key,source,exp_delta,coin_delta)
   values(p_user_id,'achievement:'||reward.key,'fun-zone',reward.points,0)
   on conflict (user_id,event_key) do nothing
   returning id into event_id;
   if event_id is not null then
    insert into public.member_progress(user_id,total_exp,pod_coins)
    values(p_user_id,reward.points,0)
    on conflict(user_id) do update set
     total_exp=public.member_progress.total_exp+excluded.total_exp,
     updated_at=now();
    achievement_key:=reward.key;
    exp_awarded:=reward.points;
    return next;
   end if;
  end if;
 end loop;
end;
$function$;
-- Only the service-role backend should invoke privileged completion recording.
revoke all on function public.record_member_puzzle_completion(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.record_member_puzzle_completion(uuid,text,text,text) to service_role;
