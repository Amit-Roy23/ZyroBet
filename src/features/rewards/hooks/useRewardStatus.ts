import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { rewardApi } from '../api';
import { rewardKeys } from '../keys';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { RewardStatus, DailyRewardConfigItem } from '../types';

const DEFAULT_CONFIG: DailyRewardConfigItem[] = [
  { day: 1, coins: 50 },
  { day: 2, coins: 75 },
  { day: 3, coins: 100 },
  { day: 4, coins: 150 },
  { day: 5, coins: 200 },
  { day: 6, coins: 300 },
  { day: 7, coins: 500 },
];

interface QueryResult {
  status: RewardStatus | null;
  serverOffsetMs: number;
}

export function useRewardStatus() {
  const { user } = useAuthStore();
  const userId = user?.id;

  const query = useQuery<QueryResult>({
    queryKey: rewardKeys.status(userId),
    queryFn: async () => {
      const fetchTime = Date.now();
      const res = await rewardApi.getRewardStatus();
      if (res.error) throw res.error;

      const serverTimeMs = res.status?.serverNow
        ? new Date(res.status.serverNow).getTime()
        : fetchTime;

      return {
        status: res.status,
        serverOffsetMs: serverTimeMs - fetchTime,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Automatically refetch reward status when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        query.refetch();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [query]);

  const status: RewardStatus | undefined = query.data?.status ?? undefined;
  const serverOffsetMs = query.data?.serverOffsetMs ?? 0;

  return {
    status,
    canClaim: status?.canClaim ?? false,
    streak: status?.streak ?? 0,
    longestStreak: status?.longestStreak ?? 0,
    totalClaims: status?.totalClaims ?? 0,
    cycleDay: status?.cycleDay ?? 1,
    claimedDaysInCycle: status?.claimedDaysInCycle ?? 0,
    streakWillReset: status?.streakWillReset ?? false,
    nextClaimAt: status?.nextClaimAt ?? null,
    serverOffsetMs,
    config: status?.config ?? DEFAULT_CONFIG,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    error: query.error,
  };
}
