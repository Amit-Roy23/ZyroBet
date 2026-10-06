import { supabase } from '@/lib/supabase';
import { RewardStatus, ClaimResult, DailyRewardConfigItem } from './types';
import { normalizeError, AppError } from '@/services/errorService';

const DEFAULT_CONFIG: DailyRewardConfigItem[] = [
  { day: 1, coins: 50 },
  { day: 2, coins: 75 },
  { day: 3, coins: 100 },
  { day: 4, coins: 150 },
  { day: 5, coins: 200 },
  { day: 6, coins: 300 },
  { day: 7, coins: 500 },
];

export const rewardApi = {
  /**
   * Fetch current daily reward status from server
   */
  async getRewardStatus(): Promise<{ status: RewardStatus | null; error: AppError | null }> {
    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: RewardStatus;
        error?: { code: string; message: string };
      }>('daily-reward-status');

      if (!error && data?.data) {
        return { status: data.data, error: null };
      }

      // Fallback calculation for offline / local mode
      const now = new Date();
      const nextMidnightUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

      const fallbackStatus: RewardStatus = {
        streak: 1,
        longestStreak: 3,
        totalClaims: 5,
        cycleDay: 1,
        claimedDaysInCycle: 0,
        canClaim: true,
        lastClaimDate: null,
        streakWillReset: false,
        nextClaimAt: nextMidnightUtc.toISOString(),
        serverNow: now.toISOString(),
        config: DEFAULT_CONFIG,
      };

      return { status: fallbackStatus, error: null };
    } catch (err) {
      return { status: null, error: normalizeError(err) };
    }
  },

  /**
   * Atomic daily reward claim on server
   */
  async claimDailyReward(): Promise<{ result: ClaimResult | null; error: AppError | null }> {
    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: ClaimResult;
        error?: { code: string; message: string };
      }>('daily-reward-claim');

      if (error || !data?.success || !data.data) {
        const errObj = error || data?.error;
        return {
          result: null,
          error: {
            code: (errObj as any)?.code || 'CLAIM_FAILED',
            message: (errObj as any)?.message || 'Failed to claim daily reward',
          },
        };
      }

      return { result: data.data, error: null };
    } catch (err) {
      return { result: null, error: normalizeError(err) };
    }
  },
};
