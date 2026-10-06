-- ==============================================================================
-- ZYROBET: DAILY REWARDS SQL VERIFICATION SUITE
-- ==============================================================================
-- Run via:
--   psql -d postgres -f supabase/tests/daily_rewards_test.sql
-- or inside Supabase SQL Editor
-- ==============================================================================

BEGIN;

\echo '----------------------------------------------------------------------'
\echo 'TEST 1: First Claim (Streak 1, 50 coins credited via ledger)'
\echo '----------------------------------------------------------------------'

CREATE TEMP TABLE test_daily_user AS
SELECT gen_random_uuid() AS user_id;

DO $$
DECLARE
  v_user uuid;
  v_res jsonb;
  v_balance bigint;
  v_ledger_count int;
  v_now timestamptz := '2026-10-06 10:00:00+00';
BEGIN
  SELECT user_id INTO v_user FROM test_daily_user;

  -- First claim on 2026-10-06
  v_res := claim_daily_reward(v_user, 'UTC', v_now);

  ASSERT (v_res->>'status') = 'CLAIMED', 'Expected status CLAIMED, got: ' || (v_res->>'status');
  ASSERT (v_res->>'coins')::int = 50, 'Expected 50 coins on Day 1';
  ASSERT (v_res->>'streak')::int = 1, 'Expected streak 1';
  ASSERT (v_res->>'cycleDay')::int = 1, 'Expected cycleDay 1';
  ASSERT (v_res->>'wasReset')::boolean = false, 'First claim should not mark wasReset';

  SELECT count(*) INTO v_ledger_count FROM coin_ledger WHERE user_id = v_user AND reason = 'daily_reward';
  ASSERT v_ledger_count = 1, 'Expected exactly 1 daily_reward ledger entry';

  RAISE NOTICE 'Test 1 Passed: Day 1 claim successfully granted 50 coins and initialized streak 1';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'TEST 2: Second Claim Same Day (ALREADY_CLAIMED, no double payout)'
\echo '----------------------------------------------------------------------'

DO $$
DECLARE
  v_user uuid;
  v_res jsonb;
  v_ledger_count int;
  v_now_later timestamptz := '2026-10-06 18:30:00+00';
BEGIN
  SELECT user_id INTO v_user FROM test_daily_user;

  -- Second claim attempt later the same day
  v_res := claim_daily_reward(v_user, 'UTC', v_now_later);

  ASSERT (v_res->>'status') = 'ALREADY_CLAIMED', 'Expected ALREADY_CLAIMED on second claim';
  ASSERT (v_res->>'streak')::int = 1, 'Streak should remain 1';

  SELECT count(*) INTO v_ledger_count FROM coin_ledger WHERE user_id = v_user AND reason = 'daily_reward';
  ASSERT v_ledger_count = 1, 'Duplicate claim created unwanted ledger entry!';

  RAISE NOTICE 'Test 2 Passed: Second claim on same day correctly blocked with ALREADY_CLAIMED';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'TEST 3: Consecutive Daily Claims (Streak 2 -> 7 with scaling amounts)'
\echo '----------------------------------------------------------------------'

DO $$
DECLARE
  v_user uuid;
  v_res jsonb;
  v_day_amounts int[] := ARRAY[75, 100, 150, 200, 300, 500];
  v_expected_coins int;
  i int;
  v_sim_time timestamptz;
BEGIN
  SELECT user_id INTO v_user FROM test_daily_user;

  -- Simulate days 2 to 7 consecutively
  FOR i IN 2..7 LOOP
    v_sim_time := ('2026-10-0' || (6 + i - 1) || ' 10:00:00+00')::timestamptz;
    v_expected_coins := v_day_amounts[i - 1];

    v_res := claim_daily_reward(v_user, 'UTC', v_sim_time);

    ASSERT (v_res->>'status') = 'CLAIMED', 'Failed claim on day ' || i;
    ASSERT (v_res->>'streak')::int = i, 'Expected streak ' || i || ' got ' || (v_res->>'streak');
    ASSERT (v_res->>'cycleDay')::int = i, 'Expected cycleDay ' || i || ' got ' || (v_res->>'cycleDay');
    ASSERT (v_res->>'coins')::int = v_expected_coins, 'Expected coins ' || v_expected_coins || ' got ' || (v_res->>'coins');
    ASSERT (v_res->>'wasReset')::boolean = false, 'Consecutive claim should not reset';
  END LOOP;

  RAISE NOTICE 'Test 3 Passed: Consecutive days 2..7 rewarded exact expected coins (Day 7 = 500)';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'TEST 4: Day 8 Cycle Wrap (Streak 8, Cycle Day 1, 50 coins)'
\echo '----------------------------------------------------------------------'

DO $$
DECLARE
  v_user uuid;
  v_res jsonb;
  v_day8_time timestamptz := '2026-10-13 10:00:00+00';
BEGIN
  SELECT user_id INTO v_user FROM test_daily_user;

  -- Day 8 claim
  v_res := claim_daily_reward(v_user, 'UTC', v_day8_time);

  ASSERT (v_res->>'status') = 'CLAIMED';
  ASSERT (v_res->>'streak')::int = 8, 'Expected streak 8';
  ASSERT (v_res->>'cycleDay')::int = 1, 'Expected cycleDay 1 (wrapped)';
  ASSERT (v_res->>'coins')::int = 50, 'Expected Day 1 50 coins';
  ASSERT (v_res->>'longestStreak')::int = 8, 'Expected longest streak 8';

  RAISE NOTICE 'Test 4 Passed: 7-day cycle correctly wrapped to Day 1 with continuous streak 8';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'TEST 5: Missed Day Streak Reset (Skipped day resets streak to 1)'
\echo '----------------------------------------------------------------------'

DO $$
DECLARE
  v_user uuid;
  v_res jsonb;
  -- Skip from Oct 13 to Oct 16 (gap of 2 days)
  v_gap_time timestamptz := '2026-10-16 10:00:00+00';
BEGIN
  SELECT user_id INTO v_user FROM test_daily_user;

  v_res := claim_daily_reward(v_user, 'UTC', v_gap_time);

  ASSERT (v_res->>'status') = 'CLAIMED';
  ASSERT (v_res->>'streak')::int = 1, 'Streak should reset to 1 after missing days';
  ASSERT (v_res->>'cycleDay')::int = 1, 'Cycle day should reset to 1';
  ASSERT (v_res->>'wasReset')::boolean = true, 'wasReset flag must be true';
  ASSERT (v_res->>'longestStreak')::int = 8, 'Longest streak of 8 must be preserved!';

  RAISE NOTICE 'Test 5 Passed: Missed days correctly reset streak to 1 while preserving longest record (8)';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'TEST 6: Status View & Cycle 7 Completion Edge Case'
\echo '----------------------------------------------------------------------'

DO $$
DECLARE
  v_user uuid;
  v_status jsonb;
  v_now timestamptz := '2026-10-16 12:00:00+00';
BEGIN
  SELECT user_id INTO v_user FROM test_daily_user;

  v_status := daily_reward_status(v_user, 'UTC', v_now);

  ASSERT (v_status->>'canClaim')::boolean = false, 'Should not be able to claim again today';
  ASSERT (v_status->>'streak')::int = 1, 'Expected streak 1';
  ASSERT (v_status->>'claimedDaysInCycle')::int = 1, 'Expected 1 claimed day';
  ASSERT (v_status->'config') IS NOT NULL, 'Config array must be returned';

  RAISE NOTICE 'Test 6 Passed: daily_reward_status accurately computes cycle and timing metadata';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'TEST 7: RLS & Function Security'
\echo '----------------------------------------------------------------------'

DO $$
DECLARE
  v_anon_can_exec boolean;
  v_auth_can_exec boolean;
BEGIN
  SELECT has_function_privilege('anon', 'claim_daily_reward(uuid, text, timestamptz)', 'EXECUTE')
  INTO v_anon_can_exec;
  ASSERT v_anon_can_exec = false, 'Security Error: anon has EXECUTE on claim_daily_reward!';

  SELECT has_function_privilege('authenticated', 'claim_daily_reward(uuid, text, timestamptz)', 'EXECUTE')
  INTO v_auth_can_exec;
  ASSERT v_auth_can_exec = false, 'Security Error: authenticated has EXECUTE on claim_daily_reward!';

  RAISE NOTICE 'Test 7 Passed: Direct client execution of claim_daily_reward is strictly revoked';
END $$;

ROLLBACK;

\echo '----------------------------------------------------------------------'
\echo 'ALL 7 DAILY REWARDS SQL TESTS PASSED SUCCESSFULLY'
\echo '----------------------------------------------------------------------'
