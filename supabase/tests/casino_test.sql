-- supabase/tests/casino_test.sql
-- Verification script for ZyroBet casino rounds (bets, payouts, idempotency, limits)

do $$
declare
  v_user uuid := '44444444-4444-4444-4444-444444444441'::uuid;
  v_other uuid := '44444444-4444-4444-4444-444444444442'::uuid;
  v_res jsonb;
  v_round uuid;
  v_balance bigint;
  v_count int;
begin
  raise notice 'Starting ZyroBet Casino SQL Test Suite...';

  insert into auth.users (id) values (v_user), (v_other) on conflict (id) do nothing;
  delete from public.casino_rounds where user_id in (v_user, v_other);
  delete from public.coin_ledger where user_id in (v_user, v_other);
  delete from public.wallets where user_id in (v_user, v_other);
  insert into public.wallets(user_id, balance) values (v_user, 1000), (v_other, 1000);

  -- TEST 1: Instant round debits the bet and credits floor(bet * multiplier)
  v_res := public.casino_open_round(v_user, 'slots', 100, '{}', '{}', 'seed1', 'hash1', 'client1', '{}', 2.55, '{"grid": []}');
  assert v_res->'round'->>'status' = 'settled', 'Test 1 Failed: instant round not settled';
  assert (v_res->'round'->>'payout')::bigint = 255, 'Test 1 Failed: expected payout 255';
  assert v_res->'round'->>'serverSeed' = 'seed1', 'Test 1 Failed: seed not revealed';
  assert (v_res->>'balance')::bigint = 1155, 'Test 1 Failed: expected balance 1155, got ' || (v_res->>'balance');
  raise notice 'Test 1 Passed: Instant round payout';

  -- TEST 2: Losing instant round only debits
  v_res := public.casino_open_round(v_user, 'plinko', 155, '{"rows": 8, "risk": "low"}', '{}', 's', 'h', 'c', '{}', 0, null);
  assert (v_res->'round'->>'payout')::bigint = 0, 'Test 2 Failed: expected payout 0';
  assert (v_res->>'balance')::bigint = 1000, 'Test 2 Failed: expected balance 1000';
  raise notice 'Test 2 Passed: Losing round';

  -- TEST 3: Bet limits
  begin
    perform public.casino_open_round(v_user, 'slots', 5, '{}', '{}', 's', 'h', 'c', '{}', 1, null);
    assert false, 'Test 3 Failed: bet below minimum accepted';
  exception when others then
    assert sqlerrm like '%INVALID_BET%', 'Test 3 Failed: unexpected error ' || sqlerrm;
  end;
  raise notice 'Test 3 Passed: Bet limits';

  -- TEST 4: Insufficient coins rolls the round back
  begin
    perform public.casino_open_round(v_user, 'slots', 5000, '{}', '{}', 's', 'h', 'c', '{}', 1, null);
    assert false, 'Test 4 Failed: overdraft accepted';
  exception when others then
    assert sqlerrm like '%INSUFFICIENT_COINS%', 'Test 4 Failed: unexpected error ' || sqlerrm;
  end;
  select count(*) into v_count from public.casino_rounds where user_id = v_user;
  assert v_count = 2, 'Test 4 Failed: failed round was persisted';
  raise notice 'Test 4 Passed: Insufficient coins';

  -- TEST 5: Multi-step round (Mines): one active round per game, versioned updates
  v_res := public.casino_open_round(v_user, 'mines', 100, '{"mines": 3}', '{"revealed": []}', 'ms', 'mh', 'mc', '{"positions": [1,2,3]}');
  v_round := (v_res->'round'->>'id')::uuid;
  assert v_res->'round'->>'status' = 'active', 'Test 5 Failed: round not active';
  assert v_res->'round'->>'serverSeed' is null, 'Test 5 Failed: seed leaked while active';
  assert (v_res->>'balance')::bigint = 900, 'Test 5 Failed: bet not debited';

  begin
    perform public.casino_open_round(v_user, 'mines', 100, '{"mines": 3}', '{}', 's', 'h', 'c', '{}');
    assert false, 'Test 5 Failed: second active round accepted';
  exception when others then
    assert sqlerrm like '%ROUND_ACTIVE%', 'Test 5 Failed: unexpected error ' || sqlerrm;
  end;

  v_res := public.casino_update_round_state(v_user, v_round, 0, '{"revealed": [7]}');
  assert (v_res->'round'->>'version')::int = 1, 'Test 5 Failed: version not bumped';
  begin
    perform public.casino_update_round_state(v_user, v_round, 0, '{"revealed": [8]}');
    assert false, 'Test 5 Failed: stale version accepted';
  exception when others then
    assert sqlerrm like '%ROUND_CONFLICT%', 'Test 5 Failed: unexpected error ' || sqlerrm;
  end;
  raise notice 'Test 5 Passed: Active round & optimistic locking';

  -- TEST 6: Other users cannot settle the round; settling twice pays once
  begin
    perform public.casino_settle_round(v_other, v_round, 10, null, null);
    assert false, 'Test 6 Failed: foreign settle accepted';
  exception when others then
    assert sqlerrm like '%ROUND_FORBIDDEN%', 'Test 6 Failed: unexpected error ' || sqlerrm;
  end;

  v_res := public.casino_settle_round(v_user, v_round, 1.13, null, 1);
  assert (v_res->'round'->>'payout')::bigint = 113, 'Test 6 Failed: expected payout 113';
  assert v_res->'round'->>'serverSeed' = 'ms', 'Test 6 Failed: seed not revealed';
  v_res := public.casino_settle_round(v_user, v_round, 50, null, null);
  assert (v_res->'round'->>'payout')::bigint = 113, 'Test 6 Failed: re-settle changed payout';
  select balance into v_balance from public.wallets where user_id = v_user;
  assert v_balance = 1013, 'Test 6 Failed: expected balance 1013, got ' || v_balance;
  raise notice 'Test 6 Passed: Ownership & idempotent settle';

  -- TEST 7: Ledger has one entry per bet and per positive payout
  select count(*) into v_count from public.coin_ledger where user_id = v_user and reason = 'casino_bet';
  assert v_count = 3, 'Test 7 Failed: expected 3 bet entries, got ' || v_count;
  select count(*) into v_count from public.coin_ledger where user_id = v_user and reason = 'casino_win';
  assert v_count = 2, 'Test 7 Failed: expected 2 win entries, got ' || v_count;
  raise notice 'Test 7 Passed: Ledger entries';

  raise notice 'All Casino SQL tests passed.';
end $$;
