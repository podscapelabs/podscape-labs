-- Each achievement belongs to one member and can only be unlocked once.
create table if not exists public.member_achievements (
 user_id uuid not null references auth.users(id) on delete cascade,
 achievement_key text not null,
 unlocked_at timestamptz not null default now(),
 constraint member_achievements_pkey primary key (user_id, achievement_key)
);
create index if not exists member_achievements_recent_idx
 on public.member_achievements(user_id, unlocked_at desc);
alter table public.member_achievements enable row level security;
revoke all on public.member_achievements from public, anon, authenticated;
grant select on public.member_achievements to authenticated;
drop policy if exists "Members read own achievements" on public.member_achievements;
create policy "Members read own achievements"
 on public.member_achievements for select to authenticated
 using ((select auth.uid()) = user_id);
-- Award achievements and associated currency from trusted server logic in one
-- transaction: insert (user_id,achievement_key) ON CONFLICT DO NOTHING,
-- and credit EXP/coins only when that insert returns a row.
-- The existing member_progress_events unique(user_id,event_key) adds another
-- layer of idempotency; use event_key = 'achievement:' || achievement_key.
