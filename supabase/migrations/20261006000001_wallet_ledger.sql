-- ZyroBet Migration: Wallets, Coin Ledger, Idempotency & Realtime
-- Strict virtual coin economy with server-side only modifications.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create or update Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create or update Coin Ledger table (Append-only audit trail)
CREATE TABLE IF NOT EXISTS public.coin_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    delta BIGINT NOT NULL CHECK (delta <> 0),
    balance_after BIGINT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('signup_bonus', 'daily_reward', 'game_reward', 'purchase', 'spend', 'admin_adjust')),
    ref_id TEXT,
    idempotency_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coin_ledger_user_idempotency_uniq UNIQUE (user_id, idempotency_key)
);

-- Index for fast cursor pagination on (created_at desc, id desc)
CREATE INDEX IF NOT EXISTS idx_coin_ledger_user_pagination
ON public.coin_ledger (user_id, created_at DESC, id DESC);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_ledger ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to recreate cleanly
DROP POLICY IF EXISTS "Users can view own wallet balance" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can view own coin ledger" ON public.coin_ledger;

-- RLS Policies: Authenticated users can ONLY SELECT their own rows.
-- NO client insert, update, or delete policies exist.
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own coin ledger" ON public.coin_ledger
    FOR SELECT USING (auth.uid() = user_id);

-- Enable Realtime on wallets table for live balance sync
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Secure Atomic Ledger & Wallet Update Function
CREATE OR REPLACE FUNCTION public.apply_coin_transaction(
    p_user UUID,
    p_delta BIGINT,
    p_reason TEXT,
    p_ref TEXT,
    p_key TEXT
)
RETURNS public.coin_ledger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance BIGINT;
    v_balance_after BIGINT;
    v_existing_ledger public.coin_ledger%ROWTYPE;
    v_result public.coin_ledger%ROWTYPE;
BEGIN
    -- 1. Check for idempotent replay
    SELECT * INTO v_existing_ledger
    FROM public.coin_ledger
    WHERE user_id = p_user AND idempotency_key = p_key;

    IF FOUND THEN
        RETURN v_existing_ledger;
    END IF;

    -- 2. Lock wallet row or create with 0 balance if missing
    SELECT balance INTO v_balance
    FROM public.wallets
    WHERE user_id = p_user
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.wallets (user_id, balance, updated_at)
        VALUES (p_user, 0, NOW())
        ON CONFLICT (user_id) DO NOTHING;

        SELECT balance INTO v_balance
        FROM public.wallets
        WHERE user_id = p_user
        FOR UPDATE;
    END IF;

    -- 3. Check for insufficient balance on debit
    IF v_balance + p_delta < 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_COINS' USING ERRCODE = 'P0001',
            MESSAGE = 'Wallet has insufficient coins for this transaction.';
    END IF;

    -- 4. Calculate new balance
    v_balance_after := v_balance + p_delta;

    -- 5. Update wallet
    UPDATE public.wallets
    SET balance = v_balance_after, updated_at = NOW()
    WHERE user_id = p_user;

    -- 6. Insert ledger record
    INSERT INTO public.coin_ledger (
        user_id,
        delta,
        balance_after,
        reason,
        ref_id,
        idempotency_key,
        created_at
    )
    VALUES (
        p_user,
        p_delta,
        v_balance_after,
        p_reason,
        p_ref,
        p_key,
        NOW()
    )
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

-- Security: REVOKE execution from anon and authenticated. Only service_role can call it.
REVOKE EXECUTE ON FUNCTION public.apply_coin_transaction(UUID, BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_coin_transaction(UUID, BIGINT, TEXT, TEXT, TEXT) TO service_role;

-- 4. Automatic Signup Bonus Helper / Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ensure wallet exists
    INSERT INTO public.wallets (user_id, balance, updated_at)
    VALUES (NEW.id, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;

    -- Grant one-time signup bonus of 500 virtual coins
    PERFORM public.apply_coin_transaction(
        NEW.id,
        500,
        'signup_bonus',
        'welcome_gift',
        'signup_bonus'
    );

    RETURN NEW;
END;
$$;

-- Trigger on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_wallet();
