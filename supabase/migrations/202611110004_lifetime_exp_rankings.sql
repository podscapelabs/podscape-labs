-- Lifetime EXP leaderboard is separate from Arcade puzzle rankings.
-- Public visibility is opt-in and may be revoked independently of arcade rankings.
create table if not exists public.member_exp_ranking_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 public_enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.member_exp_ranking_preferences enable row level security;
revoke all on public.member_exp_ranking_preferences from anon, authenticated;

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
   inner join public.member_exp_ranking_preferences pref
    on pref.user_id=p.user_id and pref.public_enabled=true
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
 'Opt-in all-time EXP leaderboard. Level formula matches My Progress. Molt prestige is not enabled and must preserve lifetime EXP when introduced.';
