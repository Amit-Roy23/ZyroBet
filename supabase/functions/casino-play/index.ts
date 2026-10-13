// Supabase Edge Function: casino-play
// Runs every casino action (Slots, Crash, Plinko, Mines). Outcomes come from a hidden
// server seed; bets and payouts are applied atomically by the casino_* SQL functions.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';
import { getServiceSupabase } from '../_shared/client.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';
import { generateFloats, newSeedPair } from '../_shared/fair.ts';
import {
  CRASH_MAX_MULTIPLIER,
  CRASH_MIN_AUTO_CASHOUT,
  MINES_MAX,
  MINES_MIN,
  MINES_TILES,
  crashPointFromFloat,
  dropPlinko,
  evaluateCrash,
  isCasinoGameId,
  isPlinkoRisk,
  isPlinkoRows,
  minesMultiplier,
  placeMines,
  spinSlots,
} from '../_shared/engines/casino.ts';

type ServiceClient = ReturnType<typeof getServiceSupabase>;

interface RoundRow {
  id: string;
  user_id: string;
  game_id: string;
  bet: number;
  status: 'active' | 'settled';
  params: Record<string, unknown>;
  state: Record<string, unknown>;
  version: number;
  created_at: string;
}

class CasinoError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details: unknown = null,
  ) {
    super(message);
  }
}

const KNOWN_DB_ERRORS: Record<string, [string, number]> = {
  INSUFFICIENT_COINS: ['Not enough coins for this bet.', 402],
  INVALID_BET: ['Bet is outside the allowed limits.', 400],
  GAME_DISABLED: ['This game is currently unavailable.', 403],
  ROUND_ACTIVE: ['Finish your current round first.', 409],
  ROUND_CONFLICT: ['Round changed, please retry.', 409],
  ROUND_FINISHED: ['This round is already finished.', 409],
  ROUND_NOT_FOUND: ['Round not found.', 404],
  ROUND_FORBIDDEN: ['Round not found.', 404],
};

async function rpc<T = Record<string, unknown>>(
  client: ServiceClient,
  fn: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) {
    const known = Object.keys(KNOWN_DB_ERRORS).find((code) => error.message?.includes(code));
    if (known) {
      const [message, status] = KNOWN_DB_ERRORS[known];
      throw new CasinoError(known, message, status);
    }
    throw new CasinoError('DATABASE_ERROR', error.message || 'Database error', 500);
  }
  return data as T;
}

const userRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    userRateLimits.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  // Crash polls about once a second, so allow a few per second on average
  if (entry.count >= 240) return false;
  entry.count += 1;
  return true;
}

function parseBet(raw: unknown): number {
  const bet = Number(raw);
  if (!Number.isInteger(bet) || bet <= 0) {
    throw new CasinoError('INVALID_BET', 'Bet must be a positive whole number of coins.');
  }
  return bet;
}

async function loadRound(client: ServiceClient, userId: string, roundId: unknown, game: string) {
  if (typeof roundId !== 'string') {
    throw new CasinoError('BAD_REQUEST', 'roundId is required');
  }
  const { data, error } = await client
    .from('casino_rounds')
    .select('id, user_id, game_id, bet, status, params, state, version, created_at')
    .eq('id', roundId)
    .maybeSingle();
  if (error) throw new CasinoError('DATABASE_ERROR', error.message, 500);
  if (!data || data.user_id !== userId || data.game_id !== game) {
    throw new CasinoError('ROUND_NOT_FOUND', 'Round not found.', 404);
  }
  return data as RoundRow;
}

async function loadActiveRound(client: ServiceClient, userId: string, game: string) {
  const { data, error } = await client
    .from('casino_rounds')
    .select('id, user_id, game_id, bet, status, params, state, version, created_at')
    .eq('user_id', userId)
    .eq('game_id', game)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw new CasinoError('DATABASE_ERROR', error.message, 500);
  return (data as RoundRow | null) ?? null;
}

async function loadSecret(client: ServiceClient, roundId: string) {
  const { data, error } = await client
    .from('casino_round_secrets')
    .select('secret')
    .eq('round_id', roundId)
    .single();
  if (error || !data) throw new CasinoError('DATABASE_ERROR', 'Round secret missing', 500);
  return data.secret as Record<string, unknown>;
}

function roundJson(client: ServiceClient, userId: string, roundId: string) {
  return rpc(client, 'casino_get_round', { p_user: userId, p_round: roundId });
}

// ---------------------------------------------------------------------------
// Slots & Plinko: one request, one settled round
// ---------------------------------------------------------------------------

async function playSlots(client: ServiceClient, userId: string, body: Record<string, unknown>) {
  const bet = parseBet(body.bet);
  const seeds = await newSeedPair(body.clientSeed as string | undefined);
  const result = spinSlots(await generateFloats(seeds.serverSeed, seeds.clientSeed, 9));

  return rpc(client, 'casino_open_round', {
    p_user: userId,
    p_game: 'slots',
    p_bet: bet,
    p_params: {},
    p_state: {},
    p_server_seed: seeds.serverSeed,
    p_server_seed_hash: seeds.serverSeedHash,
    p_client_seed: seeds.clientSeed,
    p_secret: {},
    p_settle_multiplier: result.multiplier,
    p_settle_state: result,
  });
}

async function playPlinko(client: ServiceClient, userId: string, body: Record<string, unknown>) {
  const bet = parseBet(body.bet);
  const rows = Number(body.rows);
  if (!isPlinkoRows(rows) || !isPlinkoRisk(body.risk)) {
    throw new CasinoError('BAD_REQUEST', 'rows must be 8, 12 or 16 and risk low, medium or high');
  }
  const seeds = await newSeedPair(body.clientSeed as string | undefined);
  const result = dropPlinko(
    rows,
    body.risk,
    await generateFloats(seeds.serverSeed, seeds.clientSeed, rows),
  );

  return rpc(client, 'casino_open_round', {
    p_user: userId,
    p_game: 'plinko',
    p_bet: bet,
    p_params: { rows, risk: body.risk },
    p_state: {},
    p_server_seed: seeds.serverSeed,
    p_server_seed_hash: seeds.serverSeedHash,
    p_client_seed: seeds.clientSeed,
    p_secret: {},
    p_settle_multiplier: result.multiplier,
    p_settle_state: result,
  });
}

// ---------------------------------------------------------------------------
// Mines
// ---------------------------------------------------------------------------

async function playMines(
  client: ServiceClient,
  userId: string,
  action: string,
  body: Record<string, unknown>,
) {
  if (action === 'active') {
    const round = await loadActiveRound(client, userId, 'mines');
    return round ? roundJson(client, userId, round.id) : { round: null };
  }

  if (action === 'start') {
    const bet = parseBet(body.bet);
    const mines = Number(body.mines);
    if (!Number.isInteger(mines) || mines < MINES_MIN || mines > MINES_MAX) {
      throw new CasinoError('BAD_REQUEST', `mines must be between ${MINES_MIN} and ${MINES_MAX}`);
    }
    const active = await loadActiveRound(client, userId, 'mines');
    if (active) {
      throw new CasinoError(
        'ROUND_ACTIVE',
        'Finish your current round first.',
        409,
        await roundJson(client, userId, active.id),
      );
    }
    const seeds = await newSeedPair(body.clientSeed as string | undefined);
    const positions = placeMines(
      mines,
      await generateFloats(seeds.serverSeed, seeds.clientSeed, mines),
    );

    return rpc(client, 'casino_open_round', {
      p_user: userId,
      p_game: 'mines',
      p_bet: bet,
      p_params: { mines },
      p_state: { mines, revealed: [], multiplier: 1 },
      p_server_seed: seeds.serverSeed,
      p_server_seed_hash: seeds.serverSeedHash,
      p_client_seed: seeds.clientSeed,
      p_secret: { positions },
    });
  }

  const round = await loadRound(client, userId, body.roundId, 'mines');
  if (round.status !== 'active') return roundJson(client, userId, round.id);

  const mines = Number(round.params.mines);
  const revealed = (round.state.revealed as number[]) ?? [];
  const positions = (await loadSecret(client, round.id)).positions as number[];

  if (action === 'reveal') {
    const tile = Number(body.tile);
    if (!Number.isInteger(tile) || tile < 0 || tile >= MINES_TILES) {
      throw new CasinoError('BAD_REQUEST', 'tile must be between 0 and 24');
    }
    if (revealed.includes(tile)) return roundJson(client, userId, round.id);

    const nextRevealed = [...revealed, tile];
    if (positions.includes(tile)) {
      return rpc(client, 'casino_settle_round', {
        p_user: userId,
        p_round: round.id,
        p_multiplier: 0,
        p_state: { mines, revealed: nextRevealed, multiplier: 0, hitMine: tile, positions },
        p_expected_version: round.version,
      });
    }

    const multiplier = minesMultiplier(mines, nextRevealed.length);
    if (nextRevealed.length === MINES_TILES - mines) {
      return rpc(client, 'casino_settle_round', {
        p_user: userId,
        p_round: round.id,
        p_multiplier: multiplier,
        p_state: { mines, revealed: nextRevealed, multiplier, positions },
        p_expected_version: round.version,
      });
    }

    return rpc(client, 'casino_update_round_state', {
      p_user: userId,
      p_round: round.id,
      p_expected_version: round.version,
      p_state: { mines, revealed: nextRevealed, multiplier },
    });
  }

  if (action === 'cashout') {
    if (revealed.length === 0) {
      throw new CasinoError('BAD_REQUEST', 'Reveal at least one tile before cashing out.');
    }
    const multiplier = minesMultiplier(mines, revealed.length);
    return rpc(client, 'casino_settle_round', {
      p_user: userId,
      p_round: round.id,
      p_multiplier: multiplier,
      p_state: { mines, revealed, multiplier, positions },
      p_expected_version: round.version,
    });
  }

  throw new CasinoError('BAD_REQUEST', `Unknown mines action '${action}'`);
}

// ---------------------------------------------------------------------------
// Crash: the round runs on the server clock from its created_at.
// ---------------------------------------------------------------------------

async function settleCrashIfDone(
  client: ServiceClient,
  userId: string,
  round: RoundRow,
  cashout: boolean,
) {
  const crashPoint = Number((await loadSecret(client, round.id)).crashPoint);
  const autoCashout =
    typeof round.params.autoCashout === 'number' ? round.params.autoCashout : null;
  const elapsedMs = Date.now() - new Date(round.created_at).getTime();
  const evaluation = evaluateCrash(crashPoint, elapsedMs, autoCashout);

  if (evaluation.state === 'crashed') {
    return rpc(client, 'casino_settle_round', {
      p_user: userId,
      p_round: round.id,
      p_multiplier: 0,
      p_state: { crashPoint },
    });
  }
  if (evaluation.state === 'auto_cashed' || cashout) {
    return rpc(client, 'casino_settle_round', {
      p_user: userId,
      p_round: round.id,
      p_multiplier: evaluation.multiplier,
      p_state: { crashPoint, cashedOutAt: evaluation.multiplier },
    });
  }
  return { ...(await roundJson(client, userId, round.id)), multiplier: evaluation.multiplier };
}

async function playCrash(
  client: ServiceClient,
  userId: string,
  action: string,
  body: Record<string, unknown>,
) {
  if (action === 'active') {
    const round = await loadActiveRound(client, userId, 'crash');
    if (!round) return { round: null };
    return {
      ...(await settleCrashIfDone(client, userId, round, false)),
      serverNow: new Date().toISOString(),
    };
  }

  if (action === 'start') {
    const bet = parseBet(body.bet);
    let autoCashout: number | null = null;
    if (body.autoCashout !== undefined && body.autoCashout !== null) {
      autoCashout = Math.floor(Number(body.autoCashout) * 100) / 100;
      if (!(autoCashout >= CRASH_MIN_AUTO_CASHOUT && autoCashout <= CRASH_MAX_MULTIPLIER)) {
        throw new CasinoError(
          'BAD_REQUEST',
          `autoCashout must be between ${CRASH_MIN_AUTO_CASHOUT} and ${CRASH_MAX_MULTIPLIER}`,
        );
      }
    }

    // A round left running (app closed) is settled as it stands before a new one opens
    const stale = await loadActiveRound(client, userId, 'crash');
    if (stale) await settleCrashIfDone(client, userId, stale, false);
    if (stale && (await loadActiveRound(client, userId, 'crash'))) {
      throw new CasinoError(
        'ROUND_ACTIVE',
        'Finish your current round first.',
        409,
        await roundJson(client, userId, stale.id),
      );
    }

    const seeds = await newSeedPair(body.clientSeed as string | undefined);
    const [float] = await generateFloats(seeds.serverSeed, seeds.clientSeed, 1);
    const result = await rpc(client, 'casino_open_round', {
      p_user: userId,
      p_game: 'crash',
      p_bet: bet,
      p_params: { autoCashout },
      p_state: {},
      p_server_seed: seeds.serverSeed,
      p_server_seed_hash: seeds.serverSeedHash,
      p_client_seed: seeds.clientSeed,
      p_secret: { crashPoint: crashPointFromFloat(float) },
    });
    return { ...result, multiplier: 1, serverNow: new Date().toISOString() };
  }

  const round = await loadRound(client, userId, body.roundId, 'crash');
  if (round.status !== 'active')
    return { ...(await roundJson(client, userId, round.id)), serverNow: new Date().toISOString() };

  if (action === 'status' || action === 'cashout') {
    const result = await settleCrashIfDone(client, userId, round, action === 'cashout');
    return { ...result, serverNow: new Date().toISOString() };
  }

  throw new CasinoError('BAD_REQUEST', `Unknown crash action '${action}'`);
}

// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return jsonError('METHOD_NOT_ALLOWED', 'POST method required', 405);
  }

  try {
    const { user, error: authError } = await authenticateUser(req);
    if (authError || !user) {
      return jsonError('UNAUTHORIZED', authError || 'Authentication required', 401);
    }

    if (!checkRateLimit(user.id)) {
      return jsonError('RATE_LIMITED', 'Too many requests. Please wait a moment.', 429);
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const game = String(body.game ?? '');
    const action = String(body.action ?? '');
    const client = getServiceSupabase();

    if (action === 'config') {
      const { data: limits } = await client.from('casino_config').select('*');
      const { data: wallet } = await client
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
      return jsonOk({ limits: limits ?? [], balance: Number(wallet?.balance ?? 0) });
    }

    if (!isCasinoGameId(game)) {
      return jsonError('BAD_REQUEST', `Unknown casino game '${game}'`, 400);
    }

    let result: unknown;
    if (game === 'slots' && action === 'spin') {
      result = await playSlots(client, user.id, body);
    } else if (game === 'plinko' && action === 'drop') {
      result = await playPlinko(client, user.id, body);
    } else if (game === 'mines') {
      result = await playMines(client, user.id, action, body);
    } else if (game === 'crash') {
      result = await playCrash(client, user.id, action, body);
    } else {
      return jsonError('BAD_REQUEST', `Unknown action '${action}' for ${game}`, 400);
    }

    return jsonOk(result);
  } catch (err) {
    if (err instanceof CasinoError) {
      return jsonError(err.code, err.message, err.status, err.details);
    }
    return jsonError('INTERNAL_ERROR', String(err), 500);
  }
});
