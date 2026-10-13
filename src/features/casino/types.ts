import type { CasinoGameId } from '@shared/engines/casino';

export type { CasinoGameId };

export interface CasinoRound<State extends object = object> {
  id: string;
  gameId: CasinoGameId;
  bet: number;
  status: 'active' | 'settled';
  params: Record<string, unknown>;
  state: State;
  multiplier: number | null;
  payout: number;
  serverSeedHash: string;
  clientSeed: string;
  /** Only present once the round is settled. */
  serverSeed: string | null;
  version: number;
  createdAt: string;
  finishedAt: string | null;
}

export interface CasinoResponse<State extends object = object> {
  round: CasinoRound<State> | null;
  balance: number;
  /** Crash: current multiplier while the round is running. */
  multiplier?: number;
  /** Crash: server clock when the response was produced. */
  serverNow?: string;
}

export type CasinoRequest =
  | { game: 'slots'; action: 'spin'; bet: number }
  | { game: 'plinko'; action: 'drop'; bet: number; rows: number; risk: string }
  | { game: 'mines'; action: 'start'; bet: number; mines: number }
  | { game: 'mines'; action: 'reveal'; roundId: string; tile: number }
  | { game: 'mines'; action: 'cashout'; roundId: string }
  | { game: 'mines'; action: 'active' }
  | { game: 'crash'; action: 'start'; bet: number; autoCashout: number | null }
  | { game: 'crash'; action: 'status'; roundId: string }
  | { game: 'crash'; action: 'cashout'; roundId: string }
  | { game: 'crash'; action: 'active' };

export type CasinoMode = 'checking' | 'live' | 'demo';

export class CasinoApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details: unknown = null,
  ) {
    super(message);
    this.name = 'CasinoApiError';
  }
}

/** What every casino game screen receives from `useCasino`. */
export interface CasinoGameProps {
  casino: {
    mode: CasinoMode;
    balance: number;
    play: (req: CasinoRequest, opts?: { revealLater?: boolean }) => Promise<CasinoResponse>;
    reveal: (roundId: string) => void;
  };
}
