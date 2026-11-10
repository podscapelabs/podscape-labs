-- Global directory: separate verified origin from vendor-stated shipping eligibility.
-- Existing listings retain unknown values rather than implying delivery capabilities.
alter table public.vendor_profiles
 add column if not exists country_code text not null default '',
 add column if not exists shipping_mode text not null default 'not_specified',
 add column if not exists shipping_countries text[] not null default '{}'::text[],
 add column if not exists shipping_notes text not null default '',
 add column if not exists live_animal_shipping text not null default 'ask';
alter table public.vendor_profiles
 drop constraint if exists vendor_country_code_valid,
 drop constraint if exists vendor_shipping_mode_valid,
 drop constraint if exists vendor_shipping_countries_valid,
 drop constraint if exists vendor_shipping_notes_valid,
 drop constraint if exists vendor_live_shipping_valid;
alter table public.vendor_profiles
 add constraint vendor_country_code_valid check (country_code='' or country_code ~ '^[A-Z]{2}$'),
 add constraint vendor_shipping_mode_valid check (shipping_mode in ('not_specified','pickup_only','domestic','selected','worldwide')),
 add constraint vendor_shipping_countries_valid check (cardinality(shipping_countries)<=249 and array_to_string(shipping_countries,',') ~ '^[A-Z,]*$'),
 add constraint vendor_shipping_notes_valid check (char_length(shipping_notes)<=400),
 add constraint vendor_live_shipping_valid check (live_animal_shipping in ('ask','yes','no'));
create index if not exists vendor_profiles_origin_idx on public.vendor_profiles(country_code) where status='approved';
grant select (country_code,shipping_mode,shipping_countries,shipping_notes,live_animal_shipping) on public.vendor_profiles to anon,authenticated;
