-- Platform-wide member progression. No client-writable balances or event awards.
create table if not exists public.member_progress (
 user_id uuid primary key references auth.users(id) on delete cascade,
 total_exp bigint not null default 0 check (total_exp >= 0),
 pod_coins bigint not null default 0 check (pod_coins >= 0),
 updated_at timestamptz not null default now()
);
create table if not exists public.member_progress_events (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 event_key text not null,
 source text not null,
 exp_delta integer not null default 0 check (exp_delta >= 0),
 coin_delta integer not null default 0 check (coin_delta >= 0),
 created_at timestamptz not null default now(),
 unique (user_id,event_key)
);
create index if not exists member_progress_events_recent on public.member_progress_events(user_id,created_at desc);
alter table public.member_progress enable row level security;
alter table public.member_progress_events enable row level security;
revoke all on public.member_progress from public,anon,authenticated;
revoke all on public.member_progress_events from public,anon,authenticated;
grant select on public.member_progress to authenticated;
grant select on public.member_progress_events to authenticated;
create policy "Read own progress" on public.member_progress for select to authenticated using ((select auth.uid())=user_id);
create policy "Read own progress events" on public.member_progress_events for select to authenticated using ((select auth.uid())=user_id);
-- Awarding must be handled by trusted server logic with deduplication and audit trail.
