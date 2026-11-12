-- Each saved Ledger profile counts once, regardless of bins, population or re-collection.
create or replace function public.reconcile_member_collection_specialists(p_user_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare
 v_total bigint; v_springtails bigint; v_isopods bigint; v_cubaris bigint;
 v_armadillidium bigint; v_porcellio bigint; v_genera bigint;
 rule record; awarded integer:=0;
begin
 if p_user_id is null then raise exception 'Missing member'; end if;
 perform 1 from auth.users where id=p_user_id for update;
 if not found then raise exception 'Unknown member'; end if;
 select count(*),
 count(*) filter(where s.record->>'organismGroup'='springtail'),
 count(*) filter(where coalesce(s.record->>'organismGroup','isopod')='isopod'),
 count(*) filter(where lower(trim(s.record->>'genus'))='cubaris' and coalesce(s.record->>'organismGroup','isopod')='isopod'),
 count(*) filter(where lower(trim(s.record->>'genus'))='armadillidium' and coalesce(s.record->>'organismGroup','isopod')='isopod'),
 count(*) filter(where lower(trim(s.record->>'genus'))='porcellio' and coalesce(s.record->>'organismGroup','isopod')='isopod'),
 count(distinct nullif(lower(trim(s.record->>'genus')),''))
 into v_total,v_springtails,v_isopods,v_cubaris,v_armadillidium,v_porcellio,v_genera
 from public.member_species_collection c join public.species_records s on s.id=c.species_id
 where c.user_id=p_user_id and s.record->>'kind'='species';

 for rule in select * from (values
 ('collection_springtail_1',15,v_springtails>=1),
 ('collection_springtail_3',25,v_springtails>=3),
 ('collection_springtail_5',40,v_springtails>=5),
 ('collection_springtail_10',75,v_springtails>=10),
 ('collection_springtail_20',125,v_springtails>=20),
 ('collection_cubaris_3',25,v_cubaris>=3),
 ('collection_cubaris_5',40,v_cubaris>=5),
 ('collection_cubaris_10',75,v_cubaris>=10),
 ('collection_cubaris_20',125,v_cubaris>=20),
 ('collection_armadillidium_5',40,v_armadillidium>=5),
 ('collection_armadillidium_10',75,v_armadillidium>=10),
 ('collection_porcellio_5',40,v_porcellio>=5),
 ('collection_porcellio_10',75,v_porcellio>=10),
 ('collection_genera_3',35,v_genera>=3),
 ('collection_genera_5',60,v_genera>=5),
 ('collection_seventy_five_species',300,v_total>=75),
 ('collection_one_hundred_species',400,v_total>=100),
 ('collection_both_groups',25,v_springtails>0 and v_isopods>0)
 ) as rules(key,points,eligible)
 loop
  if not rule.eligible then continue; end if;
  insert into public.member_achievements(user_id,achievement_key) values(p_user_id,rule.key) on conflict do nothing;
  if not found then continue; end if;
  insert into public.member_progress_events(user_id,event_key,source,exp_delta,coin_delta)
  values(p_user_id,'achievement:'||rule.key,'achievement',rule.points,0) on conflict do nothing;
  if found then
   insert into public.member_progress(user_id,total_exp,pod_coins) values(p_user_id,rule.points,0)
   on conflict(user_id) do update set total_exp=public.member_progress.total_exp+excluded.total_exp,updated_at=now();
   awarded:=awarded+1;
  end if;
 end loop;
 return awarded;
end;
$$;
revoke all on function public.reconcile_member_collection_specialists(uuid) from public,anon,authenticated;
grant execute on function public.reconcile_member_collection_specialists(uuid) to service_role;

create or replace function public.record_collection_specialist_from_insert()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.reconcile_member_collection_specialists(new.user_id);
 return new;
end;
$$;
revoke all on function public.record_collection_specialist_from_insert() from public,anon,authenticated;
create trigger member_collection_specialist_achievements after insert on public.member_species_collection
for each row execute function public.record_collection_specialist_from_insert();
