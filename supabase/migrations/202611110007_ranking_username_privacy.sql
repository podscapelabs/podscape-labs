-- Optional public-name privacy, independent of participation.
-- Existing members remain visible by name until they explicitly opt to hide it.
alter table public.fun_zone_ranking_preferences
 add column if not exists hide_username boolean not null default false;
alter table public.member_exp_ranking_preferences
 add column if not exists hide_username boolean not null default false;
alter table public.member_exchange_ranking_preferences
 add column if not exists hide_username boolean not null default false;
comment on column public.fun_zone_ranking_preferences.hide_username is
 'When true, public Arcade Rankings show Anonymous Keeper instead of the display name.';
comment on column public.member_exp_ranking_preferences.hide_username is
 'When true, public Lifetime EXP Rankings show Anonymous Keeper instead of the display name.';
comment on column public.member_exchange_ranking_preferences.hide_username is
 'When true, public Pod Exchange Rankings show Anonymous Investor instead of the display name.';
