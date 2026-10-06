import { Database, LedgerReason } from '@/types/supabase';

export type { LedgerReason };

export interface Wallet {
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  delta: number;
  balanceAfter: number;
  reason: LedgerReason;
  refId: string | null;
  idempotencyKey: string;
  createdAt: string;
}

export type TransactionFilter = 'all' | 'earned' | 'spent';

export interface PaginationCursor {
  createdAt: string;
  id: string;
}

export interface PaginatedTransactionsResponse {
  items: LedgerEntry[];
  nextCursor: PaginationCursor | null;
  hasMore: boolean;
}

export type DbWalletRow = Database['public']['Tables']['wallets']['Row'];
export type DbLedgerRow = Database['public']['Tables']['coin_ledger']['Row'];
