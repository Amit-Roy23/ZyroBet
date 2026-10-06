import { mulberry32 } from './prng';

export interface ReactionRound {
  ms: number | null; // null represents false start (tapped too early)
}

export interface ReactionPayload {
  rounds: ReactionRound[];
}

export const REACTION_ROUNDS_COUNT = 5;
export const MIN_REACTION_MS = 80;
export const MAX_REACTION_MS = 2000;

/**
 * Generates 5 seeded delays in the range [1500ms, 4500ms].
 */
export function getReactionDelays(seed: number): number[] {
  const prng = mulberry32(seed);
  const delays: number[] = [];
  for (let i = 0; i < REACTION_ROUNDS_COUNT; i++) {
    delays.push(1500 + prng.nextInt(3001)); // 1500 to 4500 inclusive
  }
  return delays;
}

/**
 * Pure engine verification for Tap Reaction session.
 */
export function verifyReaction(
  seed: number,
  payload: unknown,
  claimedDurationMs?: number
): { valid: boolean; score: number; durationMs: number; reason?: string } {
  if (!payload || typeof payload !== 'object' || !('rounds' in payload)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: rounds array required' };
  }

  const rounds = (payload as ReactionPayload).rounds;
  if (!Array.isArray(rounds) || rounds.length !== REACTION_ROUNDS_COUNT) {
    return {
      valid: false,
      score: 0,
      durationMs: 0,
      reason: `Payload must contain exactly ${REACTION_ROUNDS_COUNT} rounds`,
    };
  }

  const delays = getReactionDelays(seed);
  const minRequiredDurationMs = delays.reduce((acc, d) => acc + d, 0);

  if (claimedDurationMs !== undefined && claimedDurationMs < minRequiredDurationMs) {
    return {
      valid: false,
      score: 0,
      durationMs: claimedDurationMs,
      reason: `Claimed duration ${claimedDurationMs}ms is shorter than sum of seeded wait delays (${minRequiredDurationMs}ms)`,
    };
  }

  let totalScore = 0;
  let estimatedPlayDurationMs = minRequiredDurationMs;

  for (let i = 0; i < REACTION_ROUNDS_COUNT; i++) {
    const round = rounds[i];
    if (!round || typeof round !== 'object') {
      return { valid: false, score: 0, durationMs: 0, reason: `Round ${i + 1} is invalid` };
    }

    const ms = round.ms;
    if (ms === null) {
      // False start: 0 score
      totalScore += 0;
    } else if (typeof ms === 'number') {
      if (ms < MIN_REACTION_MS || ms > MAX_REACTION_MS) {
        return {
          valid: false,
          score: 0,
          durationMs: 0,
          reason: `Round ${i + 1} reaction time ${ms}ms out of acceptable range [${MIN_REACTION_MS}, ${MAX_REACTION_MS}]`,
        };
      }
      const roundScore = Math.max(0, 1000 - ms);
      totalScore += roundScore;
      estimatedPlayDurationMs += ms;
    } else {
      return { valid: false, score: 0, durationMs: 0, reason: `Round ${i + 1} ms must be a number or null` };
    }
  }

  return {
    valid: true,
    score: totalScore,
    durationMs: claimedDurationMs ?? estimatedPlayDurationMs,
  };
}
