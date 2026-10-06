import { useMutation } from '@tanstack/react-query';
import { startSession } from '../api';
import { GameProps } from '../types';

export interface StartSessionParams {
  gameId: string;
  difficulty?: string;
}

export function useStartSession() {
  return useMutation({
    mutationFn: async ({ gameId, difficulty }: StartSessionParams): Promise<GameProps['session']> => {
      try {
        const result = await startSession(gameId, difficulty);
        return {
          sessionId: result.sessionId,
          seed: result.seed,
          difficulty: result.difficulty || difficulty,
          practice: false,
        };
      } catch (err) {
        console.warn('[GameHost] Failed to start server session, falling back to practice mode:', err);
        // Offline / Practice mode fallback
        const localSeed = Math.floor(Math.random() * 2147483647) + 1;
        return {
          sessionId: null,
          seed: localSeed,
          difficulty,
          practice: true,
        };
      }
    },
  });
}
