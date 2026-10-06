-- ==============================================================================
-- ZYROBET: DAILY REWARDS SYSTEM (Fixed Amounts, Streak Progression & RLS)
-- ==============================================================================

-- 1. Daily Reward Configuration Table (Fixed cycle amounts)
CREATE TABLE IF NOT EXISTS public.daily_reward_config (
  day smallint PRIMARY KEY CHECK (day BETWEEN 1 AND 7),
  coins int NOT NULL CHECK (coins > 0)
);

-- Seed 7-Day Cycle Rewards
INSERT INTO public.daily_reward_config (day, coins)
VALUES
  (1, 50),
  (2, 75),
  (3, 100),
  (4, 150),
  (5, 200),
  (6, 300),
  (7, 500)
ON CONFLICT (day) DO UPDATE
SET coins = EXCLUDED.coins;

-- 2. User Daily Reward State Table
CREATE TABLE IF NOT EXISTS public.daily_reward_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  streak int NOT NULL DEFAULT 0 CHECK (streak >= 0),
  longest_streak int NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  total_claims int NOT NULL DEFAULT 0 CHECK (total_claims >= 0),
  last_claim_date date,
  updated_at timestamptz DEFAULT now()
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.daily_reward_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reward_state ENABLE ROW LEVEL SECURITY;

-- Clients can read reward config
DROP POLICY IF EXISTS "Allow authenticated read daily_reward_config" ON public.daily_reward_config;
CREATE POLICY "Allow authenticated read daily_reward_config"
  ON public.daily_reward_config
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Clients can read only their own state
DROP POLICY IF EXISTS "Allow user select own daily_reward_state" ON public.daily_reward_state;
CREATE POLICY "Allow user select own daily_reward_state"
  ON public.daily_reward_state
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Deny all client INSERT/UPDATE/DELETE (writes handled exclusively via SECURITY DEFINER functions)
DROP POLICY IF EXISTS "Deny insert daily_reward_state" ON public.daily_reward_state;
DROP POLICY IF EXISTS "Deny update daily_reward_state" ON public.daily_reward_state;
DROP POLICY IF EXISTS "Deny delete daily_reward_state" ON public.daily_reward_state;

-- 4. Function: claim_daily_reward
CREATE OR REPLACE FUNCTION public.claim_daily_reward(
  p_user uuid,
  p_tz text DEFAULT 'UTC',
  p_now timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz text := COALESCE(NULLIF(TRIM(p_tz), ''), 'UTC');
  v_today date;
  v_state public.daily_reward_state%ROWTYPE;
  v_new_streak int;
  v_longest_streak int;
  v_cycle_day int;
  v_coins int;
  v_was_reset boolean := false;
  v_ledger public.coin_ledger%ROWTYPE;
BEGIN
  -- Determine current calendar date in specified timezone
  v_today := (p_now AT TIME ZONE v_tz)::date;

  -- Ensure user state record exists
  INSERT INTO public.daily_reward_state (user_id, streak, longest_streak, total_claims, last_claim_date, updated_at)
  VALUES (p_user, 0, 0, 0, NULL, now())
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock user's reward state for atomic check & update
  SELECT * INTO v_state
  FROM public.daily_reward_state
  WHERE user_id = p_user
  FOR UPDATE;

  -- Check if already claimed today
  IF v_state.last_claim_date IS NOT NULL AND v_state.last_claim_date = v_today THEN
    RETURN jsonb_build_object(
      'status', 'ALREADY_CLAIMED',
      'message', 'Daily reward has already been claimed for today',
      'today', v_today,
      'streak', v_state.streak,
      'longestStreak', v_state.longest_streak
    );
  END IF;

  -- Calculate streak progression
  IF v_state.last_claim_date IS NOT NULL AND v_state.last_claim_date = (v_today - 1) THEN
    -- Consecutive day claim -> increment streak
    v_new_streak := v_state.streak + 1;
    v_was_reset := false;
  ELSE
    -- First time or missed 1+ days -> restart streak at 1
    v_new_streak := 1;
    v_was_reset := (v_state.streak > 0);
  END IF;

  -- Cycle day: 1 to 7 repeating cycle while streak counts continuously
  v_cycle_day := ((v_new_streak - 1) % 7) + 1;

  -- Fetch fixed reward coin amount
  SELECT coins INTO v_coins
  FROM public.daily_reward_config
  WHERE day = v_cycle_day;

  IF v_coins IS NULL THEN
    v_coins := 50;
  END IF;

  -- Credit coins atomically via ledger with unique idempotency key
  v_ledger := public.apply_coin_transaction(
    p_user => p_user,
    p_delta => v_coins::bigint,
    p_reason => 'daily_reward',
    p_ref => v_cycle_day::text,
    p_key => 'daily:' || v_today::text
  );

  v_longest_streak := GREATEST(v_state.longest_streak, v_new_streak);

  -- Update state
  UPDATE public.daily_reward_state
  SET
    streak = v_new_streak,
    longest_streak = v_longest_streak,
    total_claims = v_state.total_claims + 1,
    last_claim_date = v_today,
    updated_at = now()
  WHERE user_id = p_user;

  RETURN jsonb_build_object(
    'status', 'CLAIMED',
    'coins', v_coins,
    'streak', v_new_streak,
    'longestStreak', v_longest_streak,
    'cycleDay', v_cycle_day,
    'balanceAfter', v_ledger.balance_after,
    'wasReset', v_was_reset
  );
END;
$$;

-- 5. Function: daily_reward_status
CREATE OR REPLACE FUNCTION public.daily_reward_status(
  p_user uuid,
  p_tz text DEFAULT 'UTC',
  p_now timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz text := COALESCE(NULLIF(TRIM(p_tz), ''), 'UTC');
  v_today date;
  v_state public.daily_reward_state%ROWTYPE;
  v_can_claim boolean;
  v_claimed_today boolean;
  v_streak_will_reset boolean;
  v_next_streak int;
  v_cycle_day int;
  v_claimed_days_in_cycle int;
  v_next_claim_at timestamptz;
  v_config jsonb;
BEGIN
  v_today := (p_now AT TIME ZONE v_tz)::date;

  SELECT * INTO v_state
  FROM public.daily_reward_state
  WHERE user_id = p_user;

  IF NOT FOUND THEN
    v_state.streak := 0;
    v_state.longest_streak := 0;
    v_state.total_claims := 0;
    v_state.last_claim_date := NULL;
  END IF;

  v_can_claim := (v_state.last_claim_date IS NULL OR v_state.last_claim_date < v_today);
  v_claimed_today := (v_state.last_claim_date IS NOT NULL AND v_state.last_claim_date = v_today);
  v_streak_will_reset := (v_state.last_claim_date IS NOT NULL AND v_state.last_claim_date < (v_today - 1));

  IF v_can_claim THEN
    IF v_state.last_claim_date IS NOT NULL AND v_state.last_claim_date = (v_today - 1) THEN
      v_next_streak := v_state.streak + 1;
    ELSE
      v_next_streak := 1;
    END IF;
    v_cycle_day := ((v_next_streak - 1) % 7) + 1;
    v_claimed_days_in_cycle := v_cycle_day - 1;
  ELSE
    -- Already claimed today: cycleDay is the day that was claimed today
    v_cycle_day := ((v_state.streak - 1) % 7) + 1;
    v_claimed_days_in_cycle := v_cycle_day;
  END IF;

  -- Next claim available at next midnight in user's timezone
  v_next_claim_at := ((v_today + 1)::text || ' 00:00:00')::timestamp AT TIME ZONE v_tz;

  -- Aggregate config table rows
  SELECT jsonb_agg(
    jsonb_build_object('day', day, 'coins', coins)
    ORDER BY day
  ) INTO v_config
  FROM public.daily_reward_config;

  RETURN jsonb_build_object(
    'streak', v_state.streak,
    'longestStreak', v_state.longest_streak,
    'totalClaims', v_state.total_claims,
    'cycleDay', v_cycle_day,
    'claimedDaysInCycle', v_claimed_days_in_cycle,
    'canClaim', v_can_claim,
    'lastClaimDate', v_state.last_claim_date,
    'streakWillReset', v_streak_will_reset,
    'nextClaimAt', v_next_claim_at,
    'serverNow', p_now,
    'config', COALESCE(v_config, '[]'::jsonb)
  );
END;
$$;

-- 6. Lock down execution permissions (Service role only)
REVOKE ALL ON FUNCTION public.claim_daily_reward(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.daily_reward_status(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
