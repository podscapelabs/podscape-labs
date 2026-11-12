create table public.species_requests (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 2 and 120),
 created_by uuid references auth.users(id) on delete set null,
 handled boolean not null default false,
 created_at timestamptz not null default now()
);
create index species_requests_creator_date_idx on public.species_requests(created_by,created_at);
alter table public.species_requests enable row level security;
revoke all on public.species_requests from anon,authenticated;
grant all on public.species_requests to service_role;

-- Called only by the application server after verifying the requesting member.
create function public.submit_species_request(p_user_id uuid,p_name text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare request_id uuid;
begin
 if p_user_id is null or p_name is null or char_length(trim(p_name)) not between 2 and 120
 then raise exception 'Invalid species request'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text||':species-requests',0));
 select id into request_id from public.species_requests
 where created_by=p_user_id and lower(name)=lower(trim(p_name)) and not handled limit 1;
 if request_id is not null then return request_id; end if;
 if (select count(*) from public.species_requests where created_by=p_user_id and created_at>now()-interval '24 hours')>=5
 then raise exception 'Daily species request limit reached'; end if;
 insert into public.species_requests(name,created_by) values(trim(p_name),p_user_id) returning id into request_id;
 return request_id;
end;
$$;
revoke all on function public.submit_species_request(uuid,text) from public,anon,authenticated;
grant execute on function public.submit_species_request(uuid,text) to service_role;
