export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LedgerReason =
  | 'signup_bonus'
  | 'daily_reward'
  | 'game_reward'
  | 'purchase'
  | 'spend'
  | 'admin_adjust'
  | 'casino_bet'
  | 'casino_win';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar: string;
          level: number;
          xp: number;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar?: string;
          level?: number;
          xp?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar?: string;
          level?: number;
          xp?: number;
          created_at?: string;
        };
      };
      wallets: {
        Row: {
          user_id: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          balance?: number;
          updated_at?: string;
        };
      };
      coin_ledger: {
        Row: {
          id: string;
          user_id: string;
          delta: number;
          balance_after: number;
          reason: LedgerReason;
          ref_id: string | null;
          idempotency_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          delta: number;
          balance_after: number;
          reason: LedgerReason;
          ref_id?: string | null;
          idempotency_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          delta?: number;
          balance_after?: number;
          reason?: LedgerReason;
          ref_id?: string | null;
          idempotency_key?: string;
          created_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: string;
          thumb_url: string;
          is_new: boolean;
          is_hot: boolean;
          sort_order: number;
          enabled: boolean;
        };
        Insert: {
          id: string;
          slug: string;
          title: string;
          category: string;
          thumb_url?: string;
          is_new?: boolean;
          is_hot?: boolean;
          sort_order?: number;
          enabled?: boolean;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          category?: string;
          thumb_url?: string;
          is_new?: boolean;
          is_hot?: boolean;
          sort_order?: number;
          enabled?: boolean;
        };
      };
      game_config: {
        Row: {
          game_id: string;
          per_session_max: number;
          score_divisor: number;
          min_reward: number;
          daily_cap: number;
          min_duration_ms: number;
          max_session_age_s: number;
        };
        Insert: {
          game_id: string;
          per_session_max: number;
          score_divisor: number;
          min_reward: number;
          daily_cap: number;
          min_duration_ms?: number;
          max_session_age_s?: number;
        };
        Update: {
          game_id?: string;
          per_session_max?: number;
          score_divisor?: number;
          min_reward?: number;
          daily_cap?: number;
          min_duration_ms?: number;
          max_session_age_s?: number;
        };
      };
      game_global_config: {
        Row: {
          id: number;
          daily_cap: number;
        };
        Insert: {
          id?: number;
          daily_cap?: number;
        };
        Update: {
          id?: number;
          daily_cap?: number;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          difficulty: string | null;
          seed: number;
          status: 'active' | 'finished' | 'expired' | 'rejected';
          started_at: string;
          finished_at: string | null;
          score: number | null;
          duration_ms: number | null;
          coins_awarded: number;
          reject_reason: string | null;
          client_version: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          difficulty?: string | null;
          seed: number;
          status: 'active' | 'finished' | 'expired' | 'rejected';
          started_at?: string;
          finished_at?: string | null;
          score?: number | null;
          duration_ms?: number | null;
          coins_awarded?: number;
          reject_reason?: string | null;
          client_version?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          difficulty?: string | null;
          seed?: number;
          status?: 'active' | 'finished' | 'expired' | 'rejected';
          started_at?: string;
          finished_at?: string | null;
          score?: number | null;
          duration_ms?: number | null;
          coins_awarded?: number;
          reject_reason?: string | null;
          client_version?: string | null;
        };
      };
      game_scores: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          difficulty: string | null;
          score: number;
          session_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          difficulty?: string | null;
          score: number;
          session_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          difficulty?: string | null;
          score?: number;
          session_id?: string;
          created_at?: string;
        };
      };
      game_daily_earnings: {
        Row: {
          user_id: string;
          day: string;
          game_id: string;
          coins: number;
        };
        Insert: {
          user_id: string;
          day: string;
          game_id: string;
          coins?: number;
        };
        Update: {
          user_id?: string;
          day?: string;
          game_id?: string;
          coins?: number;
        };
      };
      daily_reward_config: {
        Row: {
          day: number;
          coins: number;
        };
        Insert: {
          day: number;
          coins: number;
        };
        Update: {
          day?: number;
          coins?: number;
        };
      };
      daily_reward_state: {
        Row: {
          user_id: string;
          streak: number;
          longest_streak: number;
          total_claims: number;
          last_claim_date: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          streak?: number;
          longest_streak?: number;
          total_claims?: number;
          last_claim_date?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          streak?: number;
          longest_streak?: number;
          total_claims?: number;
          last_claim_date?: string | null;
          updated_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          store_tx_id: string;
          product_id: string;
          coins: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          store_tx_id: string;
          product_id: string;
          coins: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          store_tx_id?: string;
          product_id?: string;
          coins?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      v_game_best: {
        Row: {
          user_id: string;
          game_id: string;
          difficulty: string | null;
          best_score: number;
        };
      };
    };
    Functions: {
      apply_coin_transaction: {
        Args: {
          p_user: string;
          p_delta: number;
          p_reason: LedgerReason;
          p_ref: string;
          p_key: string;
        };
        Returns: Database['public']['Tables']['coin_ledger']['Row'];
      };
      claim_daily_reward: {
        Args: {
          p_user: string;
          p_tz: string;
          p_now?: string;
        };
        Returns: Json;
      };
      daily_reward_status: {
        Args: {
          p_user: string;
          p_tz: string;
          p_now?: string;
        };
        Returns: Json;
      };
      finish_game_session: {
        Args: {
          p_user: string;
          p_session: string;
          p_score: number;
          p_duration_ms: number;
          p_tz: string;
          p_now?: string;
        };
        Returns: Json;
      };
      get_game_daily_status: {
        Args: {
          p_user: string;
          p_tz: string;
          p_now?: string;
        };
        Returns: Json;
      };
    };
  };
}
