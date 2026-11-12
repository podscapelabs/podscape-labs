begin;
do $test$
declare
 u uuid:=gen_random_uuid(); prefix text:='morph-regression-'||gen_random_uuid()::text;
 i integer; fixture_id text; g text; sci text; morph text; xp bigint;
begin
 insert into auth.users(id,email,aud,role,created_at,updated_at,raw_user_meta_data)
 values(u,u::text||'@example.invalid','authenticated','authenticated',now(),now(),jsonb_build_object('display_name','qa_'||left(replace(u::text,'-',''),20)));
 for i in 1..10 loop
  fixture_id:=prefix||'-'||i;
  g:=case when i<=5 then 'Troglodillo' when i<=8 then 'Porcellio' else 'Armadillidium' end;
  sci:=case when i<=5 then 'Troglodillo sp.' when i<=8 then 'Porcellio scaber' else 'Armadillidium vulgare' end;
  morph:=case i when 1 then 'Soil' when 2 then 'Green Spot' when 3 then 'Other' when 4 then 'Green Spot' when 5 then 'Soil' when 6 then 'Lava' when 7 then 'Dalmatian' when 8 then 'Calico' when 9 then 'Magic Potion' else 'Orange' end;
  insert into public.species_records(id,slug,record,updated_at) values(fixture_id,fixture_id,
   jsonb_build_object('id',fixture_id,'slug',fixture_id,'kind','species','status','published','tags','[]'::jsonb,'genus',g,'scientificName',sci,'morph',morph),now());
  insert into public.member_species_collection(user_id,species_id) values(u,fixture_id);
  if i=5 then
   if exists(select 1 from public.member_achievements where user_id=u and achievement_key in('collection_morphs_2','collection_troglodillo_5'))
   then raise exception 'Unidentified species or duplicate records inflated milestones'; end if;
   if not exists(select 1 from public.member_achievements where user_id=u and achievement_key='collection_troglodillo_3')
   then raise exception 'Troglodillo genus ladder missing'; end if;
  end if;
 end loop;
 if not exists(select 1 from public.member_achievements where user_id=u and achievement_key='collection_morphs_3')
 or not exists(select 1 from public.member_achievements where user_id=u and achievement_key='collection_morph_sets_2')
 or not exists(select 1 from public.member_achievements where user_id=u and achievement_key='collection_genera_3')
 then raise exception 'Morph or diversity milestones missing'; end if;
 select total_exp into xp from public.member_progress where user_id=u;
 if public.reconcile_member_collection_specialists(u)<>0 then raise exception 'Repeated award'; end if;
 delete from public.member_species_collection where user_id=u and species_id=prefix||'-10';
 insert into public.member_species_collection(user_id,species_id) values(u,prefix||'-10');
 if (select total_exp from public.member_progress where user_id=u)<>xp then raise exception 'Recollection farmed EXP'; end if;
 if exists(select 1 from public.keeper_enclosures where user_id=u) then raise exception 'Unexpected bin creation'; end if;
end;
$test$;
rollback;
