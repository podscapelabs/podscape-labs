-- Retire legacy secondary-currency minting without deleting historical records.
-- Preserve existing progress columns and ledger rows for audit/compatibility.
-- This function continues granting the Field Observer achievement and its 50 EXP.
create or replace function public.record_species_discovery(p_user_id uuid,p_species_id text)
returns table(view_count bigint,achievement_unlocked boolean)
language plpgsql security definer set search_path=''
as $$
declare n bigint; unlocked boolean := false;
begin
 if p_user_id is null or p_species_id is null then raise exception 'Invalid discovery'; end if;
 if not exists(select 1 from auth.users where id=p_user_id) then raise exception 'Unknown member'; end if;
 if not exists(select 1 from public.species_records where id=p_species_id and record->>'kind'='species' and coalesce(record->>'archivedAt','')='') then raise exception 'Unknown species'; end if;
 insert into public.member_species_views(user_id,species_id) values(p_user_id,p_species_id) on conflict do nothing;
 perform 1 from auth.users where id=p_user_id for update;
 select count(*) into n from public.member_species_views where user_id=p_user_id;
 if n>=5 then
  insert into public.member_achievements(user_id,achievement_key)
  values(p_user_id,'ledger_five_species') on conflict do nothing;
  unlocked:=found;
  if unlocked then
   insert into public.member_progress_events(user_id,event_key,source,exp_delta,coin_delta)
   values(p_user_id,'achievement:ledger_five_species','achievement',50,0)
   on conflict do nothing;
   if found then
    insert into public.member_progress(user_id,total_exp)
    values(p_user_id,50)
    on conflict(user_id) do update
    set total_exp=public.member_progress.total_exp+50,updated_at=now();
   end if;
  end if;
 end if;
 return query select n,unlocked;
end;
$$;

comment on function public.record_species_discovery(uuid,text) is
 'Records discoveries and grants the one-time Field Observer achievement and 50 EXP without secondary currency.';
