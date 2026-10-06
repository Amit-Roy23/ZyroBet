import { supabase } from '@/lib/supabase';
import {
  Wallet,
  LedgerEntry,
  TransactionFilter,
  PaginationCursor,
  PaginatedTransactionsResponse,
  DbLedgerRow,
  DbWalletRow,
} from './types';
import { normalizeError, AppError } from '@/services/errorService';

function mapDbRowToLedgerEntry(row: DbLedgerRow): LedgerEntry {
  return {
    id: row.id,
    userId: row.user_id,
    delta: Number(row.delta),
    balanceAfter: Number(row.balance_after),
    reason: row.reason,
    refId: row.ref_id,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
  };
}

export const walletApi = {
  /**
   * Fetch current wallet balance via Edge Function or direct table read
   */
  async getBalance(): Promise<{ wallet: Wallet | null; error: AppError | null }> {
    try {
      // 1. Attempt edge function first (initializes wallet with signup bonus if missing)
      const { data: fnData, error: fnError } = await supabase.functions.invoke<{
        success: boolean;
        data?: { balance: number; updated_at: string };
        error?: { message: string };
      }>('wallet-get');

      if (!fnError && fnData?.data) {
        const session = (await supabase.auth.getSession()).data.session;
        return {
          wallet: {
            userId: session?.user?.id || 'unknown',
            balance: fnData.data.balance,
            updatedAt: fnData.data.updated_at,
          },
          error: null,
        };
      }

      // 2. Direct table fallback if Edge Functions are not deployed locally
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (!userId) {
        return { wallet: null, error: { code: 'UNAUTHENTICATED', message: 'No active session' } };
      }

      const { data: tableRow, error: tableError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (tableError) {
        return { wallet: null, error: normalizeError(tableError) };
      }

      const walletRow = tableRow as DbWalletRow | null;

      if (!walletRow) {
        // Return 500 default signup bonus
        return {
          wallet: {
            userId,
            balance: 500,
            updatedAt: new Date().toISOString(),
          },
          error: null,
        };
      }

      return {
        wallet: {
          userId: walletRow.user_id,
          balance: Number(walletRow.balance),
          updatedAt: walletRow.updated_at,
        },
        error: null,
      };
    } catch (err) {
      return { wallet: null, error: normalizeError(err) };
    }
  },

  /**
   * Keyset paginated ledger query on (created_at desc, id desc)
   */
  async getTransactions(params: {
    cursor?: PaginationCursor | null;
    limit?: number;
    filter?: TransactionFilter;
  }): Promise<PaginatedTransactionsResponse> {
    const { cursor, limit = 20, filter = 'all' } = params;

    try {
      let query = supabase
        .from('coin_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1);

      if (filter === 'earned') {
        query = query.gt('delta', 0);
      } else if (filter === 'spent') {
        query = query.lt('delta', 0);
      }

      if (cursor) {
        // Keyset paging: older than cursor timestamp, or matching timestamp with smaller id
        query = query.or(
          `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const rows: DbLedgerRow[] = data || [];
      const hasMore = rows.length > limit;
      const sliced = hasMore ? rows.slice(0, limit) : rows;

      const items = sliced.map(mapDbRowToLedgerEntry);
      const lastItem = items[items.length - 1];

      const nextCursor: PaginationCursor | null =
        hasMore && lastItem
          ? {
              createdAt: lastItem.createdAt,
              id: lastItem.id,
            }
          : null;

      return {
        items,
        nextCursor,
        hasMore,
      };
    } catch {
      // Fallback for offline or local demonstration if Supabase tables are not seeded
      return {
        items: [],
        nextCursor: null,
        hasMore: false,
      };
    }
  },

  /**
   * DEV-ONLY Grant (+100 Virtual Coins for testing)
   */
  async devGrant(): Promise<{ balance: number; ledger?: LedgerEntry; error: AppError | null }> {
    try {
      const { data, error } = await supabase.functions.invoke<{
        success: boolean;
        data?: { balance: number; ledger: DbLedgerRow };
        error?: { message: string };
      }>('wallet-transaction', {
        body: { action: 'dev_grant', idempotency_key: `dev_grant_${Date.now()}` },
      });

      if (error || !data?.success || !data.data) {
        return {
          balance: 0,
          error: normalizeError(error || data?.error?.message || 'Dev grant failed'),
        };
      }

      return {
        balance: data.data.balance,
        ledger: mapDbRowToLedgerEntry(data.data.ledger),
        error: null,
      };
    } catch (err) {
      return { balance: 0, error: normalizeError(err) };
    }
  },
};
