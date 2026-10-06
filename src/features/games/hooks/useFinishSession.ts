import { useMutation, useQueryClient } from '@tanstack/react-query';
import { finishSession } from '../api';
import { addPendingSubmission } from '../pendingSubmissions';
import { GameFinishResult } from '../types';
import { walletKeys } from '@/features/wallet/keys';
import { gameKeys } from '../keys';
import { mmkvStorage } from '@/lib/mmkv';

export interface FinishSessionParams {
  sessionId: string | null;
  gameId: string;
  difficulty?: string;
  durationMs: number;
  payload: unknown;
  practice?: boolean;
  localScore?: number;
}

export function useFinishSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: FinishSessionParams): Promise<GameFinishResult & { isPendingQueue?: boolean }> => {
      // 1. Practice Mode
      if (params.practice || !params.sessionId) {
        const bestKey = `zyrobet_local_best_${params.gameId}_${params.difficulty || 'all'}`;
        const prevBest = mmkvStorage.getNumber(bestKey) || 0;
        const score = params.localScore || 0;
        const isNewBest = score > prevBest;
        if (isNewBest) {
          mmkvStorage.set(bestKey, score);
        }

        return {
          score,
          bestScore: Math.max(score, prevBest),
          isNewBest,
          coinsAwarded: 0,
          rewardRaw: 0,
          capReachedGame: false,
          capReachedGlobal: false,
          earnedTodayGame: 0,
          dailyCapGame: 100,
          earnedTodayGlobal: 0,
          dailyCapGlobal: 300,
          balanceAfter: 0,
        };
      }

      // 2. Real Server-Verified Session
      try {
        const result = await finishSession(params.sessionId, params.durationMs, params.payload);

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: walletKeys.all });
        queryClient.invalidateQueries({ queryKey: gameKeys.dailyStatus() });

        // Update local best score cache
        const bestKey = `zyrobet_local_best_${params.gameId}_${params.difficulty || 'all'}`;
        const prevBest = mmkvStorage.getNumber(bestKey) || 0;
        if (result.score > prevBest) {
          mmkvStorage.set(bestKey, result.score);
        }

        return result;
      } catch {
        // If network failure, queue for retry
        if (params.sessionId) {
          addPendingSubmission({
            sessionId: params.sessionId,
            durationMs: params.durationMs,
            payload: params.payload,
          });
        }

        const bestKey = `zyrobet_local_best_${params.gameId}_${params.difficulty || 'all'}`;
        const prevBest = mmkvStorage.getNumber(bestKey) || 0;
        const score = params.localScore || 0;

        return {
          score,
          bestScore: Math.max(score, prevBest),
          isNewBest: score > prevBest,
          coinsAwarded: 0,
          rewardRaw: 0,
          capReachedGame: false,
          capReachedGlobal: false,
          earnedTodayGame: 0,
          dailyCapGame: 100,
          earnedTodayGlobal: 0,
          dailyCapGlobal: 300,
          balanceAfter: 0,
          isPendingQueue: true,
        };
      }
    },
  });
}
