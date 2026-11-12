-- Collection bookmarks and physical enclosures are separate actions.
-- Never create an enclosure automatically when a member saves a species.
drop trigger if exists create_primary_keeper_colony_after_insert on public.member_species_collection;
drop trigger if exists create_primary_keeper_enclosure_after_insert on public.member_species_collection;

-- Keep all existing bins and care events. Prevent removing a collection entry
-- while ANY associated bin (including archived bins) still exists.
alter table public.keeper_enclosures
 drop constraint if exists keeper_enclosures_member_species_fkey;
alter table public.keeper_enclosures
 add constraint keeper_enclosures_member_species_fkey
 foreign key (user_id,species_id)
 references public.member_species_collection(user_id,species_id)
 on delete restrict;
