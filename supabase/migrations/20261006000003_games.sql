-- 20261006000003_games.sql
-- ZyroBet Mini-Games, Deterministic Rewards, Daily Caps, Sessions & Scores

-- 1. Games catalog table
create table if not exists public.games (
  id text primary key,
  slug text unique not null,
  title text not null,
  category text not null,
  thumb_url text,
  is_new bool default false,
  is_hot bool default false,
  sort_order int default 0,
  enabled bool default true
);

-- Seed initial 9 skill games
insert into public.games (id, slug, title, category, thumb_url, is_new, is_hot, sort_order, enabled)
values
  ('memory-match', 'memory-matrix', 'Memory Matrix', 'puzzle', 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80', true, true, 1, true),
  ('game-2048', 'neon-2048', 'Neon 2048', 'puzzle', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', false, true, 2, true),
  ('tap-reaction', 'tap-reflex', 'Tap Reflex', 'arcade', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80', false, true, 3, true),
  ('word-sprint', 'word-sprint', 'Word Sprint', 'puzzle', 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=400&q=80', true, false, 4, true),
  ('quiz-rush', 'quiz-rush', 'Quiz Rush', 'quiz', 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=400&q=80', false, true, 5, true),
  ('cyber-runner', 'cyber-runner', 'Cyber Runner', 'arcade', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80', true, false, 6, true),
  ('color-flow', 'color-flow', 'Color Flow', 'puzzle', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80', false, false, 7, true),
  ('sound-match', 'sound-match', 'Echo Beat', 'arcade', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80', false, false, 8, true),
  ('target-sniper', 'target-sniper', 'Precision Tap', 'arcade', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80', false, false, 9, true)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  category = excluded.category,
  thumb_url = excluded.thumb_url,
  is_new = excluded.is_new,
  is_hot = excluded.is_hot,
  sort_order = excluded.sort_order,
  enabled = excluded.enabled;

-- 2. Game economy configuration per game
create table if not exists public.game_config (
  game_id text primary key references public.games(id) on delete cascade,
  per_session_max int not null check (per_session_max >= 0),
  score_divisor int not null check (score_divisor > 0),
  min_reward int not null check (min_reward >= 0),
  daily_cap int not null check (daily_cap >= 0),
  min_duration_ms int not null default 1000,
  max_session_age_s int not null default 7200
);

insert into public.game_config (game_id, per_session_max, score_divisor, min_reward, daily_cap, min_duration_ms, max_session_age_s)
values
  ('memory-match', 40, 25, 2, 120, 2500, 7200),
  ('game-2048', 50, 100, 2, 150, 3000, 7200),
  ('tap-reaction', 30, 100, 2, 90, 4000, 7200),
  ('word-sprint', 45, 50, 2, 130, 3000, 7200),
  ('quiz-rush', 50, 40, 2, 150, 3000, 7200),
  ('cyber-runner', 55, 60, 2, 160, 3000, 7200),
  ('color-flow', 35, 30, 2, 110, 2500, 7200),
  ('sound-match', 40, 40, 2, 120, 3000, 7200),
  ('target-sniper', 45, 50, 2, 140, 3000, 7200)
on conflict (game_id) do update set
  per_session_max = excluded.per_session_max,
  score_divisor = excluded.score_divisor,
  min_reward = excluded.min_reward,
  daily_cap = excluded.daily_cap,
  min_duration_ms = excluded.min_duration_ms,
  max_session_age_s = excluded.max_session_age_s;

-- 3. Global reward configuration (single-row table)
create table if not exists public.game_global_config (
  id int primary key default 1 check (id = 1),
  daily_cap int not null default 300
);

insert into public.game_global_config (id, daily_cap)
values (1, 300)
on conflict (id) do update set
  daily_cap = excluded.daily_cap;

-- 4. Game Sessions table
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null references public.games(id),
  difficulty text,
  seed bigint not null,
  status text not null check (status in ('active', 'finished', 'expired', 'rejected')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score int,
  duration_ms int,
  coins_awarded int not null default 0,
  reject_reason text,
  client_version text
);

create index if not exists idx_game_sessions_user_status on public.game_sessions (user_id, status);
create index if not exists idx_game_sessions_user_game_status on public.game_sessions (user_id, game_id, status);

-- 5. Verified Game Scores (non-practice)
create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null references public.games(id),
  difficulty text,
  score int not null,
  session_id uuid not null unique references public.game_sessions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_scores_leaderboard on public.game_scores (game_id, difficulty, score desc);
create index if not exists idx_game_scores_user_game on public.game_scores (user_id, game_id, difficulty);

-- 6. Game Daily Earnings table
create table if not exists public.game_daily_earnings (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  game_id text not null references public.games(id),
  coins int not null default 0,
  primary key (user_id, day, game_id)
);

-- 7. Best Score View
create or replace view public.v_game_best as
select
  user_id,
  game_id,
  difficulty,
  max(score) as best_score
from public.game_scores
group by user_id, game_id, difficulty;

-- 8. Enable RLS
alter table public.games enable row level security;
alter table public.game_config enable row level security;
alter table public.game_global_config enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_scores enable row level security;
alter table public.game_daily_earnings enable row level security;

-- Public/Authenticated read policies
create policy "games_select_all"
  on public.games
  for select
  using (true);

create policy "game_config_select_all"
  on public.game_config
  for select
  using (true);

create policy "game_global_config_select_all"
  on public.game_global_config
  for select
  using (true);

create policy "game_sessions_select_own"
  on public.game_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "game_scores_select_own"
  on public.game_scores
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "game_daily_earnings_select_own"
  on public.game_daily_earnings
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 9. finish_game_session function (SECURITY DEFINER, Service Role Only)
create or replace function public.finish_game_session(
  p_user uuid,
  p_session uuid,
  p_score int,
  p_duration_ms int,
  p_tz text,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_config record;
  v_global_cap int;
  v_today date;
  v_earned_today_game int := 0;
  v_earned_today_global int := 0;
  v_reward_raw int := 0;
  v_game_left int := 0;
  v_global_left int := 0;
  v_coins int := 0;
  v_prev_best int := 0;
  v_is_new_best bool := false;
  v_best_score int := 0;
  v_balance bigint := 0;
begin
  -- Advisory lock per user for serial execution of reward claims
  perform pg_advisory_xact_lock(hashtext(p_user::text));

  -- Lock session row
  select * into v_session
  from public.game_sessions
  where id = p_session
  for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if v_session.user_id <> p_user then
    raise exception 'SESSION_FORBIDDEN';
  end if;

  -- Load game config
  select * into v_config
  from public.game_config
  where game_id = v_session.game_id;

  if not found then
    raise exception 'CONFIG_NOT_FOUND';
  end if;

  -- Global cap
  select daily_cap into v_global_cap
  from public.game_global_config
  where id = 1;
  if v_global_cap is null then
    v_global_cap := 300;
  end if;

  -- Today in user's timezone
  v_today := (p_now at time zone p_tz)::date;

  -- Idempotency check: if session is already finished, return stored results
  if v_session.status = 'finished' then
    select coalesce(coins, 0) into v_earned_today_game
    from public.game_daily_earnings
    where user_id = p_user and day = v_today and game_id = v_session.game_id;

    select coalesce(sum(coins), 0) into v_earned_today_global
    from public.game_daily_earnings
    where user_id = p_user and day = v_today;

    select balance into v_balance
    from public.wallets
    where user_id = p_user;

    select coalesce(max(score), 0) into v_best_score
    from public.game_scores
    where user_id = p_user and game_id = v_session.game_id
      and (difficulty = v_session.difficulty or (difficulty is null and v_session.difficulty is null));

    return jsonb_build_object(
      'score', v_session.score,
      'bestScore', v_best_score,
      'isNewBest', false,
      'coinsAwarded', v_session.coins_awarded,
      'rewardRaw', v_session.coins_awarded,
      'capReachedGame', (v_earned_today_game >= v_config.daily_cap),
      'capReachedGlobal', (v_earned_today_global >= v_global_cap),
      'earnedTodayGame', coalesce(v_earned_today_game, 0),
      'dailyCapGame', v_config.daily_cap,
      'earnedTodayGlobal', coalesce(v_earned_today_global, 0),
      'dailyCapGlobal', v_global_cap,
      'balanceAfter', coalesce(v_balance, 0)
    );
  end if;

  if v_session.status <> 'active' then
    raise exception 'INVALID_SESSION_STATUS: %', v_session.status;
  end if;

  -- Check session expiration
  if p_now > v_session.started_at + (v_config.max_session_age_s || ' seconds')::interval then
    update public.game_sessions
    set status = 'expired',
        finished_at = p_now,
        reject_reason = 'Session expired'
    where id = p_session;
    raise exception 'SESSION_EXPIRED';
  end if;

  -- Calculate raw deterministic reward from score
  if p_score <= 0 then
    v_reward_raw := 0;
  else
    v_reward_raw := least(
      v_config.per_session_max,
      greatest(v_config.min_reward, floor(p_score / v_config.score_divisor)::int)
    );
  end if;

  -- Compute today's earnings
  select coalesce(coins, 0) into v_earned_today_game
  from public.game_daily_earnings
  where user_id = p_user and day = v_today and game_id = v_session.game_id;
  if v_earned_today_game is null then
    v_earned_today_game := 0;
  end if;

  select coalesce(sum(coins), 0) into v_earned_today_global
  from public.game_daily_earnings
  where user_id = p_user and day = v_today;
  if v_earned_today_global is null then
    v_earned_today_global := 0;
  end if;

  v_game_left := greatest(0, v_config.daily_cap - v_earned_today_game);
  v_global_left := greatest(0, v_global_cap - v_earned_today_global);
  v_coins := greatest(0, least(v_reward_raw, v_game_left, v_global_left));

  -- Award coins via apply_coin_transaction
  if v_coins > 0 then
    perform public.apply_coin_transaction(
      p_user,
      v_coins,
      'game_reward',
      p_session::text,
      'game:' || p_session::text
    );

    insert into public.game_daily_earnings (user_id, day, game_id, coins)
    values (p_user, v_today, v_session.game_id, v_coins)
    on conflict (user_id, day, game_id)
    do update set coins = public.game_daily_earnings.coins + v_coins;

    v_earned_today_game := v_earned_today_game + v_coins;
    v_earned_today_global := v_earned_today_global + v_coins;
  end if;

  -- Determine best score
  select coalesce(max(score), 0) into v_prev_best
  from public.game_scores
  where user_id = p_user and game_id = v_session.game_id
    and (difficulty = v_session.difficulty or (difficulty is null and v_session.difficulty is null));

  v_is_new_best := (p_score > v_prev_best);
  v_best_score := greatest(p_score, v_prev_best);

  -- Insert verified score
  insert into public.game_scores (user_id, game_id, difficulty, score, session_id, created_at)
  values (p_user, v_session.game_id, v_session.difficulty, p_score, p_session, p_now);

  -- Mark session finished
  update public.game_sessions
  set status = 'finished',
      finished_at = p_now,
      score = p_score,
      duration_ms = p_duration_ms,
      coins_awarded = v_coins
  where id = p_session;

  -- Fetch updated balance
  select balance into v_balance
  from public.wallets
  where user_id = p_user;

  return jsonb_build_object(
    'score', p_score,
    'bestScore', v_best_score,
    'isNewBest', v_is_new_best,
    'coinsAwarded', v_coins,
    'rewardRaw', v_reward_raw,
    'capReachedGame', (v_earned_today_game >= v_config.daily_cap),
    'capReachedGlobal', (v_earned_today_global >= v_global_cap),
    'earnedTodayGame', v_earned_today_game,
    'dailyCapGame', v_config.daily_cap,
    'earnedTodayGlobal', v_earned_today_global,
    'dailyCapGlobal', v_global_cap,
    'balanceAfter', coalesce(v_balance, 0)
  );
end;
$$;

-- 10. get_game_daily_status function (SECURITY DEFINER, Service Role Only)
create or replace function public.get_game_daily_status(
  p_user uuid,
  p_tz text,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date;
  v_global_cap int;
  v_global_earned int := 0;
  v_games jsonb;
begin
  v_today := (p_now at time zone p_tz)::date;

  select daily_cap into v_global_cap
  from public.game_global_config
  where id = 1;
  if v_global_cap is null then
    v_global_cap := 300;
  end if;

  select coalesce(sum(coins), 0) into v_global_earned
  from public.game_daily_earnings
  where user_id = p_user and day = v_today;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'gameId', g.id,
      'slug', g.slug,
      'title', g.title,
      'category', g.category,
      'enabled', g.enabled,
      'dailyCap', gc.daily_cap,
      'perSessionMax', gc.per_session_max,
      'earnedToday', coalesce(e.coins, 0),
      'bestScore', coalesce(b.best_score, 0)
    ) order by g.sort_order asc
  ), '[]'::jsonb) into v_games
  from public.games g
  left join public.game_config gc on gc.game_id = g.id
  left join public.game_daily_earnings e on e.user_id = p_user and e.day = v_today and e.game_id = g.id
  left join (
    select game_id, max(score) as best_score
    from public.game_scores
    where user_id = p_user
    group by game_id
  ) b on b.game_id = g.id
  where g.enabled = true;

  return jsonb_build_object(
    'today', v_today,
    'globalCap', v_global_cap,
    'globalEarnedToday', coalesce(v_global_earned, 0),
    'games', v_games
  );
end;
$$;

-- Revoke direct execution from anon and authenticated
revoke execute on function public.finish_game_session(uuid, uuid, int, int, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.get_game_daily_status(uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.finish_game_session(uuid, uuid, int, int, text, timestamptz) to service_role;
grant execute on function public.get_game_daily_status(uuid, text, timestamptz) to service_role;
