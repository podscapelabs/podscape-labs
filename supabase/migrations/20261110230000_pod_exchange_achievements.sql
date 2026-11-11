-- Pod Exchange beta: one-time EXP achievements for submitted, time-checked trade events.
-- The simulated game wallet stays on-device during beta; this ledger only stores
-- eligible achievement progress and never changes Duck Bucks or Pod Coins.
create table if not exists public.member_exchange_trades (
 user_id uuid not null references auth.users(id) on delete cascade,
 trade_id text not null check (length(trade_id) between 12 and 150),
 symbol text not null check(symbol in ('DUCK','MOO','PANDA','BLUE','TITAN','CLOWN')),
 side text not null check(side in ('buy','sell')),
 shares integer not null check(shares between 1 and 1000000),
 market_cycle bigint not null,
 recorded_at timestamptz not null default now(),
 primary key(user_id,trade_id)
);
create index if not exists member_exchange_trades_user_recent_idx
 on public.member_exchange_trades(user_id,recorded_at desc);
alter table public.member_exchange_trades enable row level security;
revoke all on public.member_exchange_trades from public, anon, authenticated;
grant select on public.member_exchange_trades to authenticated;
drop policy if exists "Members read their Pod Exchange trade milestones" on public.member_exchange_trades;
create policy "Members read their Pod Exchange trade milestones"
 on public.member_exchange_trades for select to authenticated
 using ((select auth.uid())=user_id);

-- Only the authenticated application server, using a service role, can submit
-- verified user events. The unique trade id and achievement keys guarantee
-- rewards cannot be granted twice, even with retries or concurrent requests.
create or replace function public.record_member_exchange_trade(
 p_user_id uuid,p_trade_id text,p_symbol text,p_side text,p_shares integer,p_market_cycle bigint
)
returns table(achievement_key text,exp_awarded integer)
language plpgsql security definer set search_path=''
as $$
declare
 inserted_count bigint;
 trade_count integer;
 company_count integer;
 sold_count integer;
 reward record;
 granted_key text;
 progress_event_id bigint;
begin
 if p_user_id is null or p_trade_id is null or length(p_trade_id) not between 12 and 150
    or p_symbol not in ('DUCK','MOO','PANDA','BLUE','TITAN','CLOWN')
    or p_side not in ('buy','sell')
    or p_shares is null or p_shares not between 1 and 1000000
    or p_market_cycle is null or
    abs(p_market_cycle - floor(extract(epoch from now())/300)::bigint)>1
 then raise exception 'Invalid Pod Exchange trade milestone'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text||':exchange',0));
 insert into public.member_exchange_trades(user_id,trade_id,symbol,side,shares,market_cycle)
 values(p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_market_cycle)
 on conflict do nothing;
 get diagnostics inserted_count=row_count;
 if inserted_count=0 then return; end if;

 select count(*),count(distinct symbol),count(*) filter (where side='sell')
 into trade_count,company_count,sold_count
 from public.member_exchange_trades where user_id=p_user_id;

 for reward in
  select v.key,v.points from (values
   ('exchange_first_trade'::text,15,trade_count>=1),
   ('exchange_first_sale',20,sold_count>=1),
   ('exchange_five_trades',30,trade_count>=5),
   ('exchange_three_companies',35,company_count>=3),
   ('exchange_fifteen_trades',60,trade_count>=15)
  ) as v(key,points,eligible) where v.eligible
 loop
  granted_key:=null;
  insert into public.member_achievements(user_id,achievement_key)
  values(p_user_id,reward.key) on conflict do nothing
  returning member_achievements.achievement_key into granted_key;
  if granted_key is null then continue; end if;
  progress_event_id:=null;
  insert into public.member_progress_events(user_id,event_key,source,exp_delta,coin_delta)
  values(p_user_id,'achievement:'||reward.key,'fun-zone',reward.points,0)
  on conflict (user_id,event_key) do nothing returning id into progress_event_id;
  if progress_event_id is not null then
   insert into public.member_progress(user_id,total_exp,pod_coins)
   values(p_user_id,reward.points,0)
   on conflict(user_id) do update set
    total_exp=public.member_progress.total_exp+excluded.total_exp,
    updated_at=now();
   achievement_key:=reward.key;exp_awarded:=reward.points;
   return next;
  end if;
 end loop;
end;
$$;
revoke all on function public.record_member_exchange_trade(uuid,text,text,text,integer,bigint) from public,anon,authenticated;
grant execute on function public.record_member_exchange_trade(uuid,text,text,text,integer,bigint) to service_role;
