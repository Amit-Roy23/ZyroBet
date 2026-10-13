/**
 * Local demo backend, used when the `casino-play` Edge Function is unreachable
 * (no Supabase project configured, signed out, or the function is not deployed).
 * It plays with a separate in-memory demo balance and never touches the real wallet.
 */
import { getRandomBytes } from 'expo-crypto';
import {
  CASINO_DEFAULT_LIMITS,
  MINES_TILES,
  bytesToFloats,
  crashPointFromFloat,
  dropPlinko,
  evaluateCrash,
  isPlinkoRisk,
  isPlinkoRows,
  minesMultiplier,
  payoutFor,
  placeMines,
  spinSlots,
} from '@shared/engines/casino';
import { CasinoApiError, CasinoRequest, CasinoResponse, CasinoRound as Round } from './types';

type CasinoRound = Round<Record<string, unknown>>;

export const DEMO_STARTING_BALANCE = 10000;

let demoBalance = DEMO_STARTING_BALANCE;
const rounds = new Map<string, CasinoRound>();
const secrets = new Map<string, { positions?: number[]; crashPoint?: number }>();

function randomFloats(count: number): number[] {
  return bytesToFloats(getRandomBytes(count * 4));
}

function randomId(): string {
  return Array.from(getRandomBytes(16), (b) => b.toString(16).padStart(2, '0')).join('');
}

function respond(round: CasinoRound | null, extra: Partial<CasinoResponse> = {}): CasinoResponse {
  return {
    round: round ? { ...round, state: { ...round.state } } : null,
    balance: demoBalance,
    ...extra,
  };
}

function openRound(
  game: CasinoRound['gameId'],
  bet: number,
  params: Record<string, unknown>,
  state: Record<string, unknown>,
) {
  if (
    !Number.isInteger(bet) ||
    bet < CASINO_DEFAULT_LIMITS.minBet ||
    bet > CASINO_DEFAULT_LIMITS.maxBet
  ) {
    throw new CasinoApiError('INVALID_BET', 'Bet is outside the allowed limits.');
  }
  if (bet > demoBalance) {
    throw new CasinoApiError('INSUFFICIENT_COINS', 'Not enough coins for this bet.');
  }
  demoBalance -= bet;
  const round: CasinoRound = {
    id: randomId(),
    gameId: game,
    bet,
    status: 'active',
    params,
    state,
    multiplier: null,
    payout: 0,
    serverSeedHash: 'demo',
    clientSeed: 'demo',
    serverSeed: null,
    version: 0,
    createdAt: new Date().toISOString(),
    finishedAt: null,
  };
  rounds.set(round.id, round);
  return round;
}

function settle(round: CasinoRound, multiplier: number, state?: Record<string, unknown>) {
  if (round.status === 'settled') return round;
  round.status = 'settled';
  round.multiplier = multiplier;
  round.payout = payoutFor(round.bet, multiplier);
  round.state = state ?? round.state;
  round.serverSeed = 'demo';
  round.version += 1;
  round.finishedAt = new Date().toISOString();
  demoBalance += round.payout;
  return round;
}

function getRound(roundId: string, game: string): CasinoRound {
  const round = rounds.get(roundId);
  if (!round || round.gameId !== game)
    throw new CasinoApiError('ROUND_NOT_FOUND', 'Round not found.');
  return round;
}

function activeRound(game: string): CasinoRound | null {
  for (const round of rounds.values()) {
    if (round.gameId === game && round.status === 'active') return round;
  }
  return null;
}

function crashTick(round: CasinoRound, cashout: boolean): CasinoResponse {
  const crashPoint = secrets.get(round.id)?.crashPoint ?? 1;
  const autoCashout =
    typeof round.params.autoCashout === 'number' ? round.params.autoCashout : null;
  const evaluation = evaluateCrash(
    crashPoint,
    Date.now() - Date.parse(round.createdAt),
    autoCashout,
  );
  const serverNow = new Date().toISOString();

  if (evaluation.state === 'crashed') {
    return respond(settle(round, 0, { crashPoint }), { serverNow });
  }
  if (evaluation.state === 'auto_cashed' || cashout) {
    return respond(
      settle(round, evaluation.multiplier, { crashPoint, cashedOutAt: evaluation.multiplier }),
      { serverNow },
    );
  }
  return respond(round, { multiplier: evaluation.multiplier, serverNow });
}

export function demoBalanceNow(): number {
  return demoBalance;
}

export async function demoCall(req: CasinoRequest): Promise<CasinoResponse> {
  switch (req.game) {
    case 'slots': {
      const result = spinSlots(randomFloats(9));
      const round = openRound('slots', req.bet, {}, {});
      return respond(
        settle(round, result.multiplier, result as unknown as Record<string, unknown>),
      );
    }

    case 'plinko': {
      if (!isPlinkoRows(req.rows) || !isPlinkoRisk(req.risk)) {
        throw new CasinoApiError('BAD_REQUEST', 'Invalid rows or risk.');
      }
      const result = dropPlinko(req.rows, req.risk, randomFloats(req.rows));
      const round = openRound('plinko', req.bet, { rows: req.rows, risk: req.risk }, {});
      return respond(
        settle(round, result.multiplier, result as unknown as Record<string, unknown>),
      );
    }

    case 'mines': {
      if (req.action === 'active') return respond(activeRound('mines'));
      if (req.action === 'start') {
        const existing = activeRound('mines');
        if (existing)
          throw new CasinoApiError(
            'ROUND_ACTIVE',
            'Finish your current round first.',
            respond(existing),
          );
        const round = openRound(
          'mines',
          req.bet,
          { mines: req.mines },
          { mines: req.mines, revealed: [], multiplier: 1 },
        );
        secrets.set(round.id, { positions: placeMines(req.mines, randomFloats(req.mines)) });
        return respond(round);
      }

      const round = getRound(req.roundId, 'mines');
      if (round.status !== 'active') return respond(round);
      const mines = Number(round.params.mines);
      const revealed = (round.state.revealed as number[]) ?? [];
      const positions = secrets.get(round.id)?.positions ?? [];

      if (req.action === 'reveal') {
        if (revealed.includes(req.tile)) return respond(round);
        const next = [...revealed, req.tile];
        if (positions.includes(req.tile)) {
          return respond(
            settle(round, 0, {
              mines,
              revealed: next,
              multiplier: 0,
              hitMine: req.tile,
              positions,
            }),
          );
        }
        const multiplier = minesMultiplier(mines, next.length);
        if (next.length === MINES_TILES - mines) {
          return respond(
            settle(round, multiplier, { mines, revealed: next, multiplier, positions }),
          );
        }
        round.state = { mines, revealed: next, multiplier };
        round.version += 1;
        return respond(round);
      }

      if (revealed.length === 0) {
        throw new CasinoApiError('BAD_REQUEST', 'Reveal at least one tile before cashing out.');
      }
      const multiplier = minesMultiplier(mines, revealed.length);
      return respond(settle(round, multiplier, { mines, revealed, multiplier, positions }));
    }

    case 'crash': {
      if (req.action === 'active') {
        const round = activeRound('crash');
        return round ? crashTick(round, false) : respond(null);
      }
      if (req.action === 'start') {
        const stale = activeRound('crash');
        if (stale) crashTick(stale, false);
        if (activeRound('crash'))
          throw new CasinoApiError('ROUND_ACTIVE', 'Finish your current round first.');
        const round = openRound('crash', req.bet, { autoCashout: req.autoCashout }, {});
        secrets.set(round.id, { crashPoint: crashPointFromFloat(randomFloats(1)[0]) });
        return respond(round, { multiplier: 1, serverNow: new Date().toISOString() });
      }
      return crashTick(getRound(req.roundId, 'crash'), req.action === 'cashout');
    }
  }
}
