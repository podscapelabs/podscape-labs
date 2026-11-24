create table public.member_species_wishlist (
 user_id uuid not null references auth.users(id) on delete cascade,
 species_id text not null references public.species_records(id) on delete cascade,
 added_at timestamptz not null default now(),
 primary key(user_id,species_id)
);
create index member_species_wishlist_species_idx on public.member_species_wishlist(species_id);
alter table public.member_species_wishlist enable row level security;
revoke all on public.member_species_wishlist from public,anon,authenticated;
grant select,insert,delete on public.member_species_wishlist to authenticated;
create policy wishlist_read on public.member_species_wishlist for select to authenticated using ((select auth.uid())=user_id);
create policy wishlist_add on public.member_species_wishlist for insert to authenticated with check ((select auth.uid())=user_id and public.is_collectible_species(species_id) and not exists (select 1 from public.member_species_collection c where c.user_id=(select auth.uid()) and c.species_id=member_species_wishlist.species_id));
create policy wishlist_remove on public.member_species_wishlist for delete to authenticated using ((select auth.uid())=user_id);
create function public.clear_collected_species_wishlist() returns trigger language plpgsql security invoker set search_path='' as $$ begin delete from public.member_species_wishlist where user_id=new.user_id and species_id=new.species_id; return new; end; $$;
revoke execute on function public.clear_collected_species_wishlist() from public,anon,authenticated;
create trigger clear_collected_species_wishlist after insert on public.member_species_collection for each row execute function public.clear_collected_species_wishlist();
