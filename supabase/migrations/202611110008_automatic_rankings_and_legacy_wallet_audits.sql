-- Automatic standings across Arcade, Lifetime EXP and Pod Exchange.
-- Prior non-participants are anonymized, not named publicly without notice.
-- Previously opted-in members retain their explicit show/hide-name choice.
alter table public.fun_zone_ranking_preferences alter column public_enabled set default true;
alter table public.member_exp_ranking_preferences alter column public_enabled set default true;
alter table public.member_exchange_ranking_preferences alter column public_enabled set default true;
alter table public.fun_zone_ranking_preferences alter column reward_opted_in_at set default now();

update public.fun_zone_ranking_preferences
 set hide_username=true, public_enabled=true, reward_opted_in_at=coalesce(reward_opted_in_at,now()), updated_at=now()
 where public_enabled=false;
update public.fun_zone_ranking_preferences
 set reward_opted_in_at=now() where reward_opted_in_at is null;
insert into public.fun_zone_ranking_preferences(user_id,public_enabled,hide_username,reward_opted_in_at)
 select distinct c.user_id,true,true,now() from public.member_puzzle_completions c
 on conflict(user_id) do nothing;

update public.member_exp_ranking_preferences
 set hide_username=true, public_enabled=true, updated_at=now() where public_enabled=false;
insert into public.member_exp_ranking_preferences(user_id,public_enabled,hide_username)
 select p.user_id,true,true from public.member_progress p
 on conflict(user_id) do nothing;

update public.member_exchange_ranking_preferences
 set hide_username=true, public_enabled=true, updated_at=now() where public_enabled=false;
insert into public.member_exchange_ranking_preferences(user_id,public_enabled,hide_username,eligible)
 select w.user_id,true,true,false from public.member_exchange_portfolios w
 on conflict(user_id) do nothing;

alter table public.member_exchange_ranking_preferences
 add column if not exists auto_audit_attempted_at timestamptz;
comment on column public.member_exchange_ranking_preferences.auto_audit_attempted_at is
 'Null until the legacy portfolio is automatically checked against the deterministic server trade ledger. No owner approval is required.';

-- Create preference rows automatically for first-time players.
create or replace function public.ensure_arcade_ranking_preference()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.fun_zone_ranking_preferences(user_id,public_enabled,hide_username,reward_opted_in_at)
 values(new.user_id,true,false,now()) on conflict(user_id) do nothing;
 return new;
end;
$$;
drop trigger if exists auto_arcade_ranking_preference on public.member_puzzle_completions;
create trigger auto_arcade_ranking_preference
after insert on public.member_puzzle_completions for each row
execute function public.ensure_arcade_ranking_preference();

create or replace function public.ensure_exp_ranking_preference()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.member_exp_ranking_preferences(user_id,public_enabled,hide_username)
 values(new.user_id,true,false) on conflict(user_id) do nothing;
 return new;
end;
$$;
drop trigger if exists auto_exp_ranking_preference on public.member_progress;
create trigger auto_exp_ranking_preference
after insert on public.member_progress for each row
execute function public.ensure_exp_ranking_preference();

create or replace function public.get_fun_zone_rankings(
 p_period text default 'weekly',
 p_game_key text default 'all',
 p_viewer_id uuid default null
)
returns table (
 user_id uuid,
 display_name text,
 completed_count bigint,
 ranking_points bigint,
 rank_position bigint,
 is_viewer boolean
)
language plpgsql stable security invoker
set search_path = public
as $$
declare v_since timestamptz;
begin
 if p_period not in ('daily','weekly','monthly','all-time') then
  raise exception 'Invalid rankings period';
 end if;
 if p_game_key !~ '^[a-z0-9-]{2,60}$' then
  raise exception 'Invalid game filter';
 end if;
 v_since := case p_period
   when 'daily' then date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'
   when 'weekly' then date_trunc('week',now() at time zone 'UTC') at time zone 'UTC'
   when 'monthly' then date_trunc('month',now() at time zone 'UTC') at time zone 'UTC'
   else '-infinity'::timestamptz end;
 return query
 with totals as (
  select c.user_id, count(*)::bigint as completions
  from public.member_puzzle_completions c
  left join public.fun_zone_ranking_preferences p on p.user_id=c.user_id
  where c.completed_at>=v_since and (p_game_key='all' or c.game_key=p_game_key)
  group by c.user_id
 ), ranked as (
  select t.user_id, coalesce(nullif(trim(cp.display_name),''),'PodScape Keeper') as name,
   t.completions, (t.completions*100)::bigint as points,
   rank() over (order by t.completions desc)::bigint as place
  from totals t left join public.customer_profiles cp on cp.id=t.user_id
 )
 select r.user_id, r.name, r.completions, r.points, r.place,
  (p_viewer_id is not null and r.user_id=p_viewer_id)
 from ranked r where r.place<=50 or (p_viewer_id is not null and r.user_id=p_viewer_id)
 order by r.place asc,r.name asc,r.user_id asc
 limit 100;
end;
$$;
revoke all on function public.get_fun_zone_rankings(text,text,uuid) from public, anon, authenticated;
grant execute on function public.get_fun_zone_rankings(text,text,uuid) to service_role;
comment on function public.get_fun_zone_rankings(text,text,uuid) is
 'Automatic ranking of server-verified puzzle completions. Username privacy remains optional. UTC windows.';


create or replace function public.get_member_exp_rankings(
 p_viewer_id uuid default null
)
returns table (
 user_id uuid,
 display_name text,
 lifetime_exp bigint,
 keeper_level integer,
 rank_position bigint,
 is_viewer boolean
)
language sql stable security invoker set search_path=public
as $$
 with ranked as (
   select p.user_id,
    coalesce(nullif(trim(cp.display_name),''),'PodScape Keeper') as name,
    greatest(0,p.total_exp)::bigint as earned_exp,
    (floor(sqrt(greatest(0,p.total_exp)::numeric)/10)+1)::integer as level_number,
    rank() over(order by greatest(0,p.total_exp) desc)::bigint as place
   from public.member_progress p
   left join public.member_exp_ranking_preferences pref
    on pref.user_id=p.user_id
   left join public.customer_profiles cp on cp.id=p.user_id
 )
 select r.user_id,r.name,r.earned_exp,r.level_number,r.place,
  (p_viewer_id is not null and r.user_id=p_viewer_id)
 from ranked r
 where r.place<=50 or (p_viewer_id is not null and r.user_id=p_viewer_id)
 order by r.place,r.name,r.user_id
 limit 100;
$$;
revoke all on function public.get_member_exp_rankings(uuid) from public,anon,authenticated;
grant execute on function public.get_member_exp_rankings(uuid) to service_role;
comment on function public.get_member_exp_rankings(uuid) is
 'Automatic lifetime EXP leaderboard. Username privacy is configurable. Molt must preserve lifetime EXP.';

