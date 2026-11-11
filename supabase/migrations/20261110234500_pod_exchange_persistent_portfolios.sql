-- Pod Exchange permanent beta portfolio. Account-owned authoritative wallet; market
-- quotes remain deterministic from UTC 5-minute cycles, no scheduled process.
create table if not exists public.member_exchange_portfolios (
 user_id uuid primary key references auth.users(id) on delete cascade,
 cash numeric(16,2) not null default 10000 check(cash>=0),
 holdings jsonb not null default '{}'::jsonb check (jsonb_typeof(holdings)='object'),
 revision bigint not null default 0 check(revision>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.member_exchange_orders (
 user_id uuid not null references auth.users(id) on delete cascade,
 trade_id text not null check(length(trade_id) between 12 and 150),
 symbol text not null check(symbol in ('DUCK','MOO','PANDA','BLUE','TITAN','CLOWN')),
 side text not null check(side in ('buy','sell')),
 shares integer not null check(shares between 1 and 1000000),
 unit_price numeric(16,2) not null check(unit_price>0),
 cycle bigint not null,
 created_at timestamptz not null default now(),
 primary key(user_id,trade_id)
);
create index if not exists member_exchange_orders_recent_idx on public.member_exchange_orders(user_id,created_at desc);
alter table public.member_exchange_portfolios enable row level security;
alter table public.member_exchange_orders enable row level security;
revoke all on public.member_exchange_portfolios from public,anon,authenticated;
revoke all on public.member_exchange_orders from public,anon,authenticated;
grant select on public.member_exchange_portfolios,public.member_exchange_orders to authenticated;
drop policy if exists "Members read their market portfolios" on public.member_exchange_portfolios;
create policy "Members read their market portfolios" on public.member_exchange_portfolios for select to authenticated
 using ((select auth.uid())=user_id);
drop policy if exists "Members read their market orders" on public.member_exchange_orders;
create policy "Members read their market orders" on public.member_exchange_orders for select to authenticated
 using ((select auth.uid())=user_id);

-- One-time legacy import. It NEVER overwrites an existing portfolio. Only the
-- authenticated application server (service-role RPC) can call this function.
create or replace function public.initialize_member_exchange_portfolio(
 p_user_id uuid,p_cash numeric,p_holdings jsonb,p_trades jsonb
)
returns boolean language plpgsql security definer set search_path=''
as $$
declare ticker text; qty text; trade jsonb; inserted_count bigint;
begin
 if p_user_id is null or p_cash is null or p_cash<0 or p_cash>10000000000
    or p_cash<>round(p_cash,2) or p_holdings is null
    or jsonb_typeof(p_holdings)<>'object' then
  raise exception 'Invalid legacy portfolio';
 end if;
 if p_trades is null or jsonb_typeof(p_trades)<>'array' or jsonb_array_length(p_trades)>50 then
  raise exception 'Invalid legacy trade history'; end if;
 for ticker,qty in select key,value from jsonb_each_text(p_holdings) loop
  if ticker not in ('DUCK','MOO','PANDA','BLUE','TITAN','CLOWN')
    or qty !~ '^[0-9]{1,7}$' or qty::numeric>1000000
  then raise exception 'Invalid legacy holdings'; end if;
 end loop;
 insert into public.member_exchange_portfolios(user_id,cash,holdings)
 values(p_user_id,p_cash,p_holdings) on conflict do nothing;
 get diagnostics inserted_count=row_count;
 if inserted_count=0 then return false; end if;
 for trade in select value from jsonb_array_elements(p_trades) loop
  if jsonb_typeof(trade)<>'object'
    or trade->>'symbol' not in ('DUCK','MOO','PANDA','BLUE','TITAN','CLOWN')
    or trade->>'side' not in ('buy','sell')
    or length(coalesce(trade->>'id','')) not between 12 and 150
    or (trade->>'shares') !~ '^[0-9]{1,7}
end;
$$;
revoke all on function public.initialize_member_exchange_portfolio(uuid,numeric,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.initialize_member_exchange_portfolio(uuid,numeric,jsonb,jsonb) to service_role;

-- All account trades are atomic, with server-verified quotes, account lock and
-- repeat-safe ids. A duplicate trade never executes or awards EXP twice.
create or replace function public.execute_member_exchange_order(
 p_user_id uuid,p_trade_id text,p_symbol text,p_side text,p_shares integer,
 p_cycle bigint,p_price numeric
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare wallet record; owned integer; total_cost numeric(16,2);next_cash numeric(16,2);
 next_holdings jsonb; next_quantity integer; existing record; result jsonb; rewards jsonb;
begin
 if p_user_id is null or p_trade_id is null or length(p_trade_id) not between 12 and 150
    or p_symbol not in ('DUCK','MOO','PANDA','BLUE','TITAN','CLOWN')
    or p_side not in ('buy','sell') or p_shares is null or p_shares not between 1 and 1000000
    or p_cycle is null or abs(p_cycle-floor(extract(epoch from now())/300)::bigint)>1
    or p_price is null or p_price<=0 or p_price<>round(p_price,2)
 then raise exception 'Invalid market order'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text||':exchange',0));
 -- A missing wallet is not silently re-initialized after it has been created.
 select * into wallet from public.member_exchange_portfolios where user_id=p_user_id for update;
 if not found then raise exception 'Market wallet has not been initialized'; end if;
 select trade_id,symbol,side,shares,unit_price,cycle into existing
 from public.member_exchange_orders where user_id=p_user_id and trade_id=p_trade_id;
 if found then
  if existing.symbol<>p_symbol or existing.side<>p_side or existing.shares<>p_shares
     or existing.unit_price<>p_price or existing.cycle<>p_cycle
  then raise exception 'Conflicting order id'; end if;
  return jsonb_build_object('duplicate',true,'cash',wallet.cash,'holdings',wallet.holdings,'revision',wallet.revision,'trade_id',p_trade_id,'unlocked','[]'::jsonb);
 end if;
 owned:=coalesce((wallet.holdings->>p_symbol)::integer,0);
 total_cost:=round(p_price*p_shares,2);
 if p_side='buy' and total_cost>wallet.cash then raise exception 'Insufficient Duck Bucks'; end if;
 if p_side='sell' and p_shares>owned then raise exception 'Not enough shares'; end if;
 next_quantity:=owned+case when p_side='buy' then p_shares else -p_shares end;
 if next_quantity>1000000 then raise exception 'Share limit reached'; end if;
 next_cash:=wallet.cash+case when p_side='buy' then -total_cost else total_cost end;
 if next_cash>100000000000000 then raise exception 'Wallet limit reached'; end if;
 next_holdings:=case when next_quantity=0 then wallet.holdings-p_symbol
  else jsonb_set(wallet.holdings,array[p_symbol],to_jsonb(next_quantity),true) end;
 update public.member_exchange_portfolios
 set cash=next_cash,holdings=next_holdings,revision=revision+1,updated_at=now()
 where user_id=p_user_id;
 insert into public.member_exchange_orders(user_id,trade_id,symbol,side,shares,unit_price,cycle)
 values(p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_price,p_cycle);
 -- Award native achievements in the same transaction as the trade.
 select coalesce(jsonb_agg(jsonb_build_object('achievement_key',ach.achievement_key,'exp_awarded',ach.exp_awarded)),'[]'::jsonb)
 into rewards from public.record_member_exchange_trade(p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_cycle) ach;
 return jsonb_build_object('duplicate',false,'cash',next_cash,'holdings',next_holdings,'revision',wallet.revision+1,'trade_id',p_trade_id,'unlocked',rewards);
end;
$$;
revoke all on function public.execute_member_exchange_order(uuid,text,text,text,integer,bigint,numeric) from public,anon,authenticated;
grant execute on function public.execute_member_exchange_order(uuid,text,text,text,integer,bigint,numeric) to service_role;

    or (trade->>'cycle') !~ '^[0-9]{1,15}
end;
$$;
revoke all on function public.initialize_member_exchange_portfolio(uuid,numeric,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.initialize_member_exchange_portfolio(uuid,numeric,jsonb,jsonb) to service_role;

-- All account trades are atomic, with server-verified quotes, account lock and
-- repeat-safe ids. A duplicate trade never executes or awards EXP twice.
create or replace function public.execute_member_exchange_order(
 p_user_id uuid,p_trade_id text,p_symbol text,p_side text,p_shares integer,
 p_cycle bigint,p_price numeric
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare wallet record; owned integer; total_cost numeric(16,2);next_cash numeric(16,2);
 next_holdings jsonb; next_quantity integer; existing record; result jsonb; rewards jsonb;
begin
 if p_user_id is null or p_trade_id is null or length(p_trade_id) not between 12 and 150
    or p_symbol not in ('DUCK','MOO','PANDA','BLUE','TITAN','CLOWN')
    or p_side not in ('buy','sell') or p_shares is null or p_shares not between 1 and 1000000
    or p_cycle is null or abs(p_cycle-floor(extract(epoch from now())/300)::bigint)>1
    or p_price is null or p_price<=0 or p_price<>round(p_price,2)
 then raise exception 'Invalid market order'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text||':exchange',0));
 -- A missing wallet is not silently re-initialized after it has been created.
 insert into public.member_exchange_portfolios(user_id) values(p_user_id) on conflict do nothing;
 select * into wallet from public.member_exchange_portfolios where user_id=p_user_id for update;
 select trade_id,symbol,side,shares,unit_price,cycle into existing
 from public.member_exchange_orders where user_id=p_user_id and trade_id=p_trade_id;
 if found then
  if existing.symbol<>p_symbol or existing.side<>p_side or existing.shares<>p_shares
     or existing.unit_price<>p_price or existing.cycle<>p_cycle
  then raise exception 'Conflicting order id'; end if;
  return jsonb_build_object('duplicate',true,'cash',wallet.cash,'holdings',wallet.holdings,'revision',wallet.revision,'trade_id',p_trade_id,'unlocked','[]'::jsonb);
 end if;
 owned:=coalesce((wallet.holdings->>p_symbol)::integer,0);
 total_cost:=round(p_price*p_shares,2);
 if p_side='buy' and total_cost>wallet.cash then raise exception 'Insufficient Duck Bucks'; end if;
 if p_side='sell' and p_shares>owned then raise exception 'Not enough shares'; end if;
 next_quantity:=owned+case when p_side='buy' then p_shares else -p_shares end;
 if next_quantity>1000000 then raise exception 'Share limit reached'; end if;
 next_cash:=wallet.cash+case when p_side='buy' then -total_cost else total_cost end;
 if next_cash>100000000000000 then raise exception 'Wallet limit reached'; end if;
 next_holdings:=case when next_quantity=0 then wallet.holdings-p_symbol
  else jsonb_set(wallet.holdings,array[p_symbol],to_jsonb(next_quantity),true) end;
 update public.member_exchange_portfolios
 set cash=next_cash,holdings=next_holdings,revision=revision+1,updated_at=now()
 where user_id=p_user_id;
 insert into public.member_exchange_orders(user_id,trade_id,symbol,side,shares,unit_price,cycle)
 values(p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_price,p_cycle);
 -- Award native achievements in the same transaction as the trade.
 select coalesce(jsonb_agg(jsonb_build_object('achievement_key',ach.achievement_key,'exp_awarded',ach.exp_awarded)),'[]'::jsonb)
 into rewards from public.record_member_exchange_trade(p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_cycle) ach;
 return jsonb_build_object('duplicate',false,'cash',next_cash,'holdings',next_holdings,'revision',wallet.revision+1,'trade_id',p_trade_id,'unlocked',rewards);
end;
$$;
revoke all on function public.execute_member_exchange_order(uuid,text,text,text,integer,bigint,numeric) from public,anon,authenticated;
grant execute on function public.execute_member_exchange_order(uuid,text,text,text,integer,bigint,numeric) to service_role;

    or (trade->>'unitPrice') !~ '^[0-9]{1,12}(\.[0-9]{1,2})?
end;
$$;
revoke all on function public.initialize_member_exchange_portfolio(uuid,numeric,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.initialize_member_exchange_portfolio(uuid,numeric,jsonb,jsonb) to service_role;

-- All account trades are atomic, with server-verified quotes, account lock and
-- repeat-safe ids. A duplicate trade never executes or awards EXP twice.
create or replace function public.execute_member_exchange_order(
 p_user_id uuid,p_trade_id text,p_symbol text,p_side text,p_shares integer,
 p_cycle bigint,p_price numeric
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare wallet record; owned integer; total_cost numeric(16,2);next_cash numeric(16,2);
 next_holdings jsonb; next_quantity integer; existing record; result jsonb; rewards jsonb;
begin
 if p_user_id is null or p_trade_id is null or length(p_trade_id) not between 12 and 150
    or p_symbol not in ('DUCK','MOO','PANDA','BLUE','TITAN','CLOWN')
    or p_side not in ('buy','sell') or p_shares is null or p_shares not between 1 and 1000000
    or p_cycle is null or abs(p_cycle-floor(extract(epoch from now())/300)::bigint)>1
    or p_price is null or p_price<=0 or p_price<>round(p_price,2)
 then raise exception 'Invalid market order'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text||':exchange',0));
 -- A missing wallet is not silently re-initialized after it has been created.
 insert into public.member_exchange_portfolios(user_id) values(p_user_id) on conflict do nothing;
 select * into wallet from public.member_exchange_portfolios where user_id=p_user_id for update;
 select trade_id,symbol,side,shares,unit_price,cycle into existing
 from public.member_exchange_orders where user_id=p_user_id and trade_id=p_trade_id;
 if found then
  if existing.symbol<>p_symbol or existing.side<>p_side or existing.shares<>p_shares
     or existing.unit_price<>p_price or existing.cycle<>p_cycle
  then raise exception 'Conflicting order id'; end if;
  return jsonb_build_object('duplicate',true,'cash',wallet.cash,'holdings',wallet.holdings,'revision',wallet.revision,'trade_id',p_trade_id,'unlocked','[]'::jsonb);
 end if;
 owned:=coalesce((wallet.holdings->>p_symbol)::integer,0);
 total_cost:=round(p_price*p_shares,2);
 if p_side='buy' and total_cost>wallet.cash then raise exception 'Insufficient Duck Bucks'; end if;
 if p_side='sell' and p_shares>owned then raise exception 'Not enough shares'; end if;
 next_quantity:=owned+case when p_side='buy' then p_shares else -p_shares end;
 if next_quantity>1000000 then raise exception 'Share limit reached'; end if;
 next_cash:=wallet.cash+case when p_side='buy' then -total_cost else total_cost end;
 if next_cash>100000000000000 then raise exception 'Wallet limit reached'; end if;
 next_holdings:=case when next_quantity=0 then wallet.holdings-p_symbol
  else jsonb_set(wallet.holdings,array[p_symbol],to_jsonb(next_quantity),true) end;
 update public.member_exchange_portfolios
 set cash=next_cash,holdings=next_holdings,revision=revision+1,updated_at=now()
 where user_id=p_user_id;
 insert into public.member_exchange_orders(user_id,trade_id,symbol,side,shares,unit_price,cycle)
 values(p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_price,p_cycle);
 -- Award native achievements in the same transaction as the trade.
 select coalesce(jsonb_agg(jsonb_build_object('achievement_key',ach.achievement_key,'exp_awarded',ach.exp_awarded)),'[]'::jsonb)
 into rewards from public.record_member_exchange_trade(p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_cycle) ach;
 return jsonb_build_object('duplicate',false,'cash',next_cash,'holdings',next_holdings,'revision',wallet.revision+1,'trade_id',p_trade_id,'unlocked',rewards);
end;
$$;
revoke all on function public.execute_member_exchange_order(uuid,text,text,text,integer,bigint,numeric) from public,anon,authenticated;
grant execute on function public.execute_member_exchange_order(uuid,text,text,text,integer,bigint,numeric) to service_role;

  then raise exception 'Invalid legacy trade history'; end if;
  insert into public.member_exchange_orders(user_id,trade_id,symbol,side,shares,cycle,unit_price)
  values(p_user_id,trade->>'id',trade->>'symbol',trade->>'side',
   (trade->>'shares')::integer,(trade->>'cycle')::bigint,(trade->>'unitPrice')::numeric)
  on conflict do nothing;
 end loop;
 return true;
end;
$$;
revoke all on function public.initialize_member_exchange_portfolio(uuid,numeric,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.initialize_member_exchange_portfolio(uuid,numeric,jsonb,jsonb) to service_role;

-- All account trades are atomic, with server-verified quotes, account lock and
-- repeat-safe ids. A duplicate trade never executes or awards EXP twice.
create or replace function public.execute_member_exchange_order(
 p_user_id uuid,p_trade_id text,p_symbol text,p_side text,p_shares integer,
 p_cycle bigint,p_price numeric
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare wallet record; owned integer; total_cost numeric(16,2);next_cash numeric(16,2);
 next_holdings jsonb; next_quantity integer; existing record; result jsonb; rewards jsonb;
begin
 if p_user_id is null or p_trade_id is null or length(p_trade_id) not between 12 and 150
    or p_symbol not in ('DUCK','MOO','PANDA','BLUE','TITAN','CLOWN')
    or p_side not in ('buy','sell') or p_shares is null or p_shares not between 1 and 1000000
    or p_cycle is null or abs(p_cycle-floor(extract(epoch from now())/300)::bigint)>1
    or p_price is null or p_price<=0 or p_price<>round(p_price,2)
 then raise exception 'Invalid market order'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text||':exchange',0));
 -- A missing wallet is not silently re-initialized after it has been created.
 insert into public.member_exchange_portfolios(user_id) values(p_user_id) on conflict do nothing;
 select * into wallet from public.member_exchange_portfolios where user_id=p_user_id for update;
 select trade_id,symbol,side,shares,unit_price,cycle into existing
 from public.member_exchange_orders where user_id=p_user_id and trade_id=p_trade_id;
 if found then
  if existing.symbol<>p_symbol or existing.side<>p_side or existing.shares<>p_shares
     or existing.unit_price<>p_price or existing.cycle<>p_cycle
  then raise exception 'Conflicting order id'; end if;
  return jsonb_build_object('duplicate',true,'cash',wallet.cash,'holdings',wallet.holdings,'revision',wallet.revision,'trade_id',p_trade_id,'unlocked','[]'::jsonb);
 end if;
 owned:=coalesce((wallet.holdings->>p_symbol)::integer,0);
 total_cost:=round(p_price*p_shares,2);
 if p_side='buy' and total_cost>wallet.cash then raise exception 'Insufficient Duck Bucks'; end if;
 if p_side='sell' and p_shares>owned then raise exception 'Not enough shares'; end if;
 next_quantity:=owned+case when p_side='buy' then p_shares else -p_shares end;
 if next_quantity>1000000 then raise exception 'Share limit reached'; end if;
 next_cash:=wallet.cash+case when p_side='buy' then -total_cost else total_cost end;
 if next_cash>100000000000000 then raise exception 'Wallet limit reached'; end if;
 next_holdings:=case when next_quantity=0 then wallet.holdings-p_symbol
  else jsonb_set(wallet.holdings,array[p_symbol],to_jsonb(next_quantity),true) end;
 update public.member_exchange_portfolios
 set cash=next_cash,holdings=next_holdings,revision=revision+1,updated_at=now()
 where user_id=p_user_id;
 insert into public.member_exchange_orders(user_id,trade_id,symbol,side,shares,unit_price,cycle)
 values(p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_price,p_cycle);
 -- Award native achievements in the same transaction as the trade.
 select coalesce(jsonb_agg(jsonb_build_object('achievement_key',ach.achievement_key,'exp_awarded',ach.exp_awarded)),'[]'::jsonb)
 into rewards from public.record_member_exchange_trade(p_user_id,p_trade_id,p_symbol,p_side,p_shares,p_cycle) ach;
 return jsonb_build_object('duplicate',false,'cash',next_cash,'holdings',next_holdings,'revision',wallet.revision+1,'trade_id',p_trade_id,'unlocked',rewards);
end;
$$;
revoke all on function public.execute_member_exchange_order(uuid,text,text,text,integer,bigint,numeric) from public,anon,authenticated;
grant execute on function public.execute_member_exchange_order(uuid,text,text,text,integer,bigint,numeric) to service_role;
