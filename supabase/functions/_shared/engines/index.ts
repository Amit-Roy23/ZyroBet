// DO NOT EDIT - GENERATED FROM shared/engines/index.ts
import { verify2048 } from './game2048.ts';
import { verifyMemoryMatch } from './memoryMatch.ts';
import { verifyReaction } from './reaction.ts';
import { verifyWordSprint } from './wordSprint.ts';
import { verifyQuizRush } from './quizRush.ts';
import { verifyCyberRunner } from './cyberRunner.ts';
import { verifyColorFlow } from './colorFlow.ts';
import { verifySoundMatch } from './soundMatch.ts';
import { verifyTargetSniper } from './targetSniper.ts';

export * from './prng.ts';
export * from './game2048.ts';
export * from './memoryMatch.ts';
export * from './reaction.ts';
export * from './wordSprint.ts';
export * from './quizRush.ts';
export * from './cyberRunner.ts';
export * from './colorFlow.ts';
export * from './soundMatch.ts';
export * from './targetSniper.ts';

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
