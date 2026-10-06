import { supabase } from '@/lib/supabase';
import { GAME_CATALOG } from '@/constants/gameCatalog';
import {
  GameItem,
  GameStartResult,
  GameFinishResult,
  GameDailyStatusData,
} from './types';
import {
  getPendingSubmissions,
  removePendingSubmission,
} from './pendingSubmissions';

/**
 * Fetches the list of enabled games from Supabase, falling back to static catalog offline.
 */
export async function fetchGamesCatalog(): Promise<GameItem[]> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('enabled', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return GAME_CATALOG;
    }

    const gameRows = data as {
      id: string;
      slug: string;
      title: string;
      category: string;
      thumb_url?: string;
      is_new?: boolean;
      is_hot?: boolean;
      enabled?: boolean;
    }[];

    return gameRows.map((g) => {
      const fallback = GAME_CATALOG.find((fc) => fc.id === g.id || fc.slug === g.slug);
      return {
        id: g.id,
        slug: g.slug,
        title: g.title,
        category: (g.category as GameItem['category']) || 'puzzle',
        description: fallback?.description || 'ZyroBet casual skill mini-game.',
        instructions: fallback?.instructions || 'Follow on-screen instructions.',
        thumbnailUrl: g.thumb_url || fallback?.thumbnailUrl || '',
        bgGradient: fallback?.bgGradient || ['#164E33', '#07140F'],
        isNew: g.is_new,
        isHot: g.is_hot,
        playerCount: fallback?.playerCount || 10000,
        entryFee: 0,
        rewardCoins: fallback?.rewardCoins || 100,
        difficulty: fallback?.difficulty || 'Medium',
        icon: fallback?.icon || 'gamepad-2',
        enabled: g.enabled ?? true,
      };
    });
  } catch {
    return GAME_CATALOG;
  }
}

/**
 * Starts a server-verified game session.
 */
export async function startSession(
  gameId: string,
  difficulty?: string
): Promise<GameStartResult> {
  const { data, error } = await supabase.functions.invoke('game-start', {
    body: { gameId, difficulty },
  });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to start game session');
  }

  return data as GameStartResult;
}

/**
 * Submits game results to the Edge Function for verification and deterministic reward payout.
 */
export async function finishSession(
  sessionId: string,
  durationMs: number,
  payload: unknown
): Promise<GameFinishResult> {
  const { data, error } = await supabase.functions.invoke('game-finish', {
    body: { sessionId, durationMs, payload },
  });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to finish game session');
  }

  return data as GameFinishResult;
}

/**
 * Fetches per-game and global daily earnings & caps.
 */
export async function fetchGameDailyStatus(): Promise<GameDailyStatusData> {
  const { data, error } = await supabase.functions.invoke('game-daily-status');

  if (error || !data) {
    return {
      today: new Date().toISOString().split('T')[0],
      globalCap: 300,
      globalEarnedToday: 0,
      games: [],
    };
  }

  return data as GameDailyStatusData;
}

/**
 * Flushes any pending offline score submissions.
 */
export async function flushPendingSubmissions(): Promise<void> {
  const pending = getPendingSubmissions();
  if (pending.length === 0) return;

  for (const item of pending) {
    try {
      await finishSession(item.sessionId, item.durationMs, item.payload);
      removePendingSubmission(item.sessionId);
    } catch {
      // Keep in queue until expired or network restored
    }
  }
}
