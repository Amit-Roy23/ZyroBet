import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStateStorage } from '@/lib/mmkv';
import { APP_CONFIG } from '@/constants/config';
import { formatCompact } from '@/utils/format';

export interface WalletStoreState {
  balance: number;
  lastSyncedAt: string | null;
  isLoading: boolean;
  displayBalance: () => string;
  setBalance: (balance: number) => void;
  setLoading: (isLoading: boolean) => void;
  creditLocal: (amount: number) => void;
  debitLocal: (amount: number) => boolean;
  creditCoins: (amount: number, reason?: string, description?: string) => void;
  debitCoins: (amount: number, reason?: string, description?: string) => boolean;
  reset: () => void;
}

export const useWalletStore = create<WalletStoreState>()(
  persist(
    (set, get) => ({
      // Starting default is 1,000 for instant cold-start presentation until reconciled
      balance: APP_CONFIG.STARTING_GUEST_COINS,
      lastSyncedAt: null,
      isLoading: false,

      displayBalance: () => {
        return formatCompact(get().balance);
      },

      setBalance: (balance) =>
        set({
          balance: Math.max(0, balance),
          lastSyncedAt: new Date().toISOString(),
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      creditLocal: (amount) =>
        set((state) => ({
          balance: state.balance + Math.abs(amount),
          lastSyncedAt: new Date().toISOString(),
        })),

      debitLocal: (amount) => {
        const { balance } = get();
        const cost = Math.abs(amount);
        if (balance < cost) {
          return false;
        }
        set({
          balance: balance - cost,
          lastSyncedAt: new Date().toISOString(),
        });
        return true;
      },

      creditCoins: (amount) => {
        get().creditLocal(amount);
      },

      debitCoins: (amount) => {
        return get().debitLocal(amount);
      },

      reset: () =>
        set({
          balance: APP_CONFIG.STARTING_GUEST_COINS,
          lastSyncedAt: null,
          isLoading: false,
        }),
    }),
    {
      name: APP_CONFIG.STORAGE_KEYS.WALLET_STATE,
      storage: createJSONStorage(() => mmkvStateStorage),
    },
  ),
);
