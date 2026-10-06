import { mulberry32 } from './prng';

export interface SniperTarget {
  id: number;
  durationMs: number; // Duration of contraction cycle (e.g. 1200ms - 2500ms)
  targetRadiusRatio: number; // 0.35
}

export interface TargetSniperPayload {
  taps: {
    targetId: number;
    deltaMs: number; // distance in ms from perfect alignment (0ms = perfect)
    score: number;
  }[];
}

export const SNIPER_ROUNDS_COUNT = 8;

export function getSniperTargets(seed: number, count = SNIPER_ROUNDS_COUNT): SniperTarget[] {
  const prng = mulberry32(seed);
  const targets: SniperTarget[] = [];

  for (let i = 0; i < count; i++) {
    const durationMs = 1400 + prng.nextInt(1200); // 1400ms to 2600ms
    targets.push({
      id: i + 1,
      durationMs,
      targetRadiusRatio: 0.35,
    });
  }

  return targets;
}

export function verifyTargetSniper(
  seed: number,
  payload: unknown,
  claimedDurationMs?: number
): { valid: boolean; score: number; durationMs: number; reason?: string } {
  if (!payload || typeof payload !== 'object' || !('taps' in payload)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: taps array required' };
  }

  const p = payload as TargetSniperPayload;
  if (!Array.isArray(p.taps)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'taps must be an array' };
  }

  let totalScore = 0;
  let combo = 0;

  for (const tap of p.taps) {
    const absDelta = Math.abs(tap.deltaMs || 0);
    let roundPoints = 0;

    if (absDelta <= 30) {
      // Bullseye PERFECT!
      roundPoints = 300;
      combo += 1;
    } else if (absDelta <= 80) {
      // GREAT
      roundPoints = 200;
      combo += 1;
    } else if (absDelta <= 150) {
      // GOOD
      roundPoints = 100;
      combo = 0;
    } else {
      // MISS
      roundPoints = 20;
      combo = 0;
    }

    const multiplier = Math.min(2.5, 1 + combo * 0.25);
    totalScore += Math.round(roundPoints * multiplier);
  }

  return {
    valid: true,
    score: totalScore,
    durationMs: claimedDurationMs ?? SNIPER_ROUNDS_COUNT * 2000,
  };
}
