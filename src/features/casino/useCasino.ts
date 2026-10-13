import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useWalletStore } from '@/features/wallet/store/useWalletStore';
import { walletKeys } from '@/features/wallet/keys';
import { casinoCall, checkCasinoAvailable } from './api';
import { demoBalanceNow, demoCall } from './demo';
import { CasinoMode, CasinoRequest, CasinoResponse } from './types';

interface CasinoStore {
  mode: CasinoMode;
  /** User the mode was checked for; signing in or out triggers a new check. */
  checkedUser: string | undefined;
  demoBalance: number;
  /** Payouts already credited on the server but still animating on screen, by round id. */
  hiddenPayouts: Record<string, number>;
  setMode: (mode: CasinoMode) => void;
  setChecked: (userId: string | undefined) => void;
  setDemoBalance: (balance: number) => void;
  hidePayout: (roundId: string, payout: number) => void;
  revealPayout: (roundId: string) => void;
}

const useCasinoStore = create<CasinoStore>((set) => ({
  mode: 'checking',
  checkedUser: undefined,
  demoBalance: demoBalanceNow(),
  hiddenPayouts: {},
  setMode: (mode) => set({ mode }),
  setChecked: (checkedUser: string | undefined) => set({ checkedUser }),
  setDemoBalance: (demoBalance) => set({ demoBalance }),
  hidePayout: (roundId, payout) =>
    set((s) => ({ hiddenPayouts: { ...s.hiddenPayouts, [roundId]: payout } })),
  revealPayout: (roundId) =>
    set((s) => {
      const { [roundId]: _revealed, ...rest } = s.hiddenPayouts;
      return { hiddenPayouts: rest };
    }),
}));

/**
 * Shared state for every casino screen: whether bets go to the server (live, real
 * wallet) or to the local demo backend, the balance to show, and `play` to send an action.
 */
export function useCasino() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const walletBalance = useWalletStore((s) => s.balance);
  const setWalletBalance = useWalletStore((s) => s.setBalance);
  const {
    mode,
    checkedUser,
    demoBalance,
    hiddenPayouts,
    setMode,
    setChecked,
    setDemoBalance,
    hidePayout,
    revealPayout,
  } = useCasinoStore();

  const syncWallet = useCallback(
    (balance: number) => {
      setWalletBalance(balance);
      queryClient.setQueryData(walletKeys.balance(userId), (old: object | undefined) => ({
        ...(old ?? {}),
        balance,
        updatedAt: new Date().toISOString(),
      }));
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions(userId) });
    },
    [queryClient, setWalletBalance, userId],
  );

  const needsCheck = mode === 'checking' || checkedUser !== userId;

  useEffect(() => {
    if (!needsCheck) return;
    let active = true;
    checkCasinoAvailable().then((res) => {
      if (!active) return;
      if (res.live && res.balance !== undefined) syncWallet(res.balance);
      setChecked(userId);
      setMode(res.live ? 'live' : 'demo');
    });
    return () => {
      active = false;
    };
  }, [needsCheck, userId, setChecked, setMode, syncWallet]);

  /**
   * Sends one action. With `revealLater`, a win stays out of the displayed balance
   * until `reveal(roundId)` is called (when the reels stop or the ball lands).
   */
  const play = useCallback(
    async (req: CasinoRequest, opts: { revealLater?: boolean } = {}): Promise<CasinoResponse> => {
      const res = mode === 'live' ? await casinoCall(req) : await demoCall(req);
      if (opts.revealLater && res.round && res.round.payout > 0) {
        hidePayout(res.round.id, res.round.payout);
      }
      if (mode === 'live') {
        if (typeof res.balance === 'number') syncWallet(res.balance);
      } else {
        setDemoBalance(res.balance);
      }
      return res;
    },
    [mode, hidePayout, setDemoBalance, syncWallet],
  );

  const hidden = Object.values(hiddenPayouts).reduce((sum, p) => sum + p, 0);
  const balance = (mode === 'live' ? walletBalance : demoBalance) - hidden;

  return {
    mode: needsCheck ? ('checking' as const) : mode,
    ready: !needsCheck,
    balance: Math.max(0, balance),
    play,
    reveal: revealPayout,
  };
}
