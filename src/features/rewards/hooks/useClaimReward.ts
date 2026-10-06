import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rewardApi } from '../api';
import { rewardKeys } from '../keys';
import { walletKeys } from '@/features/wallet/keys';
import { useWalletStore } from '@/features/wallet/store/useWalletStore';
import { useToast } from '@/components/ui/Toast';
import { hapticFeedback } from '@/lib/haptics';
import { rescheduleReminders } from '../notifications/scheduler';
import { ClaimResult } from '../types';

export function useClaimReward() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await rewardApi.claimDailyReward();
      if (res.error) {
        throw res.error;
      }
      return res.result;
    },
    onSuccess: async (result) => {
      if (!result) return;

      setClaimResult(result);

      // Reconcile wallet balance with server balanceAfter
      useWalletStore.getState().setBalance(result.balanceAfter);

      // Invalidate queries to refresh state across app
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rewardKeys.all }),
        queryClient.invalidateQueries({ queryKey: walletKeys.all }),
      ]);

      // Reschedule next daily reminder
      const latestStatus = queryClient.getQueryData<any>(rewardKeys.all);
      rescheduleReminders(latestStatus);
    },
    onError: (error: any) => {
      if (error?.code === 'ALREADY_CLAIMED' || error?.message?.includes('ALREADY_CLAIMED')) {
        queryClient.invalidateQueries({ queryKey: rewardKeys.all });
        showToast({
          message: 'Already claimed today! Next reward unlocks at midnight.',
          type: 'info',
        });
      } else {
        hapticFeedback.error();
        showToast({
          message: error?.message || 'Failed to claim daily reward. Please retry.',
          type: 'error',
        });
      }
    },
  });

  return {
    claim: () => mutation.mutate(),
    isLoading: mutation.isPending,
    claimResult,
    clearClaimResult: () => setClaimResult(null),
    error: mutation.error,
  };
}
