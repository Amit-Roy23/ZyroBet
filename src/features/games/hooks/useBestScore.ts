import { useGameDailyStatus } from './useGameDailyStatus';
import { mmkvStorage } from '@/lib/mmkv';

export function useBestScore(gameId: string, difficulty?: string): number {
  const { data } = useGameDailyStatus();

  // Check from server daily status first
  const serverGame = data?.games.find((g) => g.gameId === gameId || g.slug === gameId);
  const serverBest = serverGame?.bestScore || 0;

  // Check from local MMKV
  const bestKey = `zyrobet_local_best_${gameId}_${difficulty || 'all'}`;
  const localBest = mmkvStorage.getNumber(bestKey) || 0;

  return Math.max(serverBest, localBest);
}
