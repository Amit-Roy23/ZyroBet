// Supabase Edge Function: game-start
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';
import { getServiceSupabase } from '../_shared/client.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';

const userRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    userRateLimits.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 20) {
    return false;
  }

  entry.count += 1;
  return true;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return jsonError('METHOD_NOT_ALLOWED', 'POST method required', 405);
  }

  try {
    const { user, error: authError } = await authenticateUser(req);
    if (authError || !user) {
      return jsonError('UNAUTHORIZED', authError || 'Authentication required', 401);
    }

    if (!checkRateLimit(user.id)) {
      return jsonError('RATE_LIMITED', 'Too many requests. Please wait a moment.', 429);
    }

    const body = await req.json().catch(() => ({}));
    const { gameId, difficulty } = body;

    if (!gameId || typeof gameId !== 'string') {
      return jsonError('BAD_REQUEST', 'gameId string is required', 400);
    }

    const serviceClient = getServiceSupabase();

    // Verify game is enabled
    const { data: game, error: gameError } = await serviceClient
      .from('games')
      .select('id, enabled')
      .or(`id.eq.${gameId},slug.eq.${gameId}`)
      .single();

    if (gameError || !game || !game.enabled) {
      return jsonError('GAME_NOT_FOUND', `Game '${gameId}' not found or disabled`, 404);
    }

    const resolvedGameId = game.id;

    // Expire caller's stale 'active' sessions for this game
    await serviceClient
      .from('game_sessions')
      .update({
        status: 'expired',
        finished_at: new Date().toISOString(),
        reject_reason: 'Superseded by new game session',
      })
      .eq('user_id', user.id)
      .eq('game_id', resolvedGameId)
      .eq('status', 'active');

    // Generate positive 32-bit random integer seed
    const seed = Math.floor(Math.random() * 2147483647) + 1;

    // Create new session
    const { data: session, error: sessionError } = await serviceClient
      .from('game_sessions')
      .insert({
        user_id: user.id,
        game_id: resolvedGameId,
        difficulty: difficulty || null,
        seed,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select('id, seed, difficulty, started_at')
      .single();

    if (sessionError || !session) {
      return jsonError('DATABASE_ERROR', sessionError?.message || 'Failed to create game session', 500);
    }

    const rewardTz = Deno.env.get('REWARD_TIMEZONE') || 'UTC';
    const { data: dailyStatus } = await serviceClient.rpc('get_game_daily_status', {
      p_user: user.id,
      p_tz: rewardTz,
    });

    return jsonOk({
      sessionId: session.id,
      gameId: resolvedGameId,
      seed: session.seed,
      difficulty: session.difficulty,
      serverNow: new Date().toISOString(),
      dailyStatus,
    });
  } catch (err) {
    return jsonError('INTERNAL_ERROR', String(err), 500);
  }
});
