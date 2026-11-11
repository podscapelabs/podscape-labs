-- Pod Exchange Market Leaders.
-- All standings use server-owned portfolio records and deterministic server-side prices.
-- A legacy imported wallet is not considered verified for competitive rankings.
create table if not exists public.member_exchange_ranking_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_enabled boolean not null default false,
  eligible boolean not null default false,
  verified_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint exchange_verified_when_eligible check (not eligible or verified_at is not null)
);
alter table public.member_exchange_ranking_preferences enable row level security;
revoke all on public.member_exchange_ranking_preferences from anon, authenticated;
create index if not exists exchange_ranking_participating_idx
 on public.member_exchange_ranking_preferences (updated_at desc)
 where public_enabled and eligible;

-- Snapshots are captured once per UTC week by a server-authenticated cron.
-- No client can provide a baseline, price, growth percentage, or cash balance.
create table if not exists public.member_exchange_weekly_snapshots (
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 captured_at timestamptz not null default now(),
 market_cycle bigint not null,
 baseline_value numeric(18,2) not null check (baseline_value>=0),
 primary key (user_id, week_start)
);
alter table public.member_exchange_weekly_snapshots enable row level security;
revoke all on public.member_exchange_weekly_snapshots from anon, authenticated;
comment on table public.member_exchange_ranking_preferences is
 'Opt-in fictional market leaderboard. eligible is only granted for a clean server-initialized 10000 Duck Buck wallet; legacy imports need review.';
comment on table public.member_exchange_weekly_snapshots is
 'Immutable weekly market value baselines computed server-side after the Monday UTC boundary. Weekly return is available only after a recorded snapshot.';
