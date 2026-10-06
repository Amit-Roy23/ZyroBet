import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '../api';
import { walletKeys } from '../keys';
import { useWalletStore } from '../store';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { hapticFeedback } from '@/lib/haptics';
import { formatCoins } from '@/utils/format';
import { logger } from '@/utils/logger';

export function useWallet() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { balance: storeBalance, setBalance } = useWalletStore();
  const { showToast } = useToast();

  const userId = user?.id;

  // 1. TanStack Query for wallet balance
  const {
    data: walletData,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery({
    queryKey: walletKeys.balance(userId),
    queryFn: async () => {
      const res = await walletApi.getBalance();
      if (res.wallet) {
        setBalance(res.wallet.balance);
        return res.wallet;
      }
      return {
        userId: userId || 'local',
        balance: storeBalance,
        updatedAt: new Date().toISOString(),
      };
    },
    initialData: {
      userId: userId || 'local',
      balance: storeBalance,
      updatedAt: new Date().toISOString(),
    },
    staleTime: 1000 * 30, // 30 seconds
  });

  // Current effective balance (synced between query data and store)
  const balance = walletData?.balance ?? storeBalance;

  // 2. Supabase Realtime Subscription for live balance updates
  useEffect(() => {
    if (!userId) return;

    logger.info('[Wallet Realtime] Subscribing to wallet updates for user:', userId);

    const channel = supabase
      .channel(`wallet_realtime_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('[Wallet Realtime] Received live wallet event:', payload);
          if (payload.new && 'balance' in payload.new) {
            const newRow = payload.new as Record<string, any>;
            const newBalance = Number(newRow.balance);
            setBalance(newBalance);
            queryClient.setQueryData(walletKeys.balance(userId), (old: any) => ({
              ...old,
              balance: newBalance,
              updatedAt: newRow.updated_at,
            }));
            queryClient.invalidateQueries({ queryKey: walletKeys.transactions(userId) });
          }
        },
      )
      .subscribe();

    return () => {
      logger.info('[Wallet Realtime] Unsubscribing from wallet channel');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, setBalance]);

  // 3. DEV Grant mutation
  const devGrantMutation = useMutation({
    mutationFn: () => walletApi.devGrant(),
    onSuccess: (res) => {
      if (res.error) {
        showToast({ message: res.error.message, type: 'error' });
        return;
      }
      setBalance(res.balance);
      queryClient.setQueryData(walletKeys.balance(userId), (old: any) => ({
        ...old,
        balance: res.balance,
      }));
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions(userId) });

      hapticFeedback.success();
      showToast({
        message: `+100 Dev Virtual Coins Granted! (New Balance: ${formatCoins(res.balance)})`,
        type: 'coin',
      });
    },
    onError: (err: any) => {
      showToast({ message: err?.message || 'Dev grant failed', type: 'error' });
    },
  });

  return {
    balance,
    isLoading: isLoading && !storeBalance,
    isRefetching,
    refetch,
    error,
    devGrant: () => devGrantMutation.mutate(),
    isGranting: devGrantMutation.isPending,
  };
}
