export type CoinLedgerReason =
  | 'daily_reward'
  | 'game_win'
  | 'game_entry'
  | 'iap_purchase'
  | 'bonus_streak'
  | 'welcome_gift'
  | 'mission_reward';

export interface CoinTransaction {
  id: string;
  userId: string;
  delta: number; // positive for earn, negative for spend
  reason: CoinLedgerReason;
  description: string;
  refId?: string | null;
  createdAt: string;
}

export interface WalletState {
  balance: number;
  isLoading: boolean;
  lastUpdated: string | null;
}
