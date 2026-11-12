-- Align achievement recording with the minute-clock order settlement.
-- Preserve legacy cycles, wallets, trade history, rewards and service-only access.
CREATE OR REPLACE FUNCTION public.record_member_exchange_trade(p_user_id uuid, p_trade_id text, p_symbol text, p_side text, p_shares integer, p_market_cycle bigint)
 RETURNS TABLE(achievement_key text, exp_awarded integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    or p_market_cycle is null or not (
      abs(p_market_cycle-floor(extract(epoch from now())/300)::bigint)<=1
      or (
        extract(epoch from now())>=extract(epoch from timestamptz '2026-11-11 00:00:00+00')
        and abs(p_market_cycle-(1000000000+floor(extract(epoch from now())/60)::bigint))<=1
      )
    )
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
$function$;

revoke all on function public.record_member_exchange_trade(uuid,text,text,text,integer,bigint) from public,anon,authenticated;
grant execute on function public.record_member_exchange_trade(uuid,text,text,text,integer,bigint) to service_role;
