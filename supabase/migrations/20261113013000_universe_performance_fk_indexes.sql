-- PodScape Universe Polish: targeted indexes for two foreign keys
-- flagged by the Supabase performance advisor.
-- No record changes, schema renames, permission grants or wallet mutations.
create index if not exists member_species_views_species_id_idx
 on public.member_species_views(species_id);
create index if not exists shop_inventory_adjustments_actor_user_id_idx
 on public.shop_inventory_adjustments(actor_user_id)
 where actor_user_id is not null;
-- Review and apply via normal migration deployment, after a staging EXPLAIN check.
