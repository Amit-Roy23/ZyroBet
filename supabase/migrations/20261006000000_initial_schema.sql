-- ZyroBet Database Schema Migration
-- Strictly Virtual Coins & Casual Skill Mini-Games

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    level INT NOT NULL DEFAULT 1,
    xp INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Wallets Table (NEVER writable by client)
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 1000 CHECK (balance >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Coin Ledger Table (Append-only audit trail)
CREATE TABLE IF NOT EXISTS public.coin_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delta BIGINT NOT NULL,
    reason TEXT NOT NULL, -- 'daily_reward', 'game_win', 'iap_purchase', 'welcome_gift'
    ref_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Games Table
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    thumb_url TEXT NOT NULL,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_hot BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Game Scores Table
CREATE TABLE IF NOT EXISTS public.game_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    score BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Daily Rewards Table
CREATE TABLE IF NOT EXISTS public.daily_rewards (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_claim_date DATE,
    streak INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_tx_id TEXT UNIQUE NOT NULL,
    product_id TEXT NOT NULL,
    coins BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Anyone can read profiles; Users can only update their own profile
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Wallets: Users can ONLY read their own wallet. Clients CANNOT insert/update/delete wallets directly.
CREATE POLICY "Users can view own wallet balance" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Coin Ledger: Users can only view their own ledger history
CREATE POLICY "Users can view own coin ledger" ON public.coin_ledger
    FOR SELECT USING (auth.uid() = user_id);

-- Games: Public read-only
CREATE POLICY "Games catalog is viewable by all" ON public.games
    FOR SELECT USING (enabled = true);

-- Game Scores: Public read for leaderboards; Insert allowed only via Edge Functions or authenticated score submission
CREATE POLICY "Scores are viewable by all" ON public.game_scores
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own scores" ON public.game_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily Rewards: Users can read their own daily reward state
CREATE POLICY "Users can view own daily rewards" ON public.daily_rewards
    FOR SELECT USING (auth.uid() = user_id);

-- Purchases: Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

-- Leaderboards Views
CREATE OR REPLACE VIEW public.leaderboards_daily AS
SELECT
    gs.game_id,
    gs.user_id,
    p.username,
    p.avatar,
    MAX(gs.score) as high_score,
    DENSE_RANK() OVER (PARTITION BY gs.game_id ORDER BY MAX(gs.score) DESC) as rank
FROM public.game_scores gs
JOIN public.profiles p ON gs.user_id = p.id
WHERE gs.created_at >= CURRENT_DATE
GROUP BY gs.game_id, gs.user_id, p.username, p.avatar;

CREATE OR REPLACE VIEW public.leaderboards_weekly AS
SELECT
    gs.game_id,
    gs.user_id,
    p.username,
    p.avatar,
    MAX(gs.score) as high_score,
    DENSE_RANK() OVER (PARTITION BY gs.game_id ORDER BY MAX(gs.score) DESC) as rank
FROM public.game_scores gs
JOIN public.profiles p ON gs.user_id = p.id
WHERE gs.created_at >= DATE_TRUNC('week', CURRENT_DATE)
GROUP BY gs.game_id, gs.user_id, p.username, p.avatar;

CREATE OR REPLACE VIEW public.leaderboards_all_time AS
SELECT
    gs.game_id,
    gs.user_id,
    p.username,
    p.avatar,
    MAX(gs.score) as high_score,
    DENSE_RANK() OVER (PARTITION BY gs.game_id ORDER BY MAX(gs.score) DESC) as rank
FROM public.game_scores gs
JOIN public.profiles p ON gs.user_id = p.id
GROUP BY gs.game_id, gs.user_id, p.username, p.avatar;

-- Secure Postgres Function: Claim Daily Reward
CREATE OR REPLACE FUNCTION public.claim_daily_reward(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_claim DATE;
    v_streak INT;
    v_today DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::DATE;
    v_reward_coins BIGINT;
    v_new_balance BIGINT;
BEGIN
    SELECT last_claim_date, streak INTO v_last_claim, v_streak
    FROM public.daily_rewards
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_last_claim = v_today THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already claimed today');
    END IF;

    IF v_last_claim = v_today - 1 THEN
        v_streak := (v_streak % 7) + 1;
    ELSE
        v_streak := 1;
    END IF;

    -- Calculate reward coins
    v_reward_coins := CASE v_streak
        WHEN 1 THEN 250
        WHEN 2 THEN 350
        WHEN 3 THEN 500
        WHEN 4 THEN 750
        WHEN 5 THEN 1000
        WHEN 6 THEN 1500
        WHEN 7 THEN 2500
        ELSE 250
    END;

    -- Update daily rewards
    INSERT INTO public.daily_rewards (user_id, last_claim_date, streak)
    VALUES (p_user_id, v_today, v_streak)
    ON CONFLICT (user_id) DO UPDATE
    SET last_claim_date = v_today, streak = v_streak;

    -- Insert into ledger
    INSERT INTO public.coin_ledger (user_id, delta, reason, ref_id)
    VALUES (p_user_id, v_reward_coins, 'daily_reward', 'day_' || v_streak);

    -- Update wallet balance
    UPDATE public.wallets
    SET balance = balance + v_reward_coins, updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_new_balance;

    RETURN jsonb_build_object(
        'success', true,
        'coins_awarded', v_reward_coins,
        'streak', v_streak,
        'new_balance', v_new_balance
    );
END;
$$;
