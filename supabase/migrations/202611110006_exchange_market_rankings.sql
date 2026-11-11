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

-- Existing beta portfolios may request human review without resetting balances.
create table if not exists public.member_exchange_ranking_reviews (
 user_id uuid primary key references auth.users(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','approved','declined')),
 requested_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewer_note text not null default '' check (char_length(reviewer_note)<=500)
);
alter table public.member_exchange_ranking_reviews enable row level security;
revoke all on public.member_exchange_ranking_reviews from anon, authenticated;
comment on table public.member_exchange_ranking_reviews is
 'Manual market ranking eligibility review for pre-existing or imported beta wallets; does not mutate cash or holdings.';

-- Owner action is called with service credentials only, after the server has
-- verified an authenticated owner and re-run the trade-ledger audit.
create or replace function public.review_member_exchange_ranking_request(
 p_user_id uuid,p_approve boolean,p_note text default ''
) returns boolean language plpgsql security definer set search_path=''
as $$
declare v_status text;
begin
 if p_user_id is null or p_approve is null or char_length(coalesce(p_note,''))>500
 then raise exception 'Invalid owner review'; end if;
 select status into v_status from public.member_exchange_ranking_reviews
  where user_id=p_user_id for update;
 if v_status is distinct from 'pending' then raise exception 'Request is not pending'; end if;
 if p_approve then
  perform 1 from public.member_exchange_portfolios where user_id=p_user_id;
  if not found then raise exception 'Wallet not found'; end if;
  insert into public.member_exchange_ranking_preferences
   (user_id,public_enabled,eligible,verified_at,updated_at)
   values(p_user_id,false,true,now(),now())
   on conflict(user_id) do update set eligible=true,
    public_enabled=false,verified_at=now(),updated_at=now();
 end if;
 update public.member_exchange_ranking_reviews
 set status=case when p_approve then 'approved' else 'declined' end,
  reviewer_note=coalesce(p_note,''),reviewed_at=now()
 where user_id=p_user_id;
 return true;
end;
$$;
revoke all on function public.review_member_exchange_ranking_request(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.review_member_exchange_ranking_request(uuid,boolean,text) to service_role;
