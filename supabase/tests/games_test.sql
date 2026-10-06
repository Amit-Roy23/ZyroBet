-- supabase/tests/games_test.sql
-- Verification script for ZyroBet Mini-Games & Deterministic Rewards

do $$
declare
  v_user1 uuid := '33333333-3333-3333-3333-333333333331'::uuid;
  v_user2 uuid := '33333333-3333-3333-3333-333333333332'::uuid;
  v_session1 uuid;
  v_session2 uuid;
  v_session3 uuid;
  v_session_user2 uuid;
  v_expired_session uuid;
  v_res jsonb;
  v_res2 jsonb;
  v_tz text := 'UTC';
  v_t0 timestamptz := '2026-10-06 12:00:00+00';
  v_ledger_count int;
  v_balance bigint;
begin
  raise notice 'Starting ZyroBet Games SQL Test Suite...';

  -- Setup test users & wallets
  delete from public.game_scores where user_id in (v_user1, v_user2);
  delete from public.game_daily_earnings where user_id in (v_user1, v_user2);
  delete from public.game_sessions where user_id in (v_user1, v_user2);
  delete from public.coin_ledger where user_id in (v_user1, v_user2);
  delete from public.wallets where user_id in (v_user1, v_user2);

  insert into public.wallets(user_id, balance) values (v_user1, 100), (v_user2, 100);

  -----------------------------------------------------------------------------
  -- TEST 1: First valid session completion & reward calculation
  -----------------------------------------------------------------------------
  insert into public.game_sessions (id, user_id, game_id, difficulty, seed, status, started_at)
  values (gen_random_uuid(), v_user1, 'memory-match', 'medium', 12345, 'active', v_t0)
  returning id into v_session1;

  -- Memory match: score 1000 / divisor 25 = 40 (capped at per_session_max 40)
  v_res := public.finish_game_session(v_user1, v_session1, 1000, 15000, v_tz, v_t0 + interval '15 seconds');
  assert (v_res->>'coinsAwarded')::int = 40, 'Test 1 Failed: Expected 40 coins awarded, got ' || (v_res->>'coinsAwarded');
  assert (v_res->>'isNewBest')::bool = true, 'Test 1 Failed: Expected isNewBest = true';
  assert (v_res->>'earnedTodayGame')::int = 40, 'Test 1 Failed: Expected earnedTodayGame = 40';

  -- Verify ledger row created
  select count(*) into v_ledger_count from public.coin_ledger where user_id = v_user1 and ref_id = v_session1::text;
  assert v_ledger_count = 1, 'Test 1 Failed: Exactly 1 ledger row expected';

  -----------------------------------------------------------------------------
  -- TEST 2: Idempotent finish (second call returns exact same result)
  -----------------------------------------------------------------------------
  v_res2 := public.finish_game_session(v_user1, v_session1, 1000, 15000, v_tz, v_t0 + interval '20 seconds');
  assert (v_res2->>'coinsAwarded')::int = 40, 'Test 2 Failed: Idempotent finish coins mismatch';
  
  select count(*) into v_ledger_count from public.coin_ledger where user_id = v_user1 and ref_id = v_session1::text;
  assert v_ledger_count = 1, 'Test 2 Failed: Idempotent call must not create duplicate ledger rows';

  -----------------------------------------------------------------------------
  -- TEST 3: Per-game daily cap enforcement
  -----------------------------------------------------------------------------
  -- Daily cap for memory-match is 120. User1 already has 40.
  -- Complete 2 more sessions with 40 coins each (40 + 40 + 40 = 120 cap reached).
  insert into public.game_sessions (id, user_id, game_id, difficulty, seed, status, started_at)
  values (gen_random_uuid(), v_user1, 'memory-match', 'medium', 12346, 'active', v_t0 + interval '1 minute')
  returning id into v_session2;

  v_res := public.finish_game_session(v_user1, v_session2, 1000, 15000, v_tz, v_t0 + interval '75 seconds');
  assert (v_res->>'coinsAwarded')::int = 40, 'Test 3a Failed: Expected 40 coins awarded';
  assert (v_res->>'earnedTodayGame')::int = 80, 'Test 3a Failed: Expected earnedTodayGame = 80';

  insert into public.game_sessions (id, user_id, game_id, difficulty, seed, status, started_at)
  values (gen_random_uuid(), v_user1, 'memory-match', 'medium', 12347, 'active', v_t0 + interval '2 minutes')
  returning id into v_session3;

  v_res := public.finish_game_session(v_user1, v_session3, 1000, 15000, v_tz, v_t0 + interval '135 seconds');
  assert (v_res->>'coinsAwarded')::int = 40, 'Test 3b Failed: Expected 40 coins awarded';
  assert (v_res->>'capReachedGame')::bool = true, 'Test 3b Failed: Expected capReachedGame = true';
  assert (v_res->>'earnedTodayGame')::int = 120, 'Test 3b Failed: Expected earnedTodayGame = 120';

  -- Next session should award 0 coins due to per-game cap
  insert into public.game_sessions (id, user_id, game_id, difficulty, seed, status, started_at)
  values (gen_random_uuid(), v_user1, 'memory-match', 'medium', 12348, 'active', v_t0 + interval '3 minutes')
  returning id into v_session3;

  v_res := public.finish_game_session(v_user1, v_session3, 1000, 15000, v_tz, v_t0 + interval '195 seconds');
  assert (v_res->>'coinsAwarded')::int = 0, 'Test 3c Failed: Expected 0 coins awarded after cap reached';
  assert (v_res->>'score')::int = 1000, 'Test 3c Failed: Score must still be recorded';

  -----------------------------------------------------------------------------
  -- TEST 4: Global Cap enforcement across different games
  -----------------------------------------------------------------------------
  -- Global cap is 300. User1 has 120 from memory-match.
  -- Game 2048 has daily cap 150. If user earns 150 in 2048, total = 270.
  -- Then in tap-reaction (daily cap 90), user can only earn remaining 30 (270 + 30 = 300 global cap).
  insert into public.game_daily_earnings (user_id, day, game_id, coins)
  values (v_user1, v_t0::date, 'game-2048', 150)
  on conflict (user_id, day, game_id) do update set coins = 150;

  insert into public.game_sessions (id, user_id, game_id, difficulty, seed, status, started_at)
  values (gen_random_uuid(), v_user1, 'tap-reaction', null, 999, 'active', v_t0 + interval '5 minutes')
  returning id into v_session3;

  -- Tap reaction raw reward 30 -> global left is 300 - (120 + 150) = 30 -> awards exactly 30
  v_res := public.finish_game_session(v_user1, v_session3, 3000, 10000, v_tz, v_t0 + interval '6 minutes');
  assert (v_res->>'coinsAwarded')::int = 30, 'Test 4a Failed: Expected 30 coins';
  assert (v_res->>'capReachedGlobal')::bool = true, 'Test 4a Failed: Expected global cap reached';

  -- Next session in any game must award 0
  insert into public.game_sessions (id, user_id, game_id, difficulty, seed, status, started_at)
  values (gen_random_uuid(), v_user1, 'tap-reaction', null, 1000, 'active', v_t0 + interval '7 minutes')
  returning id into v_session3;

  v_res := public.finish_game_session(v_user1, v_session3, 3000, 10000, v_tz, v_t0 + interval '8 minutes');
  assert (v_res->>'coinsAwarded')::int = 0, 'Test 4b Failed: Expected 0 coins after global cap reached';

  -----------------------------------------------------------------------------
  -- TEST 5: Security & Expiration checks
  -----------------------------------------------------------------------------
  -- Forbidden session belonging to user2
  insert into public.game_sessions (id, user_id, game_id, difficulty, seed, status, started_at)
  values (gen_random_uuid(), v_user2, 'memory-match', 'easy', 555, 'active', v_t0)
  returning id into v_session_user2;

  begin
    perform public.finish_game_session(v_user1, v_session_user2, 500, 5000, v_tz, v_t0 + interval '10 seconds');
    raise exception 'Test 5a Failed: User1 should not finish User2 session';
  exception when others then
    if sqlerrm not like '%SESSION_FORBIDDEN%' then
      raise exception 'Test 5a Unexpected error: %', sqlerrm;
    end if;
  end;

  -- Expired session (> 7200 seconds)
  insert into public.game_sessions (id, user_id, game_id, difficulty, seed, status, started_at)
  values (gen_random_uuid(), v_user1, 'memory-match', 'easy', 777, 'active', v_t0 - interval '3 hours')
  returning id into v_expired_session;

  begin
    perform public.finish_game_session(v_user1, v_expired_session, 500, 5000, v_tz, v_t0);
    raise exception 'Test 5b Failed: Expired session should be rejected';
  exception when others then
    if sqlerrm not like '%SESSION_EXPIRED%' then
      raise exception 'Test 5b Unexpected error: %', sqlerrm;
    end if;
  end;

  raise notice '✅ All ZyroBet Games SQL tests passed successfully!';
end;
$$;
