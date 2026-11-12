-- Feedback belongs to the signed-in member; owner reviews through service-role only.
create table if not exists public.member_feedback (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 category text not null check (category in ('bug','idea','general')),
 message text not null check (char_length(message) between 10 and 2000),
 page_path text not null default '',
 device_info text not null default '',
 status text not null default 'new' check (status in ('new','reviewing','resolved')),
 owner_note text not null default '' check (char_length(owner_note) <= 1000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists member_feedback_user_created_idx on public.member_feedback(user_id,created_at desc);
create index if not exists member_feedback_status_created_idx on public.member_feedback(status,created_at desc);
alter table public.member_feedback enable row level security;
-- No direct public/member table access: authenticated API verifies account and writes via service role.
revoke all on public.member_feedback from anon,authenticated;
