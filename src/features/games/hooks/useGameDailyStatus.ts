import { useQuery } from '@tanstack/react-query';
import { gameKeys } from '../keys';
import { fetchGameDailyStatus } from '../api';
import { GameDailyStatusData } from '../types';

export function useGameDailyStatus() {
  return useQuery<GameDailyStatusData>({
    queryKey: gameKeys.dailyStatus(),
    queryFn: fetchGameDailyStatus,
    staleTime: 60 * 1000,
  });
}
