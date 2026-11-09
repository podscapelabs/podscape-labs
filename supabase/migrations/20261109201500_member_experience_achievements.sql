-- One-time, server-authorized early-access experience achievements.
-- Separate from puzzle achievements; both share existing progress/achievement ledgers.
create table if not exists public.member_experience_actions (
 user_id uuid not null references auth.users(id) on delete cascade,
 action_key text not null check (action_key in
 ('onboarding_complete','home_personalized','nav_personalized','species_personalized','manager_personalized')),
 completed_at timestamptz not null default now(),
 primary key (user_id,action_key)
);
alter table public.member_experience_actions enable row level security;
revoke all on public.member_experience_actions from public, anon, authenticated;
grant select on public.member_experience_actions to authenticated;
drop policy if exists "Members read own experience events" on public.member_experience_actions;
create policy "Members read own experience events" on public.member_experience_actions
 for select to authenticated using ((select auth.uid())=user_id);

-- Only authenticated application server code may call this function using the service role.
-- Every milestone is atomic with its progress/EXP event; retries never pay twice.
create or replace function public.record_member_experience_action(
 p_user_id uuid, p_action_key text
)
returns table(achievement_key text, exp_awarded integer)
language plpgsql security definer set search_path=''
as $$
declare
 inserted_count bigint;
 customized integer;
 reward record;
 newly_unlocked text;
 new_event bigint;
begin
 if p_user_id is null or p_action_key not in
 ('onboarding_complete','home_personalized','nav_personalized','species_personalized','manager_personalized')
 then raise exception 'Invalid experience action'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text||':experience',0));

 insert into public.member_experience_actions(user_id,action_key)
 values(p_user_id,p_action_key) on conflict do nothing;
 get diagnostics inserted_count = row_count;
 if inserted_count=0 then return; end if;

 select count(*) into customized from public.member_experience_actions
 where user_id=p_user_id and action_key in
 ('home_personalized','nav_personalized','species_personalized','manager_personalized');

 for reward in
  select v.key,v.points from (values
   ('onboarding_complete'::text,35,'onboarding_complete'::text),
   ('home_personalized',20,'home_personalized'),
   ('nav_personalized',20,'nav_personalized'),
   ('species_personalized',25,'species_personalized'),
   ('manager_personalized',25,'manager_personalized')
  ) as v(key,points,trigger) where v.trigger=p_action_key
  union all select 'customize_three',60 where customized>=3
  union all select 'customize_all',100 where customized=4
 loop
  newly_unlocked:=null;
  insert into public.member_achievements(user_id,achievement_key)
  values(p_user_id,reward.key) on conflict do nothing
  returning member_achievements.achievement_key into newly_unlocked;
  if newly_unlocked is not null then
   new_event:=null;
   insert into public.member_progress_events(user_id,event_key,source,exp_delta,coin_delta)
   values(p_user_id,'achievement:'||reward.key,'personalization',reward.points,0)
   on conflict (user_id,event_key) do nothing returning id into new_event;
   if new_event is not null then
    insert into public.member_progress(user_id,total_exp,pod_coins)
    values(p_user_id,reward.points,0)
    on conflict(user_id) do update set
     total_exp=public.member_progress.total_exp+excluded.total_exp,
     updated_at=now();
    achievement_key:=reward.key;exp_awarded:=reward.points;
    return next;
   end if;
  end if;
 end loop;
end;
$$;
revoke all on function public.record_member_experience_action(uuid,text) from public,anon,authenticated;
grant execute on function public.record_member_experience_action(uuid,text) to service_role;
