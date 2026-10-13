// DO NOT EDIT - GENERATED FROM shared/engines/casino.ts
/**
 * Casino game math shared by the mobile client and the `casino-play` Edge Function.
 *
 * Every outcome is derived from a list of uniform floats in [0, 1). On the server those
 * floats come from HMAC-SHA256(serverSeed, `${clientSeed}:${cursor}`) (provably fair);
 * in client demo mode they come from a secure local RNG. This file stays pure: no I/O,
 * no randomness of its own.
 */

export type CasinoGameId = 'slots' | 'crash' | 'plinko' | 'mines';

export const CASINO_GAME_IDS: CasinoGameId[] = ['slots', 'crash', 'plinko', 'mines'];

export function isCasinoGameId(id: string): id is CasinoGameId {
  return (CASINO_GAME_IDS as string[]).includes(id);
}

/**
 * Converts raw bytes into floats in [0, 1), 4 bytes per float (big-endian base-256 fraction).
 */
export function bytesToFloats(bytes: Uint8Array): number[] {
  const floats: number[] = [];
  for (let i = 0; i + 4 <= bytes.length; i += 4) {
    floats.push(
      bytes[i] / 256 + bytes[i + 1] / 256 ** 2 + bytes[i + 2] / 256 ** 3 + bytes[i + 3] / 256 ** 4,
    );
  }
  return floats;
}

/** Floors a multiplier to 2 decimals (payouts never round up). */
export function floorMultiplier(m: number): number {
  return Math.floor(m * 100 + 1e-9) / 100;
}

/** Coins paid for a bet at a multiplier; always an integer, never rounded up. */
export function payoutFor(bet: number, multiplier: number): number {
  return Math.floor(bet * multiplier + 1e-9);
}

// ---------------------------------------------------------------------------
// Slots: 3 reels x 3 rows, each row is a payline.
// Symbols and pay structure adapted from n1md7/slot-game (ISC).
// ---------------------------------------------------------------------------

export type SlotSymbol = 'Blank' | '1xBAR' | '2xBAR' | '3xBAR' | 'Seven' | 'Cherry';

export const SLOT_REELS = 3;
export const SLOT_ROWS = 3;

/** Relative weight of each symbol on every reel cell. */
export const SLOT_SYMBOL_WEIGHTS: { symbol: SlotSymbol; weight: number }[] = [
  { symbol: 'Blank', weight: 12 },
  { symbol: '1xBAR', weight: 8 },
  { symbol: '2xBAR', weight: 6 },
  { symbol: '3xBAR', weight: 4 },
  { symbol: 'Seven', weight: 3 },
  { symbol: 'Cherry', weight: 2 },
];

export type SlotLineType = 'AllSame' | 'CherryOrSeven' | 'AnyBar';

/** Line multipliers, applied to the per-line stake (bet / SLOT_ROWS). */
export const SLOT_PAYTABLE = {
  Cherry: 600,
  Seven: 175,
  '3xBAR': 50,
  '2xBAR': 25,
  '1xBAR': 12,
  CherryOrSeven: 20,
  AnyBar: 3,
} as const;

export interface SlotLineWin {
  row: number;
  type: SlotLineType;
  symbol?: SlotSymbol;
  lineMultiplier: number;
}

export interface SlotSpinResult {
  /** grid[reel][row] */
  grid: SlotSymbol[][];
  lines: SlotLineWin[];
  /** Multiplier of the total bet. */
  multiplier: number;
}

const SLOT_TOTAL_WEIGHT = SLOT_SYMBOL_WEIGHTS.reduce((s, w) => s + w.weight, 0);

export function slotSymbolFromFloat(f: number): SlotSymbol {
  let target = f * SLOT_TOTAL_WEIGHT;
  for (const { symbol, weight } of SLOT_SYMBOL_WEIGHTS) {
    if (target < weight) return symbol;
    target -= weight;
  }
  return SLOT_SYMBOL_WEIGHTS[SLOT_SYMBOL_WEIGHTS.length - 1].symbol;
}

const BARS: SlotSymbol[] = ['1xBAR', '2xBAR', '3xBAR'];

export function evaluateSlotLine(symbols: SlotSymbol[]): Omit<SlotLineWin, 'row'> | null {
  const [first] = symbols;
  if (symbols.every((s) => s === first) && first !== 'Blank') {
    return { type: 'AllSame', symbol: first, lineMultiplier: SLOT_PAYTABLE[first] };
  }
  if (symbols.every((s) => s === 'Cherry' || s === 'Seven')) {
    return { type: 'CherryOrSeven', lineMultiplier: SLOT_PAYTABLE.CherryOrSeven };
  }
  if (symbols.every((s) => BARS.includes(s))) {
    return { type: 'AnyBar', lineMultiplier: SLOT_PAYTABLE.AnyBar };
  }
  return null;
}

/** Needs SLOT_REELS * SLOT_ROWS floats. */
export function spinSlots(floats: number[]): SlotSpinResult {
  if (floats.length < SLOT_REELS * SLOT_ROWS) {
    throw new Error('NOT_ENOUGH_ENTROPY');
  }
  const grid: SlotSymbol[][] = [];
  for (let reel = 0; reel < SLOT_REELS; reel++) {
    const column: SlotSymbol[] = [];
    for (let row = 0; row < SLOT_ROWS; row++) {
      column.push(slotSymbolFromFloat(floats[reel * SLOT_ROWS + row]));
    }
    grid.push(column);
  }

  const lines: SlotLineWin[] = [];
  for (let row = 0; row < SLOT_ROWS; row++) {
    const win = evaluateSlotLine(grid.map((column) => column[row]));
    if (win) lines.push({ row, ...win });
  }

  const multiplier = floorMultiplier(
    lines.reduce((sum, l) => sum + l.lineMultiplier, 0) / SLOT_ROWS,
  );
  return { grid, lines, multiplier };
}

// ---------------------------------------------------------------------------
// Plinko. Bin payouts from tanh1c/stake-originals-clone (MIT).
// ---------------------------------------------------------------------------

export type PlinkoRisk = 'low' | 'medium' | 'high';
export type PlinkoRows = 8 | 12 | 16;

export const PLINKO_ROW_OPTIONS: PlinkoRows[] = [8, 12, 16];
export const PLINKO_RISK_OPTIONS: PlinkoRisk[] = ['low', 'medium', 'high'];

export const PLINKO_PAYOUTS: Record<PlinkoRows, Record<PlinkoRisk, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

export function isPlinkoRows(v: unknown): v is PlinkoRows {
  return v === 8 || v === 12 || v === 16;
}

export function isPlinkoRisk(v: unknown): v is PlinkoRisk {
  return v === 'low' || v === 'medium' || v === 'high';
}

export interface PlinkoDropResult {
  rows: PlinkoRows;
  risk: PlinkoRisk;
  /** One entry per peg row: 0 = bounced left, 1 = bounced right. */
  path: (0 | 1)[];
  bin: number;
  multiplier: number;
}

/** Needs `rows` floats. */
export function dropPlinko(rows: PlinkoRows, risk: PlinkoRisk, floats: number[]): PlinkoDropResult {
  if (floats.length < rows) throw new Error('NOT_ENOUGH_ENTROPY');
  const path = floats.slice(0, rows).map((f) => (f < 0.5 ? 0 : 1)) as (0 | 1)[];
  const bin = path.reduce<number>((sum, step) => sum + step, 0);
  return { rows, risk, path, bin, multiplier: PLINKO_PAYOUTS[rows][risk][bin] };
}

// ---------------------------------------------------------------------------
// Mines: 5x5 board, 1% house edge (same formula as tanh1c/stake-originals-clone).
// ---------------------------------------------------------------------------

export const MINES_TILES = 25;
export const MINES_MIN = 1;
export const MINES_MAX = 24;
const MINES_RTP = 0.99;

/** Payout multiplier after `hits` safe reveals on a board with `mines` mines. */
export function minesMultiplier(mines: number, hits: number): number {
  if (hits <= 0) return 1;
  let mult = 1;
  for (let i = 0; i < hits; i++) {
    mult *= (MINES_TILES - i) / (MINES_TILES - mines - i);
  }
  return floorMultiplier(mult * MINES_RTP);
}

/** Picks mine tile indexes with a partial Fisher-Yates shuffle. Needs `mines` floats. */
export function placeMines(mines: number, floats: number[]): number[] {
  if (floats.length < mines) throw new Error('NOT_ENOUGH_ENTROPY');
  const tiles = Array.from({ length: MINES_TILES }, (_, i) => i);
  const picked: number[] = [];
  for (let i = 0; i < mines; i++) {
    const j = i + Math.floor(floats[i] * (MINES_TILES - i));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    picked.push(tiles[i]);
  }
  return picked.sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Crash: multiplier grows as e^(0.1 * seconds); 1% house edge.
// ---------------------------------------------------------------------------

export const CRASH_GROWTH_PER_MS = 0.0001;
export const CRASH_MAX_MULTIPLIER = 1000;
export const CRASH_MIN_AUTO_CASHOUT = 1.01;

/** P(crash >= x) = 0.99 / x. Needs 1 float. */
export function crashPointFromFloat(f: number): number {
  const raw = Math.floor((100 * 0.99) / (1 - f)) / 100;
  return Math.min(CRASH_MAX_MULTIPLIER, Math.max(1, raw));
}

export function crashMultiplierAt(elapsedMs: number): number {
  if (elapsedMs <= 0) return 1;
  return floorMultiplier(Math.exp(CRASH_GROWTH_PER_MS * elapsedMs));
}

/** Milliseconds after start at which the multiplier first reaches `m`. */
export function crashMsForMultiplier(m: number): number {
  if (m <= 1) return 0;
  return Math.ceil(Math.log(m) / CRASH_GROWTH_PER_MS);
}

export type CrashEvaluation =
  | { state: 'running'; multiplier: number }
  | { state: 'crashed'; crashPoint: number }
  | { state: 'auto_cashed'; multiplier: number };

/**
 * Where a crash round stands `elapsedMs` after it started. An auto cash-out target
 * below the crash point always wins at exactly that target, even if nobody asked.
 */
export function evaluateCrash(
  crashPoint: number,
  elapsedMs: number,
  autoCashout: number | null,
): CrashEvaluation {
  const current = crashMultiplierAt(elapsedMs);
  if (autoCashout !== null && autoCashout < crashPoint && current >= autoCashout) {
    return { state: 'auto_cashed', multiplier: autoCashout };
  }
  if (current >= crashPoint) {
    return { state: 'crashed', crashPoint };
  }
  return { state: 'running', multiplier: current };
}

// ---------------------------------------------------------------------------
// Bet limits (mirrors the defaults seeded into public.casino_config).
// ---------------------------------------------------------------------------

export const CASINO_DEFAULT_LIMITS = {
  minBet: 10,
  maxBet: 5000,
};

/** How many floats each game consumes per round. */
export function floatsNeeded(game: CasinoGameId, opts: { rows?: number; mines?: number }): number {
  switch (game) {
    case 'slots':
      return SLOT_REELS * SLOT_ROWS;
    case 'plinko':
      return opts.rows ?? 16;
    case 'mines':
      return opts.mines ?? MINES_MAX;
    case 'crash':
      return 1;
  }
}
