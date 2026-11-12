-- Exercise the real settlement/reward chain without committing wallet changes.
begin;
do $test$
declare
 u uuid;
 c bigint:=1000000000+floor(extract(epoch from now())/60)::bigint;
 legacy bigint:=floor(extract(epoch from now())/300)::bigint;
 original public.member_exchange_portfolios%rowtype;
 result jsonb;
 id text:='regression:'||gen_random_uuid()::text;
begin
 select * into original from public.member_exchange_portfolios where cash>=2 limit 1 for update;
 if not found then raise exception 'No funded test wallet'; end if;
 u:=original.user_id;
 result:=public.execute_member_exchange_order(u,id||':buy','DUCK','buy',1,c,1);
 if (result->>'cash')::numeric<>original.cash-1.01
   or (result->'holdings'->>'DUCK')::integer<>coalesce((original.holdings->>'DUCK')::integer,0)+1
 then raise exception 'Buy settlement mismatch'; end if;
 result:=public.execute_member_exchange_order(u,id||':buy','DUCK','buy',1,c,1);
 if not (result->>'duplicate')::boolean
   or (result->>'revision')::bigint<>original.revision+1
 then raise exception 'Duplicate order charged twice'; end if;
 result:=public.execute_member_exchange_order(u,id||':sell','DUCK','sell',1,c,1);
 if (result->>'cash')::numeric<>original.cash-0.02
   or coalesce((result->'holdings'->>'DUCK')::integer,0)<>coalesce((original.holdings->>'DUCK')::integer,0)
 then raise exception 'Sell settlement mismatch'; end if;
 if (select count(*) from public.member_exchange_trades where user_id=u and trade_id in(id||':buy',id||':sell'))<>2
 then raise exception 'Achievement recording missing'; end if;
 perform public.record_member_exchange_trade(u,id||':legacy','DUCK','buy',1,legacy);
 begin
  perform public.execute_member_exchange_order(u,id||':stale','DUCK','buy',1,c-10,1);
  raise exception 'Stale order was accepted';
 exception when others then
  if sqlerrm<>'Invalid market order' then raise; end if;
 end;
 if has_function_privilege('anon','public.record_member_exchange_trade(uuid,text,text,text,integer,bigint)','EXECUTE')
 or has_function_privilege('authenticated','public.record_member_exchange_trade(uuid,text,text,text,integer,bigint)','EXECUTE')
 then raise exception 'Trade reward function exposed'; end if;
end;
$test$;
rollback;
