begin;
do $test$
declare
 u uuid; prefix text:='achievement-regression-'||gen_random_uuid()::text;
 species_id text; i integer; xp bigint; grants bigint;
begin
 select user_id into u from public.member_exchange_portfolios limit 1;
 if u is null then raise exception 'No test member'; end if;
 for i in 1..20 loop
  species_id:=prefix||'-'||i;
  insert into public.species_records(id,slug,record,updated_at)
  values(species_id,species_id,jsonb_build_object('id',species_id,'slug',species_id,'kind','species','tags','[]'::jsonb,'status','published','organismGroup',case when i<=10 then 'springtail' else 'isopod' end,'genus',case when i<=10 then 'RegressionSpringtail' else 'Cubaris' end),now());
  insert into public.member_species_collection(user_id,species_id) values(u,species_id);
 end loop;
 if not exists(select 1 from public.member_achievements where user_id=u and achievement_key='collection_cubaris_10')
 or not exists(select 1 from public.member_achievements where user_id=u and achievement_key='collection_springtail_10')
 or not exists(select 1 from public.member_achievements where user_id=u and achievement_key='collection_both_groups')
 then raise exception 'Collection thresholds failed'; end if;
 if exists(select 1 from public.keeper_enclosures where user_id=u and keeper_enclosures.species_id like prefix||'%')
 then raise exception 'Collection achievements created bins'; end if;
 select total_exp into xp from public.member_progress where user_id=u;
 if public.reconcile_member_collection_specialists(u)<>0 then raise exception 'Reconciliation awarded twice'; end if;
 delete from public.member_species_collection c where c.user_id=u and c.species_id=prefix||'-1';
 insert into public.member_species_collection(user_id,species_id) values(u,prefix||'-1');
 if (select total_exp from public.member_progress where user_id=u)<>xp then raise exception 'Recollection farmed EXP'; end if;
 if (select count(*) from public.member_progress_events where user_id=u and event_key='achievement:collection_cubaris_10')<>1
 then raise exception 'Duplicate reward events'; end if;
 if has_function_privilege('authenticated','public.reconcile_member_collection_specialists(uuid)','EXECUTE')
 or has_function_privilege('anon','public.record_collection_specialist_from_insert()','EXECUTE')
 then raise exception 'Privileged reward function exposed'; end if;
end;
$test$;
rollback;
