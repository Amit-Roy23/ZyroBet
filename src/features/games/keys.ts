export const gameKeys = {
  all: ['games'] as const,
  catalog: () => [...gameKeys.all, 'catalog'] as const,
  dailyStatus: () => [...gameKeys.all, 'daily-status'] as const,
  bestScore: (gameId: string, difficulty?: string) =>
    [...gameKeys.all, 'best-score', gameId, difficulty || 'all'] as const,
};
