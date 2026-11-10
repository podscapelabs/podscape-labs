-- AUDIT ONLY: run these queries against production read-only.
-- Report aggregated counts, not user identifiers or private row contents.
-- Every orphan / cross-owner count should equal 0.
-- Do not turn these into UPDATE/DELETE statements.

-- Keeper enclosure -> species collection references.
select count(*) as enclosures,
       count(*) filter(where c.user_id is null) as missing_owner,
       count(*) filter(where s.user_id is null) as absent_species_membership
from public.keeper_enclosures c
left join public.member_species_collection s
  on s.user_id=c.user_id and s.species_id=c.species_id;

-- Care log -> enclosure ownership (RLS policies must also be checked separately).
select count(*) as events,
       count(*) filter(where e.id is null) as orphan_events,
       count(*) filter(where a.user_id<>e.user_id) as cross_owner_events
from public.keeper_events e
left join public.keeper_enclosures a on a.id=e.enclosure_id;

-- Shop foreign key references.
select count(*) as variants,
       count(*) filter(where p.id is null) as orphan_variants
from public.shop_product_variants v
left join public.shop_products p on p.id=v.product_id;

select count(*) as images,
       count(*) filter(where p.id is null) as orphan_images
from public.shop_product_images i
left join public.shop_products p on p.id=i.product_id;

select count(*) as adjustments,
       count(*) filter(where v.id is null) as orphan_adjustments
from public.shop_inventory_adjustments a
left join public.shop_product_variants v on v.id=a.variant_id;

-- Membership-linked records.
select count(*) as preferences,
       count(*) filter(where u.id is null) as orphan_preferences
from public.member_ui_preferences p left join auth.users u on u.id=p.user_id;

select count(*) as collection_items,
       count(*) filter(where u.id is null) as orphan_collection_items
from public.member_species_collection m left join auth.users u on u.id=m.user_id;

select count(*) as vendors,
       count(*) filter(where u.id is null) as orphan_vendors
from public.vendor_profiles v left join auth.users u on u.id=v.user_id;

-- Authorization posture: never assume RLS enablement means policies are correct.
select c.relname as table_name,c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as policy_count
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' order by c.relname;

-- Identify unbounded storage policies that may modify objects.
select policyname,cmd,roles::text,qual,with_check
from pg_policies
where schemaname='storage' and tablename='objects' and cmd in ('UPDATE','ALL')
order by policyname;

-- Keep elevated grants visible during any review.
select n.nspname as schema_name,c.relname as table_name,
       has_table_privilege('anon',c.oid,'TRUNCATE') as anon_can_truncate,
       has_table_privilege('authenticated',c.oid,'TRUNCATE') as member_can_truncate
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
and (has_table_privilege('anon',c.oid,'TRUNCATE')
  or has_table_privilege('authenticated',c.oid,'TRUNCATE'))
order by table_name;
