import { TransactionFilter } from './types';

/**
 * TanStack Query Key Factory for Wallet & Ledger queries
 */
export const walletKeys = {
  all: ['wallet'] as const,
  balance: (userId?: string) => [...walletKeys.all, 'balance', userId ?? 'anonymous'] as const,
  transactions: (userId?: string, filter: TransactionFilter = 'all') =>
    [...walletKeys.all, 'transactions', userId ?? 'anonymous', filter] as const,
};
