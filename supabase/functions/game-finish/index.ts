// Supabase Edge Function: game-finish
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';
import { getServiceSupabase } from '../_shared/client.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';
import { verify } from '../_shared/engines/index.ts';

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
    const { sessionId, durationMs, payload } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return jsonError('BAD_REQUEST', 'sessionId string is required', 400);
    }

    if (typeof durationMs !== 'number' || durationMs <= 0) {
      return jsonError('BAD_REQUEST', 'Valid durationMs number is required', 400);
    }

    const serviceClient = getServiceSupabase();

    // 1. Fetch game session
    const { data: session, error: sessionError } = await serviceClient
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return jsonError('NOT_FOUND', 'Game session not found', 404);
    }

    if (session.user_id !== user.id) {
      return jsonError('FORBIDDEN', 'Access denied to this session', 403);
    }

    // If already finished, return idempotent result through SQL RPC
    const rewardTz = Deno.env.get('REWARD_TIMEZONE') || 'UTC';
    if (session.status === 'finished') {
      const { data: idempotentData, error: idempError } = await serviceClient.rpc('finish_game_session', {
        p_user: user.id,
        p_session: sessionId,
        p_score: session.score || 0,
        p_duration_ms: session.duration_ms || durationMs,
        p_tz: rewardTz,
      });
      if (idempError) return jsonError('DATABASE_ERROR', idempError.message, 500);
      return jsonOk(idempotentData);
    }

    if (session.status !== 'active') {
      return jsonError('INVALID_SESSION_STATUS', `Session status is ${session.status}`, 400);
    }

    // 2. Fetch game configuration
    const { data: config, error: configError } = await serviceClient
      .from('game_config')
      .select('*')
      .eq('game_id', session.game_id)
      .single();

    if (configError || !config) {
      return jsonError('CONFIG_NOT_FOUND', 'Game configuration missing', 500);
    }

    // 3. Timing validation against server elapsed time
    const startedAtMs = new Date(session.started_at).getTime();
    const serverElapsedMs = Date.now() - startedAtMs;

    // Check minimum duration
    if (durationMs < config.min_duration_ms) {
      await serviceClient
        .from('game_sessions')
        .update({
          status: 'rejected',
          finished_at: new Date().toISOString(),
          reject_reason: `Duration ${durationMs}ms below minimum required ${config.min_duration_ms}ms`,
        })
        .eq('id', sessionId);

      return jsonError('VERIFICATION_FAILED', 'Score verification failed: play time too short', 422);
    }

    // Check claimed duration is plausible compared to server elapsed time (+3s tolerance)
    if (durationMs > serverElapsedMs + 3000) {
      await serviceClient
        .from('game_sessions')
        .update({
          status: 'rejected',
          finished_at: new Date().toISOString(),
          reject_reason: `Claimed duration ${durationMs}ms exceeded server elapsed time ${serverElapsedMs}ms`,
        })
        .eq('id', sessionId);

      return jsonError('VERIFICATION_FAILED', 'Score verification failed: timing discrepancy', 422);
    }

    // 4. Run pure engine verification
    const verification = verify(
      session.game_id,
      session.difficulty || undefined,
      session.seed,
      payload,
      durationMs
    );

    if (!verification.valid) {
      await serviceClient
        .from('game_sessions')
        .update({
          status: 'rejected',
          finished_at: new Date().toISOString(),
          reject_reason: verification.reason || 'Verification failed',
        })
        .eq('id', sessionId);

      return jsonError('VERIFICATION_FAILED', 'Score verification failed', 422);
    }

    // 5. Finalize session and calculate deterministic rewards in PostgreSQL
    const { data: finishResult, error: finishError } = await serviceClient.rpc('finish_game_session', {
      p_user: user.id,
      p_session: sessionId,
      p_score: verification.score,
      p_duration_ms: durationMs,
      p_tz: rewardTz,
    });

    if (finishError) {
      return jsonError('DATABASE_ERROR', finishError.message, 500);
    }

    return jsonOk(finishResult);
  } catch (err) {
    return jsonError('INTERNAL_ERROR', String(err), 500);
  }
});
