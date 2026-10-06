import { useInfiniteQuery } from '@tanstack/react-query';
import { walletApi } from '../api';
import { walletKeys } from '../keys';
import { TransactionFilter, LedgerEntry, PaginationCursor } from '../types';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

// Initial demonstration data for instant UI presentation when offline
const DEMO_TRANSACTIONS: LedgerEntry[] = [
  {
    id: 'tx-demo-1',
    userId: 'guest-player-1',
    delta: 500,
    balanceAfter: 1500,
    reason: 'signup_bonus',
    refId: 'welcome_gift',
    idempotencyKey: 'signup_bonus',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-demo-2',
    userId: 'guest-player-1',
    delta: 250,
    balanceAfter: 1000,
    reason: 'daily_reward',
    refId: 'day_1_streak',
    idempotencyKey: 'daily_1',
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
  {
    id: 'tx-demo-3',
    userId: 'guest-player-1',
    delta: 150,
    balanceAfter: 750,
    reason: 'game_reward',
    refId: 'neon-2048',
    idempotencyKey: 'game_win_2048_1',
    createdAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
  },
  {
    id: 'tx-demo-4',
    userId: 'guest-player-1',
    delta: -50,
    balanceAfter: 600,
    reason: 'spend',
    refId: 'tournament_entry',
    idempotencyKey: 'entry_tourney_1',
    createdAt: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
  },
  {
    id: 'tx-demo-5',
    userId: 'guest-player-1',
    delta: 100,
    balanceAfter: 650,
    reason: 'admin_adjust',
    refId: 'dev_grant',
    idempotencyKey: 'dev_grant_initial',
    createdAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
  },
];

export function useTransactions(filter: TransactionFilter = 'all') {
  const { user } = useAuthStore();
  const userId = user?.id;

  const query = useInfiniteQuery({
    queryKey: walletKeys.transactions(userId, filter),
    queryFn: async ({ pageParam }: { pageParam: PaginationCursor | null }) => {
      const res = await walletApi.getTransactions({
        cursor: pageParam,
        limit: 20,
        filter,
      });

      // If backend has no records yet (e.g. fresh local guest), provide initial sample data
      if (res.items.length === 0 && !pageParam) {
        let items = DEMO_TRANSACTIONS;
        if (filter === 'earned') {
          items = items.filter((i) => i.delta > 0);
        } else if (filter === 'spent') {
          items = items.filter((i) => i.delta < 0);
        }
        return {
          items,
          nextCursor: null,
          hasMore: false,
        };
      }

      return res;
    },
    initialPageParam: null as PaginationCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 30, // 30 seconds
  });

  const transactions: LedgerEntry[] = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    transactions,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    error: query.error,
  };
}
