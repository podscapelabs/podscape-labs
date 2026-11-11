-- Verified Fun Zone rankings, independent of EXP, Pod Coins, purchases and simulator wallets.
-- All reporting windows are UTC. Participation is explicitly opt-in.
create table if not exists public.fun_zone_ranking_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 public_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.fun_zone_ranking_preferences enable row level security;
revoke all on public.fun_zone_ranking_preferences from anon, authenticated;
create index if not exists member_puzzle_completions_rank_date_idx
 on public.member_puzzle_completions(completed_at desc, game_key, user_id);

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
  join public.fun_zone_ranking_preferences p on p.user_id=c.user_id and p.public_enabled=true
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
 'Opt-in ranking of one-time server-verified puzzle completions. 100 ranking points per completion. UTC windows.';
