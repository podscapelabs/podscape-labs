-- PSX V3: additive, opt-in market history. DO NOT apply until release review.
-- Existing wallet, trade, rankings, historic quotes, EXP and active pricing remain unchanged.
-- Seed remains in PSX_V3_SECRET (server environment); never store the secret in public tables.

create table if not exists public.psx_market_versions (
 version text primary key check(version ~ '^psx-v[0-9]+[a-z0-9-]*$'),
 state text not null default 'testing' check(state in ('testing','active','retired')),
 cutover_cycle bigint not null check(cutover_cycle >= 1000000000),
 cutover_at timestamptz not null,
 opening_prices jsonb not null check(jsonb_typeof(opening_prices)='object'),
 seed_fingerprint text not null check(length(seed_fingerprint)=64),
 created_at timestamptz not null default now(),
 activated_at timestamptz,
 constraint psx_market_version_cycle_consistent check(
  cutover_cycle=1000000000+floor(extract(epoch from cutover_at)/60)::bigint
 ),
 constraint psx_activation_consistent check(state<>'active' or activated_at is not null)
);
-- At most one active V3 engine version. New releases require deliberate promotion.
create unique index if not exists psx_single_active_version
 on public.psx_market_versions(state) where state='active';
alter table public.psx_market_versions enable row level security;
revoke all on public.psx_market_versions from public,anon,authenticated;
-- No RLS SELECT policy: only service-role code can inspect the immutable cutover metadata.

create table if not exists public.psx_market_price_history (
 version text not null references public.psx_market_versions(version),
 market_cycle bigint not null check(market_cycle>=1000000000),
 minute_index integer not null check(minute_index>=0),
 symbol text not null check(symbol in ('MOO','PANDA','BLUE','TITAN','CLOWN','DUCK')),
 price numeric(16,2) not null check(price>0),
 observed_at timestamptz not null,
 created_at timestamptz not null default now(),
 primary key(version,minute_index,symbol),
 unique(version,market_cycle,symbol)
);
create index if not exists psx_market_price_history_symbol_window
 on public.psx_market_price_history(version,symbol,minute_index desc);
alter table public.psx_market_price_history enable row level security;
revoke all on public.psx_market_price_history from public,anon,authenticated;
-- History is served through a bounded, authenticated Next.js endpoint.

create table if not exists public.psx_market_event_history (
 version text not null references public.psx_market_versions(version),
 event_id text not null check(length(event_id) between 7 and 90),
 event_kind text not null check(event_kind in ('major','bulletin','rumour','resolution')),
 symbol text not null check(symbol in ('MOO','PANDA','BLUE','TITAN','CLOWN','DUCK')),
 headline text not null check(length(headline) between 2 and 300),
 details text not null default '' check(length(details)<=800),
 published_cycle bigint not null check(published_cycle>=1000000000),
 published_at timestamptz not null,
 related_event_id text,
 resolution text check(resolution in ('accurate','partial','false')),
 created_at timestamptz not null default now(),
 primary key(version,event_id)
);
create index if not exists psx_market_event_history_recent
 on public.psx_market_event_history(version,published_cycle desc);
alter table public.psx_market_event_history enable row level security;
revoke all on public.psx_market_event_history from public,anon,authenticated;

comment on table public.psx_market_versions is
 'PSX V3 opt-in version metadata. Never contain the private seed. Future UTC cutovers require explicit release approval.';
comment on table public.psx_market_price_history is
 'Immutable published quote history; no client writes, no retroactive historical repricing.';
comment on table public.psx_market_event_history is
 'Only released corporate stories and rumour resolutions. Never store unreleased events in this publicly named schema.';

-- Guard against accidental edits to earlier published history, including service-role mistakes.
create or replace function public.psx_reject_published_history_mutation()
returns trigger language plpgsql set search_path='' as $$
begin
 raise exception 'PSX published market history is immutable; create a new version instead';
end;
$$;
drop trigger if exists psx_price_history_immutable on public.psx_market_price_history;
create trigger psx_price_history_immutable before update or delete
 on public.psx_market_price_history for each row
 execute function public.psx_reject_published_history_mutation();
drop trigger if exists psx_event_history_immutable on public.psx_market_event_history;
create trigger psx_event_history_immutable before update or delete
 on public.psx_market_event_history for each row
 execute function public.psx_reject_published_history_mutation();

-- Guard release fingerprint, first quote anchors and clock from changing in place.
-- A new version is required to change any historical price-driving parameter.
create or replace function public.psx_guard_market_version_change()
returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then
  raise exception 'Cannot delete a PSX market version with historical prices';
 end if;
 if tg_op='INSERT' then
  if new.state='active' and new.cutover_at<=pg_catalog.now() then
   raise exception 'PSX activation must be scheduled before the future cutover';
  end if;
  return new;
 end if;
 if old.state<>'active' and new.state='active' and new.cutover_at<=pg_catalog.now() then
  raise exception 'Cannot activate a PSX market version after its cutover';
 end if;
 if new.version is distinct from old.version
   or new.cutover_cycle is distinct from old.cutover_cycle
   or new.cutover_at is distinct from old.cutover_at
   or new.opening_prices is distinct from old.opening_prices
   or new.seed_fingerprint is distinct from old.seed_fingerprint
   or new.created_at is distinct from old.created_at
 then raise exception 'PSX version pricing parameters are immutable'; end if;
 if old.state='retired' and new.state<>'retired' then
  raise exception 'Cannot reactivate an already retired PSX engine'; end if;
 if old.state='active' and new.state='testing' then
  raise exception 'An active PSX engine cannot revert to testing'; end if;
 return new;
end;
$$;
drop trigger if exists psx_version_pricing_immutable on public.psx_market_versions;
create trigger psx_version_pricing_immutable before insert or update or delete
 on public.psx_market_versions for each row
 execute function public.psx_guard_market_version_change();

-- Do not create initial active rows, set secrets, run catch-up jobs or alter any trading RPC here.
