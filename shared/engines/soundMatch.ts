import { mulberry32 } from './prng';

export interface SoundMatchPayload {
  roundsCompleted: number;
  totalNotesMatched: number;
  actions: {
    round: number;
    padIndex: number;
    timestamp: number;
  }[];
}

export const SOUND_PADS_COUNT = 4; // 4 pads: Emerald, Cyan, Amber, Violet
export const MAX_ROUNDS = 8;

export function getSoundMatchSequence(seed: number, rounds = MAX_ROUNDS): number[][] {
  const prng = mulberry32(seed);
  const sequence: number[] = [];

  // Generate continuous sequence up to 10 notes
  for (let i = 0; i < rounds + 2; i++) {
    sequence.push(prng.nextInt(SOUND_PADS_COUNT));
  }

  const roundSequences: number[][] = [];
  for (let r = 1; r <= rounds; r++) {
    roundSequences.push(sequence.slice(0, r + 2)); // Round 1 = 3 notes, Round 2 = 4 notes, etc.
  }

  return roundSequences;
}

export function verifySoundMatch(
  seed: number,
  payload: unknown,
  claimedDurationMs?: number
): { valid: boolean; score: number; durationMs: number; reason?: string } {
  if (!payload || typeof payload !== 'object' || !('actions' in payload)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'Invalid payload: actions array required' };
  }

  const p = payload as SoundMatchPayload;
  if (!Array.isArray(p.actions)) {
    return { valid: false, score: 0, durationMs: 0, reason: 'actions must be an array' };
  }

  const roundSequences = getSoundMatchSequence(seed);
  let totalScore = 0;
  let actionIdx = 0;
  let roundsPassed = 0;

  for (let r = 0; r < roundSequences.length; r++) {
    const expectedNotes = roundSequences[r];
    let roundSuccess = true;

    for (let n = 0; n < expectedNotes.length; n++) {
      const act = p.actions[actionIdx];
      if (!act || act.padIndex !== expectedNotes[n]) {
        roundSuccess = false;
        break;
      }
      actionIdx++;
      totalScore += 50; // 50 pts per correct note
    }

    if (!roundSuccess) break;

    roundsPassed++;
    totalScore += 200 * roundsPassed; // Round bonus scaling with depth
  }

  return {
    valid: true,
    score: totalScore,
    durationMs: claimedDurationMs ?? roundsPassed * 3000,
  };
}
