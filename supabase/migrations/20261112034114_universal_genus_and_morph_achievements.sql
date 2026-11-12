-- Each saved Ledger profile counts once, regardless of bins, population or re-collection.
create or replace function public.reconcile_member_collection_specialists(p_user_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare
 v_total bigint; v_springtails bigint; v_isopods bigint; v_cubaris bigint;
 v_armadillidium bigint; v_porcellio bigint; v_genera bigint;
 v_max_morphs bigint; v_morph_sets bigint; v_named_species bigint;
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
 count(distinct case when lower(trim(s.record->>'genus')) ~ '^[a-z]+$' then lower(trim(s.record->>'genus')) end)
 into v_total,v_springtails,v_isopods,v_cubaris,v_armadillidium,v_porcellio,v_genera
 from public.member_species_collection c join public.species_records s on s.id=c.species_id
 where c.user_id=p_user_id and s.record->>'kind'='species';


 -- Do not treat unrelated unidentified species as one morph family.
 with profiles as (
  select lower(regexp_replace(trim(coalesce(s.record->>'scientificName','')),'\s+',' ','g')) as taxon,
   lower(trim(coalesce(s.record->>'morph',''))) as morph
  from public.member_species_collection c join public.species_records s on s.id=c.species_id
  where c.user_id=p_user_id and s.record->>'kind'='species'
 ), groups as (
  select taxon,count(distinct morph) filter(where morph<>'') as morphs
  from profiles
  where taxon ~ '^[a-z]+( (cf[.]|aff[.]))? [a-z][a-z-]+$'
     or taxon ~ '^[a-z]+ sp[.] .+'
  group by taxon
 )
 select coalesce(max(morphs),0),count(*) filter(where morphs>=2),
 count(*) filter(where taxon ~ '^[a-z]+( (cf[.]|aff[.]))? [a-z][a-z-]+$')
 into v_max_morphs,v_morph_sets,v_named_species from groups;

 for rule in select * from (values
 ('collection_springtail_1',15,v_springtails>=1),
 ('collection_springtail_3',25,v_springtails>=3),
 ('collection_springtail_5',40,v_springtails>=5),
 ('collection_springtail_10',75,v_springtails>=10),
 ('collection_springtail_20',125,v_springtails>=20),
 ('collection_genera_3',35,v_genera>=3),
 ('collection_genera_5',60,v_genera>=5),
 ('collection_seventy_five_species',300,v_total>=75),
 ('collection_one_hundred_species',400,v_total>=100),
 ('collection_both_groups',25,v_springtails>0 and v_isopods>0)
,
 ('collection_genera_10',125,v_genera>=10),
 ('collection_genera_15',175,v_genera>=15),
 ('collection_morphs_2',25,v_max_morphs>=2),
 ('collection_morphs_3',40,v_max_morphs>=3),
 ('collection_morphs_5',75,v_max_morphs>=5),
 ('collection_morphs_10',125,v_max_morphs>=10),
 ('collection_morph_sets_2',40,v_morph_sets>=2),
 ('collection_morph_sets_3',60,v_morph_sets>=3),
 ('collection_morph_sets_5',100,v_morph_sets>=5),
 ('collection_species_diversity_10',75,v_named_species>=10),
 ('collection_species_diversity_25',175,v_named_species>=25),
 ('collection_species_diversity_50',250,v_named_species>=50)
 ) as rules(key,points,eligible)
 union all
 select 'collection_'||g.genus||'_'||tier.target,tier.points,g.profiles>=tier.target
 from (
  select lower(trim(s.record->>'genus')) as genus,
   count(distinct coalesce(nullif(lower(trim(s.record->>'scientificName')), ''),s.id)||':'||lower(trim(coalesce(s.record->>'morph','')))) as profiles
  from public.member_species_collection c join public.species_records s on s.id=c.species_id
  where c.user_id=p_user_id and s.record->>'kind'='species'
   and lower(trim(s.record->>'genus')) ~ '^[a-z]+$'
  group by lower(trim(s.record->>'genus'))
 ) g cross join (values(1,15),(3,25),(5,40),(10,75),(20,125)) as tier(target,points)
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
