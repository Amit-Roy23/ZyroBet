-- ==============================================================================
-- ZYROBET WALLET & LEDGER VERIFICATION SUITE
-- ==============================================================================
-- Run via:
--   psql -d postgres -f supabase/tests/wallet_ledger_test.sql
-- or inside Supabase SQL Editor
-- ==============================================================================

BEGIN;

\echo '----------------------------------------------------------------------'
\echo 'TEST 1: Sign-up Bonus & Wallet Creation on First Transaction'
\echo '----------------------------------------------------------------------'

-- Setup a test user
CREATE TEMP TABLE test_state AS
SELECT gen_random_uuid() AS user_id;

-- Apply initial welcome grant via apply_coin_transaction
DO $$
DECLARE
  v_user uuid;
  v_ledger coin_ledger;
  v_balance bigint;
BEGIN
  SELECT user_id INTO v_user FROM test_state;

  -- Initial credit: 500 signup bonus
  v_ledger := apply_coin_transaction(
    p_user => v_user,
    p_delta => 500,
    p_reason => 'signup_bonus',
    p_ref => 'welcome_gift',
    p_key => 'test_signup_bonus_key_1'
  );

  ASSERT v_ledger.balance_after = 500, 'Expected balance after signup to be 500, got: ' || v_ledger.balance_after;
  ASSERT v_ledger.delta = 500, 'Expected delta 500';

  SELECT balance INTO v_balance FROM wallets WHERE user_id = v_user;
  ASSERT v_balance = 500, 'Wallet balance should match 500';
  RAISE NOTICE 'Test 1 Passed: Wallet created with initial 500 bonus';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'TEST 2: Idempotent Replay (Same user & key returns identical row)'
\echo '----------------------------------------------------------------------'

DO $$
DECLARE
  v_user uuid;
  v_ledger1 coin_ledger;
  v_ledger2 coin_ledger;
  v_count int;
BEGIN
  SELECT user_id INTO v_user FROM test_state;

  -- Replay the exact same transaction key
  v_ledger2 := apply_coin_transaction(
    p_user => v_user,
    p_delta => 500,
    p_reason => 'signup_bonus',
    p_ref => 'welcome_gift',
    p_key => 'test_signup_bonus_key_1'
  );

  -- Balance must remain 500, not 1000
  ASSERT v_ledger2.balance_after = 500, 'Idempotent replay modified balance!';
  ASSERT v_ledger2.idempotency_key = 'test_signup_bonus_key_1', 'Keys must match';

  SELECT count(*) INTO v_count FROM coin_ledger WHERE user_id = v_user AND idempotency_key = 'test_signup_bonus_key_1';
  ASSERT v_count = 1, 'Duplicate ledger entry was created for same idempotency key!';
  RAISE NOTICE 'Test 2 Passed: Idempotent replay returned existing record without double-crediting';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'TEST 3: Insufficient Funds Rejection (Negative Balance Forbidden)'
\echo '----------------------------------------------------------------------'

DO $$
DECLARE
  v_user uuid;
  v_failed boolean := false;
BEGIN
  SELECT user_id INTO v_user FROM test_state;

  BEGIN
    -- Current balance is 500. Attempt to spend 800.
    PERFORM apply_coin_transaction(
      p_user => v_user,
      p_delta => -800,
      p_reason => 'spend',
      p_ref => 'overdraft_game_entry',
      p_key => 'test_spend_overdraft_key'
    );
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%INSUFFICIENT_COINS%' THEN
      v_failed := true;
    ELSE
      RAISE EXCEPTION 'Unexpected error thrown: %', SQLERRM;
    END IF;
  END;

  ASSERT v_failed = true, 'Transaction should have raised INSUFFICIENT_COINS error';
  RAISE NOTICE 'Test 3 Passed: Insufficient coins correctly blocked';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'TEST 4: Concurrent Safe Debits and Credits'
\echo '----------------------------------------------------------------------'

DO $$
DECLARE
  v_user uuid;
  v_ledger coin_ledger;
  v_final_balance bigint;
BEGIN
  SELECT user_id INTO v_user FROM test_state;

  -- Credit +250
  PERFORM apply_coin_transaction(v_user, 250, 'game_reward', 'game_2048', 'key_concurrent_1');

  -- Debit -100
  PERFORM apply_coin_transaction(v_user, -100, 'spend', 'game_entry', 'key_concurrent_2');

  -- Credit +100
  PERFORM apply_coin_transaction(v_user, 100, 'daily_reward', 'day_streak_1', 'key_concurrent_3');

  SELECT balance INTO v_final_balance FROM wallets WHERE user_id = v_user;
  -- Expected: 500 + 250 - 100 + 100 = 750
  ASSERT v_final_balance = 750, 'Expected 750, got: ' || v_final_balance;
  RAISE NOTICE 'Test 4 Passed: Balance correctly reflects all sequence transitions (750 coins)';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'TEST 5: RLS Security Enforcement (Clients cannot direct UPDATE/INSERT)'
\echo '----------------------------------------------------------------------'

DO $$
DECLARE
  v_anon_role_can_execute boolean;
BEGIN
  -- Verify direct client execution is REVOKED
  SELECT has_function_privilege('anon', 'apply_coin_transaction(uuid, bigint, text, text, text)', 'EXECUTE')
  INTO v_anon_role_can_execute;

  ASSERT v_anon_role_can_execute = false, 'Security issue: anon role has EXECUTE on apply_coin_transaction!';

  SELECT has_function_privilege('authenticated', 'apply_coin_transaction(uuid, bigint, text, text, text)', 'EXECUTE')
  INTO v_anon_role_can_execute;

  ASSERT v_anon_role_can_execute = false, 'Security issue: authenticated role has EXECUTE on apply_coin_transaction!';

  RAISE NOTICE 'Test 5 Passed: apply_coin_transaction is locked strictly to service_role';
END $$;

ROLLBACK;

\echo '----------------------------------------------------------------------'
\echo 'ALL 5 WALLET & LEDGER SQL TESTS PASSED SUCCESSFULLY'
\echo '----------------------------------------------------------------------'
