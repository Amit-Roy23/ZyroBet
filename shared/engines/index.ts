import { verify2048 } from './game2048';
import { verifyMemoryMatch } from './memoryMatch';
import { verifyReaction } from './reaction';
import { verifyWordSprint } from './wordSprint';
import { verifyQuizRush } from './quizRush';
import { verifyCyberRunner } from './cyberRunner';
import { verifyColorFlow } from './colorFlow';
import { verifySoundMatch } from './soundMatch';
import { verifyTargetSniper } from './targetSniper';

export * from './prng';
export * from './game2048';
export * from './memoryMatch';
export * from './reaction';
export * from './wordSprint';
export * from './quizRush';
export * from './cyberRunner';
export * from './colorFlow';
export * from './soundMatch';
export * from './targetSniper';

export interface EngineVerificationResult {
  valid: boolean;
  score: number;
  durationMs: number;
  reason?: string;
}

/**
 * Universal verification router for all ZyroBet mini-game engines.
 */
export function verify(
  gameId: string,
  difficulty: string | undefined,
  seed: number | bigint,
  payload: unknown,
  durationMs?: number
): EngineVerificationResult {
  const numSeed = Number(seed);
  const normalizedGameId = gameId.toLowerCase().trim();

  switch (normalizedGameId) {
    case 'game-2048':
    case 'neon-2048':
      return verify2048(numSeed, payload, durationMs);

    case 'memory-match':
    case 'memory-matrix':
      return verifyMemoryMatch(numSeed, difficulty, payload, durationMs);

    case 'tap-reaction':
    case 'tap-reflex':
      return verifyReaction(numSeed, payload, durationMs);

    case 'word-sprint':
      return verifyWordSprint(numSeed, payload, durationMs);

    case 'quiz-rush':
      return verifyQuizRush(numSeed, payload, durationMs);

    case 'cyber-runner':
      return verifyCyberRunner(numSeed, payload, durationMs);

    case 'color-flow':
      return verifyColorFlow(numSeed, payload, durationMs);

    case 'sound-match':
      return verifySoundMatch(numSeed, payload, durationMs);

    case 'target-sniper':
      return verifyTargetSniper(numSeed, payload, durationMs);

    default:
      return {
        valid: false,
        score: 0,
        durationMs: 0,
        reason: `Unknown or unsupported game ID: ${gameId}`,
      };
  }
}
