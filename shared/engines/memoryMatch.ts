import { mulberry32 } from './prng';

export type MemoryDifficulty = 'easy' | 'medium' | 'hard';

export interface MemoryMatchConfig {
  difficulty: MemoryDifficulty;
  pairsCount: number;
  rows: number;
  cols: number;
  multiplier: number;
}

export const MEMORY_CONFIGS: Record<MemoryDifficulty, MemoryMatchConfig> = {
  easy: {
    difficulty: 'easy',
    pairsCount: 6,
    rows: 4,
    cols: 3,
    multiplier: 1.0,
  },
  medium: {
    difficulty: 'medium',
    pairsCount: 8,
    rows: 4,
    cols: 4,
    multiplier: 1.5,
  },
  hard: {
    difficulty: 'hard',
    pairsCount: 10,
    rows: 5,
    cols: 4,
    multiplier: 2.0,
  },
};

export interface MemoryCard {
  id: number;
  symbolId: number;
}

export interface MemoryGameState {
  difficulty: MemoryDifficulty;
  cards: MemoryCard[];
  pairsCount: number;
  rows: number;
  cols: number;
}

export interface MemoryFlip {
  i: number;
  t: number;
}

export interface MemoryMatchPayload {
  flips: MemoryFlip[];
}

/**
 * Creates memory match card layout from seed and difficulty.
 */
export function createMemoryMatchGame(
  seed: number,
  difficulty: MemoryDifficulty = 'medium'
): MemoryGameState {
  const config = MEMORY_CONFIGS[difficulty] || MEMORY_CONFIGS.medium;
  const prng = mulberry32(seed);

  // Generate pair symbols 0..(pairsCount-1)
  const symbols: number[] = [];
  for (let s = 0; s < config.pairsCount; s++) {
    symbols.push(s, s);
  }

  const shuffledSymbols = prng.shuffle(symbols);
  const cards: MemoryCard[] = shuffledSymbols.map((symbolId, id) => ({
    id,
    symbolId,
  }));

  return {
    difficulty: config.difficulty,
    cards,
    pairsCount: config.pairsCount,
    rows: config.rows,
    cols: config.cols,
  };
}

/**
 * Pure engine verification for Memory Match session.
 */
export function verifyMemoryMatch(
  seed: number,
  difficulty: string | undefined,
  payload: unknown,
  _claimedDurationMs?: number
): { valid: boolean; score: number; durationMs: number; reason?: string } {
  const diff = (difficulty as MemoryDifficulty) || 'medium';
  const config = MEMORY_CONFIGS[diff];
  if (!config) {
    return { valid: false, score: 0, durationMs: 0, reason: `Invalid difficulty: ${difficulty}` };
  }

  if (!payload || typeof payload !== 'object' || !('flips' in payload)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: flips array required' };
  }

  const flips = (payload as MemoryMatchPayload).flips;
  if (!Array.isArray(flips)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: flips must be an array' };
  }

  if (flips.length === 0 || flips.length % 2 !== 0) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Flips must come in non-empty pairs' };
  }

  const game = createMemoryMatchGame(seed, diff);
  const totalCards = game.cards.length;
  const matchedCards = new Set<number>();
  let matchedPairsCount = 0;

  let lastTimestamp = -1;

  // Verify sequence of flips
  for (let step = 0; step < flips.length; step += 2) {
    const flip1 = flips[step];
    const flip2 = flips[step + 1];

    if (!flip1 || !flip2 || typeof flip1.i !== 'number' || typeof flip2.i !== 'number') {
      return { valid: false, score: 0, durationMs: 0, reason: `Invalid flip structure at pair ${step / 2 + 1}` };
    }

    if (flip1.i < 0 || flip1.i >= totalCards || flip2.i < 0 || flip2.i >= totalCards) {
      return { valid: false, score: 0, durationMs: 0, reason: `Card index out of bounds at pair ${step / 2 + 1}` };
    }

    if (flip1.i === flip2.i) {
      return { valid: false, score: 0, durationMs: 0, reason: `Cannot flip the exact same card in pair ${step / 2 + 1}` };
    }

    if (matchedCards.has(flip1.i) || matchedCards.has(flip2.i)) {
      return { valid: false, score: 0, durationMs: 0, reason: `Attempted to flip already-matched card at pair ${step / 2 + 1}` };
    }

    // Timing check
    if (typeof flip1.t !== 'number' || typeof flip2.t !== 'number') {
      return { valid: false, score: 0, durationMs: 0, reason: 'Timestamps must be numeric milliseconds' };
    }

    if (flip1.t < 0 || flip2.t < 0) {
      return { valid: false, score: 0, durationMs: 0, reason: 'Timestamps must be non-negative' };
    }

    if (step > 0 && flip1.t - lastTimestamp < 150) {
      return {
        valid: false,
        score: 0,
        durationMs: 0,
        reason: `Flips too fast (< 150ms) at step ${step}`,
      };
    }

    if (flip2.t - flip1.t < 150) {
      return {
        valid: false,
        score: 0,
        durationMs: 0,
        reason: `Pair second flip too fast (< 150ms) at step ${step + 1}`,
      };
    }

    lastTimestamp = flip2.t;

    // Check if match
    const sym1 = game.cards[flip1.i].symbolId;
    const sym2 = game.cards[flip2.i].symbolId;

    if (sym1 === sym2) {
      matchedCards.add(flip1.i);
      matchedCards.add(flip2.i);
      matchedPairsCount++;
    }
  }

  if (matchedPairsCount !== config.pairsCount) {
    return {
      valid: false,
      score: 0,
      durationMs: lastTimestamp,
      reason: `Not all pairs were matched (${matchedPairsCount}/${config.pairsCount})`,
    };
  }

  const moves = flips.length / 2;
  const durationMs = lastTimestamp;

  const pairs = config.pairsCount;
  const timeBonus = Math.max(0, Math.floor((pairs * 4000 - durationMs) / 100));
  const missPenalty = (moves - pairs) * 15;
  const rawScore = Math.max(50, pairs * 100 + timeBonus - missPenalty);
  const finalScore = Math.round(rawScore * config.multiplier);

  return {
    valid: true,
    score: finalScore,
    durationMs,
  };
}
