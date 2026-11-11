-- Extra achievements are derived ONLY from verified PodScape records, never client-submitted points.
-- All reward grants are immutable, uniquely keyed progress events, and idempotent.
create or replace function public.reconcile_member_extended_achievements(p_user_id uuid)
returns integer language plpgsql security definer set search_path=''
as $$
declare
 v_collection bigint; v_enclosures bigint; v_care bigint; v_care_days bigint;
 v_games bigint; v_puzzles bigint; v_play_days bigint; v_burrow bigint;
 v_lifetime_exp bigint;
 v_rule record; v_awarded integer:=0;
begin
 if p_user_id is null then raise exception 'Missing member'; end if;
 perform 1 from auth.users where id=p_user_id for update;
 if not found then raise exception 'Unknown member'; end if;
 select coalesce((select total_exp from public.member_progress where user_id=p_user_id),0)
  into v_lifetime_exp;
 select count(*) into v_collection from public.member_species_collection where user_id=p_user_id;
 select count(*) into v_enclosures from public.keeper_enclosures where user_id=p_user_id;
 select count(*),count(distinct (created_at at time zone 'UTC')::date)
  into v_care,v_care_days from public.keeper_events
  where user_id=p_user_id and kind in ('feeding','maintenance','breeding','observation');
 select count(*),count(distinct game_key),count(distinct (completed_at at time zone 'UTC')::date),
  count(*) filter (where game_key='word-burrow')
  into v_puzzles,v_games,v_play_days,v_burrow
  from public.member_puzzle_completions where user_id=p_user_id;

 for v_rule in
  select * from (values
    ('level_ten',50,v_lifetime_exp>=8100),
    ('level_twenty_five',150,v_lifetime_exp>=57600),
    ('level_fifty',300,v_lifetime_exp>=240100),
    ('collection_twenty_five_species',175, v_collection>=25),
    ('keeper_first_enclosure',15, v_enclosures>=1),
    ('keeper_five_enclosures',60, v_enclosures>=5),
    ('keeper_first_care',15, v_care>=1),
    ('care_journal',35, v_care>=5 and v_care_days>=3),
    ('care_seven_days',80, v_care_days>=7),
    ('puzzle_three_games',35, v_games>=3),
    ('puzzle_twenty_four',110, v_puzzles>=24),
    ('secret_arcade_variety',45, v_games>=4),
    ('secret_burrow_streak',40, v_play_days>=3),
    ('secret_burrow_explorer',40, v_burrow>=3)
  ) as rule(achievement_key,exp_amount,eligible)
 loop
  if not v_rule.eligible then continue; end if;
  insert into public.member_achievements(user_id,achievement_key)
   values(p_user_id,v_rule.achievement_key) on conflict do nothing;
  if not found then continue; end if;
  insert into public.member_progress_events(user_id,event_key,source,exp_delta,coin_delta)
   values(p_user_id,'achievement:'||v_rule.achievement_key,'achievement',v_rule.exp_amount,0)
   on conflict do nothing;
  if found then
   insert into public.member_progress(user_id,total_exp,pod_coins)
    values(p_user_id,v_rule.exp_amount,0)
    on conflict(user_id) do update
     set total_exp=public.member_progress.total_exp+excluded.total_exp,
         updated_at=now();
   v_awarded:=v_awarded+1;
  end if;
 end loop;
 return v_awarded;
end;
$$;
revoke all on function public.reconcile_member_extended_achievements(uuid) from public,anon,authenticated;
grant execute on function public.reconcile_member_extended_achievements(uuid) to service_role;

-- Each insertion into an authoritative keeper / puzzle / collection table can unlock awards.
create or replace function public.record_extended_achievement_from_insert()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 perform public.reconcile_member_extended_achievements(new.user_id);
 return new;
end;
$$;
revoke all on function public.record_extended_achievement_from_insert() from public,anon,authenticated;

drop trigger if exists keeper_enclosure_achievements on public.keeper_enclosures;
create trigger keeper_enclosure_achievements after insert on public.keeper_enclosures
 for each row execute function public.record_extended_achievement_from_insert();
drop trigger if exists keeper_event_achievements on public.keeper_events;
create trigger keeper_event_achievements after insert on public.keeper_events
 for each row execute function public.record_extended_achievement_from_insert();
drop trigger if exists member_collection_extended_achievements on public.member_species_collection;
create trigger member_collection_extended_achievements after insert on public.member_species_collection
 for each row execute function public.record_extended_achievement_from_insert();
drop trigger if exists member_puzzle_extended_achievements on public.member_puzzle_completions;
create trigger member_puzzle_extended_achievements after insert on public.member_puzzle_completions
 for each row execute function public.record_extended_achievement_from_insert();

-- Every EXP change can reach a new keeper level. Guard recursion when a milestone awards EXP.
create or replace function public.record_level_achievement_from_progress()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_rule record;
begin
 if pg_trigger_depth()>1 then return new; end if;
 if tg_op='UPDATE' then
  if new.total_exp<=old.total_exp then return new; end if;
 end if;
 for v_rule in select * from (values
   ('level_ten',8100,50),
   ('level_twenty_five',57600,150),
   ('level_fifty',240100,300)
 ) as rules(achievement_key,min_exp,exp_amount)
 loop
  if new.total_exp<v_rule.min_exp then continue; end if;
  insert into public.member_achievements(user_id,achievement_key)
   values(new.user_id,v_rule.achievement_key) on conflict do nothing;
  if not found then continue; end if;
  insert into public.member_progress_events(user_id,event_key,source,exp_delta,coin_delta)
   values(new.user_id,'achievement:'||v_rule.achievement_key,'achievement',v_rule.exp_amount,0)
   on conflict do nothing;
  if found then
   update public.member_progress set total_exp=total_exp+v_rule.exp_amount,updated_at=now()
    where user_id=new.user_id;
  end if;
 end loop;
 return new;
end;
$$;
revoke all on function public.record_level_achievement_from_progress() from public,anon,authenticated;
drop trigger if exists member_progress_level_achievements on public.member_progress;
create trigger member_progress_level_achievements
 after insert or update of total_exp on public.member_progress
 for each row execute function public.record_level_achievement_from_progress();

comment on function public.reconcile_member_extended_achievements(uuid) is
 'Reconciles one-time achievements from keeper enclosures, care, collected species and verified puzzle completions; idempotent EXP events; callable only by service role.';
