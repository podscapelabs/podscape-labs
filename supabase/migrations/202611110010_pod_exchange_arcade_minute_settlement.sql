-- Versioned arcade minute-cycle settlement, preserving all legacy five-minute orders.
-- Existing wallets, fee rules, order IDs, balances, and historical cycles stay unchanged.
-- Non-destructive repair: align already-created Exchange RPC with the 0.5% market fee.
create or replace function public.execute_member_exchange_order(
 p_user_id uuid,p_trade_id text,p_symbol text,p_side text,p_shares integer,
 p_cycle bigint,p_price numeric
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 wallet record;
 owned integer;
 total_cost numeric(16,2);
 fee numeric(16,2);
 net_total numeric(16,2);
 next_cash numeric(16,2);
 next_holdings jsonb;
 next_quantity integer;
 previous_order record;
 rewards jsonb;
begin
 if p_user_id is null or p_trade_id is null or length(p_trade_id) not between 12 and 150
    or p_symbol not in ('DUCK','MOO','PANDA','BLUE','TITAN','CLOWN')
    or p_side not in ('buy','sell') or p_shares is null or p_shares not between 1 and 1000000
    or p_cycle is null or not (
      abs(p_cycle-floor(extract(epoch from now())/300)::bigint)<=1
      or (
        extract(epoch from now())>=extract(epoch from timestamptz '2026-11-11 00:00:00+00')
        and abs(p_cycle-(1000000000+floor(extract(epoch from now())/60)::bigint))<=1
      )
    )
    or p_price is null or p_price<=0 or p_price<>round(p_price,2)
 then raise exception 'Invalid market order'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text||':exchange',0));
 select * into wallet from public.member_exchange_portfolios
 where user_id=p_user_id for update;
 if not found then raise exception 'Market wallet is not initialized'; end if;
 select trade_id,symbol,side,shares,unit_price,cycle into previous_order
 from public.member_exchange_orders where user_id=p_user_id and trade_id=p_trade_id;
 if found then
  if previous_order.symbol<>p_symbol or previous_order.side<>p_side
    or previous_order.shares<>p_shares or previous_order.unit_price<>p_price
    or previous_order.cycle<>p_cycle
  then raise exception 'Conflicting order ID'; end if;
  return jsonb_build_object('duplicate',true,'cash',wallet.cash,'holdings',wallet.holdings,
    'revision',wallet.revision,'trade_id',p_trade_id,'unlocked','[]'::jsonb);
 end if;
 owned:=coalesce((wallet.holdings->>p_symbol)::integer,0);
 total_cost:=round(p_price*p_shares,2);
 fee:=greatest(0.01,round(total_cost*0.005,2));
 net_total:=total_cost+case when p_side='buy' then fee else -fee end;
 if p_side='buy' and net_total>wallet.cash then raise exception 'Insufficient Duck Bucks'; end if;
 if p_side='sell' and p_shares>owned then raise exception 'Not enough shares'; end if;
 next_quantity:=owned+case when p_side='buy' then p_shares else -p_shares end;
 if next_quantity>1000000 then raise exception 'Share limit reached'; end if;
 next_cash:=wallet.cash+case when p_side='buy' then -net_total else net_total end;
 next_holdings:=case when next_quantity=0 then wallet.holdings-p_symbol
  else jsonb_set(wallet.holdings,array[p_symbol],to_jsonb(next_quantity),true) end;
 update public.member_exchange_portfolios
 set cash=next_cash,holdings=next_holdings,revision=revision+1,updated_at=now()
 where user_id=p_user_id;
 insert into public.member_exchange_orders(user_id,trade_id,symbol,side,shares,unit_price,cycle)
 values(p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_price,p_cycle);
 select coalesce(jsonb_agg(jsonb_build_object('achievement_key',a.achievement_key,
    'exp_awarded',a.exp_awarded)),'[]'::jsonb)
 into rewards
 from public.record_member_exchange_trade(
    p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_cycle) a;
 return jsonb_build_object('duplicate',false,'cash',next_cash,'holdings',next_holdings,
   'revision',wallet.revision+1,'trade_id',p_trade_id,'unlocked',rewards);
end;
$$;
revoke all on function public.execute_member_exchange_order(uuid,text,text,text,integer,bigint,numeric) from public,anon,authenticated;
grant execute on function public.execute_member_exchange_order(uuid,text,text,text,integer,bigint,numeric) to service_role;
