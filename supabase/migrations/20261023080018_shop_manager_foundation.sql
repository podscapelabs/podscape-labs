-- Podscape Shop Manager foundation.
-- This migration is additive: the legacy product_records table remains the
-- compatibility source for the current storefront while products are moved
-- into normalized inventory records.

create or replace function public.is_podscape_owner()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'owner';
$$;

revoke all on function public.is_podscape_owner() from public, anon;
grant execute on function public.is_podscape_owner() to authenticated;

create table if not exists public.shop_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_categories_name_check check (char_length(trim(name)) between 1 and 80),
  constraint shop_categories_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint shop_categories_description_check check (char_length(description) <= 1000)
);

insert into public.shop_categories (name, slug, sort_order)
values
  ('Isopods & Springtails', 'isopods-springtails', 10),
  ('Field Tools', 'field-tools', 20),
  ('Books & Journals', 'books-journals', 30),
  ('Habitat Supplies', 'habitat-supplies', 40),
  ('Apparel', 'apparel', 50),
  ('Prints & Collectibles', 'prints-collectibles', 60),
  ('Other', 'other', 70)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  legacy_product_id text unique,
  slug text not null unique,
  title text not null,
  category_id uuid references public.shop_categories(id) on delete set null,
  species_record_id text references public.species_records(id) on delete set null,
  short_description text not null default '',
  description text not null default '',
  product_type text not null default 'physical',
  status text not null default 'draft',
  availability text not null default 'coming-soon',
  currency text not null default 'CAD',
  featured boolean not null default false,
  allow_backorders boolean not null default false,
  requires_shipping boolean not null default true,
  weight_grams numeric(10,2),
  tags text[] not null default '{}',
  materials text not null default '',
  shipping_note text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_products_title_check check (char_length(trim(title)) between 1 and 180),
  constraint shop_products_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint shop_products_short_description_check check (char_length(short_description) <= 600),
  constraint shop_products_description_check check (char_length(description) <= 12000),
  constraint shop_products_type_check check (product_type in ('physical', 'digital')),
  constraint shop_products_status_check check (status in ('draft', 'published', 'archived')),
  constraint shop_products_availability_check check (availability in ('coming-soon', 'in-stock', 'sold-out')),
  constraint shop_products_currency_check check (currency = 'CAD'),
  constraint shop_products_weight_check check (weight_grams is null or weight_grams >= 0),
  constraint shop_products_seo_title_check check (char_length(seo_title) <= 180),
  constraint shop_products_seo_description_check check (char_length(seo_description) <= 320)
);

create index if not exists shop_products_status_idx
  on public.shop_products (status, updated_at desc);
create index if not exists shop_products_category_idx
  on public.shop_products (category_id, status);
create index if not exists shop_products_species_idx
  on public.shop_products (species_record_id)
  where species_record_id is not null;

create table if not exists public.shop_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.shop_products(id) on delete cascade,
  title text not null default 'Default',
  sku text unique,
  price_cents integer not null default 0,
  compare_at_price_cents integer,
  inventory_tracked boolean not null default true,
  inventory_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_product_variants_title_check check (char_length(trim(title)) between 1 and 120),
  constraint shop_product_variants_sku_check check (sku is null or char_length(trim(sku)) between 1 and 100),
  constraint shop_product_variants_price_check check (price_cents >= 0),
  constraint shop_product_variants_compare_price_check check (compare_at_price_cents is null or compare_at_price_cents >= 0),
  constraint shop_product_variants_inventory_check check (inventory_quantity >= 0),
  constraint shop_product_variants_threshold_check check (low_stock_threshold >= 0)
);

create index if not exists shop_product_variants_product_idx
  on public.shop_product_variants (product_id, sort_order);
create index if not exists shop_product_variants_low_stock_idx
  on public.shop_product_variants (inventory_quantity, low_stock_threshold)
  where inventory_tracked and is_active;

create table if not exists public.shop_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.shop_products(id) on delete cascade,
  storage_path text,
  public_url text not null,
  alt_text text not null default '',
  position_x numeric(5,2) not null default 50,
  position_y numeric(5,2) not null default 50,
  zoom numeric(4,2) not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint shop_product_images_url_check check (char_length(trim(public_url)) between 1 and 2000),
  constraint shop_product_images_alt_check check (char_length(alt_text) <= 240),
  constraint shop_product_images_position_x_check check (position_x between 0 and 100),
  constraint shop_product_images_position_y_check check (position_y between 0 and 100),
  constraint shop_product_images_zoom_check check (zoom between 1 and 3),
  constraint shop_product_images_unique_order unique (product_id, sort_order)
);

create index if not exists shop_product_images_product_idx
  on public.shop_product_images (product_id, sort_order);

create table if not exists public.shop_inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.shop_product_variants(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  quantity_delta integer not null,
  quantity_after integer not null,
  reason text not null default 'manual',
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint shop_inventory_adjustments_delta_check check (quantity_delta <> 0),
  constraint shop_inventory_adjustments_quantity_check check (quantity_after >= 0),
  constraint shop_inventory_adjustments_reason_check check (reason in ('initial', 'manual', 'sale', 'return', 'damage', 'correction')),
  constraint shop_inventory_adjustments_note_check check (char_length(note) <= 1000)
);

create index if not exists shop_inventory_adjustments_variant_idx
  on public.shop_inventory_adjustments (variant_id, created_at desc);

create or replace function public.touch_shop_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.touch_shop_updated_at() from public, anon, authenticated;

drop trigger if exists shop_categories_touch_updated_at on public.shop_categories;
create trigger shop_categories_touch_updated_at
before update on public.shop_categories
for each row execute function public.touch_shop_updated_at();

drop trigger if exists shop_products_touch_updated_at on public.shop_products;
create trigger shop_products_touch_updated_at
before update on public.shop_products
for each row execute function public.touch_shop_updated_at();

drop trigger if exists shop_product_variants_touch_updated_at on public.shop_product_variants;
create trigger shop_product_variants_touch_updated_at
before update on public.shop_product_variants
for each row execute function public.touch_shop_updated_at();

-- Preserve existing Product Desk records in the new normalized catalogue.
insert into public.shop_products (
  legacy_product_id, slug, title, category_id, short_description,
  description, status, availability, currency, featured, tags, materials,
  shipping_note, archived_at, updated_at
)
select
  legacy.id,
  legacy.slug,
  coalesce(nullif(trim(legacy.record->>'title'), ''), 'Untitled product'),
  category.id,
  coalesce(legacy.record->>'summary', ''),
  coalesce(legacy.record->>'description', ''),
  case
    when nullif(legacy.record->>'archivedAt', '') is not null then 'archived'
    when legacy.record->>'status' = 'published' then 'published'
    else 'draft'
  end,
  case
    when legacy.record->>'availability' in ('coming-soon', 'in-stock', 'sold-out') then legacy.record->>'availability'
    else 'coming-soon'
  end,
  'CAD',
  coalesce((legacy.record->>'featured')::boolean, false),
  case when jsonb_typeof(legacy.record->'tags') = 'array'
    then array(select jsonb_array_elements_text(legacy.record->'tags'))
    else '{}'::text[]
  end,
  coalesce(legacy.record->>'materials', ''),
  coalesce(legacy.record->>'shippingNote', ''),
  nullif(legacy.record->>'archivedAt', '')::timestamptz,
  legacy.updated_at
from public.product_records legacy
left join public.shop_categories category
  on category.name = legacy.record->>'category'
on conflict (legacy_product_id) do nothing;

insert into public.shop_product_variants (
  product_id, title, price_cents, inventory_tracked, inventory_quantity,
  low_stock_threshold, sort_order
)
select
  product.id,
  'Default',
  case
    when legacy.record->>'priceCents' ~ '^\d+$' then (legacy.record->>'priceCents')::integer
    else 0
  end,
  coalesce((legacy.record->>'stockQuantity') ~ '^\d+$', false),
  case when legacy.record->>'stockQuantity' ~ '^\d+$' then (legacy.record->>'stockQuantity')::integer else 0 end,
  case when legacy.record->>'lowStockThreshold' ~ '^\d+$' then (legacy.record->>'lowStockThreshold')::integer else 5 end,
  0
from public.shop_products product
join public.product_records legacy on legacy.id = product.legacy_product_id
where not exists (
  select 1 from public.shop_product_variants variant where variant.product_id = product.id
);

insert into public.shop_product_images (
  product_id, public_url, alt_text, position_x, position_y, zoom, sort_order
)
select
  product.id,
  legacy.record->>'image',
  coalesce(legacy.record->>'imageAlt', ''),
  case when legacy.record->>'imagePositionX' ~ '^\d+(\.\d+)?$' then (legacy.record->>'imagePositionX')::numeric else 50 end,
  case when legacy.record->>'imagePositionY' ~ '^\d+(\.\d+)?$' then (legacy.record->>'imagePositionY')::numeric else 50 end,
  case when legacy.record->>'imageZoom' ~ '^\d+(\.\d+)?$' then (legacy.record->>'imageZoom')::numeric else 1 end,
  0
from public.shop_products product
join public.product_records legacy on legacy.id = product.legacy_product_id
where coalesce(legacy.record->>'image', '') <> ''
  and not exists (
    select 1 from public.shop_product_images image where image.product_id = product.id
  );

-- Establish a visible baseline for legacy inventory so future adjustments
-- have a useful history rather than appearing to start from zero.
insert into public.shop_inventory_adjustments (
  variant_id, quantity_delta, quantity_after, reason, note
)
select
  variant.id,
  variant.inventory_quantity,
  variant.inventory_quantity,
  'initial',
  'Inventory imported from the existing Product Desk record.'
from public.shop_product_variants variant
where variant.inventory_tracked
  and variant.inventory_quantity > 0
  and not exists (
    select 1
    from public.shop_inventory_adjustments adjustment
    where adjustment.variant_id = variant.id
  );

-- Keep the legacy storefront record and normalized shop-management data in
-- sync as one database transaction. This function is callable only by the
-- server-side service role; the app authenticates the owner before calling it.
create or replace function public.sync_shop_manager_product(
  p_record jsonb,
  p_variants jsonb,
  p_adjustment_reason text default 'manual',
  p_adjustment_note text default ''
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_product_id uuid;
  v_category_id uuid;
  v_input jsonb;
  v_variant_id uuid;
  v_old_quantity integer;
  v_old_tracked boolean;
  v_new_quantity integer;
  v_new_tracked boolean;
  v_created boolean;
begin
  if jsonb_typeof(p_record) <> 'object' then
    raise exception 'Product record must be a JSON object.';
  end if;
  if jsonb_typeof(p_variants) <> 'array' then
    raise exception 'Product variants must be a JSON array.';
  end if;
  if coalesce(p_adjustment_reason, 'manual') not in ('manual', 'return', 'damage', 'correction') then
    raise exception 'Invalid inventory adjustment reason.';
  end if;

  select category.id into v_category_id
  from public.shop_categories category
  where category.name = p_record->>'category'
  limit 1;

  insert into public.product_records (id, slug, record, updated_at)
  values (
    p_record->>'id',
    p_record->>'slug',
    p_record,
    coalesce(nullif(p_record->>'updatedAt', '')::timestamptz, now())
  )
  on conflict (id) do update
  set slug = excluded.slug,
      record = excluded.record,
      updated_at = excluded.updated_at;

  insert into public.shop_products (
    legacy_product_id, slug, title, category_id, species_record_id,
    short_description, description, product_type, status, availability,
    currency, featured, allow_backorders, requires_shipping, weight_grams,
    tags, materials, shipping_note, seo_title, seo_description,
    published_at, archived_at, updated_at
  ) values (
    p_record->>'id',
    p_record->>'slug',
    coalesce(nullif(trim(p_record->>'title'), ''), 'Untitled product'),
    v_category_id,
    nullif(p_record->>'speciesRecordId', ''),
    coalesce(p_record->>'summary', ''),
    coalesce(p_record->>'description', ''),
    case when p_record->>'productType' = 'digital' then 'digital' else 'physical' end,
    case when p_record->>'archivedAt' is not null then 'archived'
         when p_record->>'status' = 'published' then 'published' else 'draft' end,
    case when p_record->>'availability' in ('coming-soon', 'in-stock', 'sold-out')
         then p_record->>'availability' else 'coming-soon' end,
    'CAD',
    coalesce((p_record->>'featured')::boolean, false),
    coalesce((p_record->>'allowBackorders')::boolean, false),
    coalesce((p_record->>'requiresShipping')::boolean, true),
    nullif(p_record->>'weightGrams', '')::numeric,
    case when jsonb_typeof(p_record->'tags') = 'array'
         then array(select jsonb_array_elements_text(p_record->'tags'))
         else '{}'::text[] end,
    coalesce(p_record->>'materials', ''),
    coalesce(p_record->>'shippingNote', ''),
    coalesce(p_record->>'seoTitle', ''),
    coalesce(p_record->>'seoDescription', ''),
    case when p_record->>'status' = 'published'
         then coalesce(nullif(p_record->>'publishedAt', '')::timestamptz, now())
         else null end,
    nullif(p_record->>'archivedAt', '')::timestamptz,
    coalesce(nullif(p_record->>'updatedAt', '')::timestamptz, now())
  )
  on conflict (legacy_product_id) do update
  set slug = excluded.slug,
      title = excluded.title,
      category_id = excluded.category_id,
      species_record_id = excluded.species_record_id,
      short_description = excluded.short_description,
      description = excluded.description,
      product_type = excluded.product_type,
      status = excluded.status,
      availability = excluded.availability,
      featured = excluded.featured,
      allow_backorders = excluded.allow_backorders,
      requires_shipping = excluded.requires_shipping,
      weight_grams = excluded.weight_grams,
      tags = excluded.tags,
      materials = excluded.materials,
      shipping_note = excluded.shipping_note,
      seo_title = excluded.seo_title,
      seo_description = excluded.seo_description,
      published_at = coalesce(public.shop_products.published_at, excluded.published_at),
      archived_at = excluded.archived_at,
      updated_at = excluded.updated_at
  returning id into v_product_id;

  for v_input in select value from jsonb_array_elements(p_variants)
  loop
    v_variant_id := nullif(v_input->>'id', '')::uuid;
    v_new_quantity := greatest(0, coalesce((v_input->>'inventoryQuantity')::integer, 0));
    v_new_tracked := coalesce((v_input->>'inventoryTracked')::boolean, true);
    v_created := false;

    if v_variant_id is not null then
      select variant.inventory_quantity, variant.inventory_tracked
      into v_old_quantity, v_old_tracked
      from public.shop_product_variants variant
      where variant.id = v_variant_id and variant.product_id = v_product_id
      for update;
      v_created := not found;
    else
      v_created := true;
    end if;

    if v_created then
      v_variant_id := coalesce(v_variant_id, gen_random_uuid());
      insert into public.shop_product_variants (
        id, product_id, title, sku, price_cents, compare_at_price_cents,
        inventory_tracked, inventory_quantity, low_stock_threshold, is_active, sort_order
      ) values (
        v_variant_id,
        v_product_id,
        coalesce(nullif(trim(v_input->>'title'), ''), 'Default'),
        nullif(trim(v_input->>'sku'), ''),
        greatest(0, coalesce((v_input->>'priceCents')::integer, 0)),
        nullif(v_input->>'compareAtPriceCents', '')::integer,
        v_new_tracked,
        v_new_quantity,
        greatest(0, coalesce((v_input->>'lowStockThreshold')::integer, 5)),
        coalesce((v_input->>'isActive')::boolean, true),
        greatest(0, coalesce((v_input->>'sortOrder')::integer, 0))
      );
      if v_new_tracked and v_new_quantity > 0 then
        insert into public.shop_inventory_adjustments (
          variant_id, quantity_delta, quantity_after, reason, note
        ) values (
          v_variant_id, v_new_quantity, v_new_quantity, 'initial',
          'Initial inventory entered in Shop Manager.'
        );
      end if;
    else
      update public.shop_product_variants
      set title = coalesce(nullif(trim(v_input->>'title'), ''), 'Default'),
          sku = nullif(trim(v_input->>'sku'), ''),
          price_cents = greatest(0, coalesce((v_input->>'priceCents')::integer, 0)),
          compare_at_price_cents = nullif(v_input->>'compareAtPriceCents', '')::integer,
          inventory_tracked = v_new_tracked,
          inventory_quantity = v_new_quantity,
          low_stock_threshold = greatest(0, coalesce((v_input->>'lowStockThreshold')::integer, 5)),
          is_active = coalesce((v_input->>'isActive')::boolean, true),
          sort_order = greatest(0, coalesce((v_input->>'sortOrder')::integer, 0))
      where id = v_variant_id and product_id = v_product_id;

      if v_new_tracked and v_old_tracked and v_new_quantity <> v_old_quantity then
        insert into public.shop_inventory_adjustments (
          variant_id, actor_user_id, quantity_delta, quantity_after, reason, note
        ) values (
          v_variant_id, auth.uid(), v_new_quantity - v_old_quantity, v_new_quantity,
          coalesce(p_adjustment_reason, 'manual'), left(coalesce(p_adjustment_note, ''), 1000)
        );
      elsif v_new_tracked and not v_old_tracked and v_new_quantity > 0 then
        insert into public.shop_inventory_adjustments (
          variant_id, actor_user_id, quantity_delta, quantity_after, reason, note
        ) values (
          v_variant_id, auth.uid(), v_new_quantity, v_new_quantity,
          'initial', 'Inventory tracking enabled in Shop Manager.'
        );
      end if;
    end if;
  end loop;

  if nullif(p_record->>'image', '') is null then
    delete from public.shop_product_images where product_id = v_product_id;
  else
    insert into public.shop_product_images (
      product_id, public_url, alt_text, position_x, position_y, zoom, sort_order
    ) values (
      v_product_id,
      p_record->>'image',
      coalesce(p_record->>'imageAlt', ''),
      greatest(0, least(100, coalesce(nullif(p_record->>'imagePositionX', '')::numeric, 50))),
      greatest(0, least(100, coalesce(nullif(p_record->>'imagePositionY', '')::numeric, 50))),
      greatest(1, least(3, coalesce(nullif(p_record->>'imageZoom', '')::numeric, 1))),
      0
    )
    on conflict (product_id, sort_order) do update
    set public_url = excluded.public_url,
        alt_text = excluded.alt_text,
        position_x = excluded.position_x,
        position_y = excluded.position_y,
        zoom = excluded.zoom;
  end if;
end;
$$;

revoke all on function public.sync_shop_manager_product(jsonb, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.sync_shop_manager_product(jsonb, jsonb, text, text) to service_role;

-- The owner account is the only authenticated role permitted to manage shop
-- data. Public storefront reads continue through the existing server layer.
alter table public.shop_categories enable row level security;
alter table public.shop_products enable row level security;
alter table public.shop_product_variants enable row level security;
alter table public.shop_product_images enable row level security;
alter table public.shop_inventory_adjustments enable row level security;

revoke all on public.shop_categories from public, anon, authenticated;
revoke all on public.shop_products from public, anon, authenticated;
revoke all on public.shop_product_variants from public, anon, authenticated;
revoke all on public.shop_product_images from public, anon, authenticated;
revoke all on public.shop_inventory_adjustments from public, anon, authenticated;

grant select, insert, update, delete on public.shop_categories to authenticated;
grant select, insert, update, delete on public.shop_products to authenticated;
grant select, insert, update, delete on public.shop_product_variants to authenticated;
grant select, insert, update, delete on public.shop_product_images to authenticated;
grant select, insert, update, delete on public.shop_inventory_adjustments to authenticated;
grant select, insert, update, delete on public.shop_categories to service_role;
grant select, insert, update, delete on public.shop_products to service_role;
grant select, insert, update, delete on public.shop_product_variants to service_role;
grant select, insert, update, delete on public.shop_product_images to service_role;
grant select, insert, update, delete on public.shop_inventory_adjustments to service_role;

create policy "Owner manages shop categories"
  on public.shop_categories for all to authenticated
  using ((select public.is_podscape_owner()))
  with check ((select public.is_podscape_owner()));
create policy "Owner manages shop products"
  on public.shop_products for all to authenticated
  using ((select public.is_podscape_owner()))
  with check ((select public.is_podscape_owner()));
create policy "Owner manages shop variants"
  on public.shop_product_variants for all to authenticated
  using ((select public.is_podscape_owner()))
  with check ((select public.is_podscape_owner()));
create policy "Owner manages shop images"
  on public.shop_product_images for all to authenticated
  using ((select public.is_podscape_owner()))
  with check ((select public.is_podscape_owner()));
create policy "Owner manages inventory adjustments"
  on public.shop_inventory_adjustments for all to authenticated
  using ((select public.is_podscape_owner()))
  with check ((select public.is_podscape_owner()));

update storage.buckets
set public = true,
    file_size_limit = 12582912,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-photos';

drop policy if exists "Owner uploads product photographs" on storage.objects;
create policy "Owner uploads product photographs"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-photos' and (select public.is_podscape_owner()));

drop policy if exists "Owner updates product photographs" on storage.objects;
create policy "Owner updates product photographs"
on storage.objects for update to authenticated
using (bucket_id = 'product-photos' and (select public.is_podscape_owner()))
with check (bucket_id = 'product-photos' and (select public.is_podscape_owner()));

drop policy if exists "Owner deletes product photographs" on storage.objects;
create policy "Owner deletes product photographs"
on storage.objects for delete to authenticated
using (bucket_id = 'product-photos' and (select public.is_podscape_owner()));
