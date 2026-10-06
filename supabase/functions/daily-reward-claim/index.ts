// Supabase Edge Function: daily-reward-claim
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';
import { getServiceSupabase } from '../_shared/client.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';

// Per-user rate limiter in memory: max 5 claim attempts per 60 seconds
const userRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimits.get(userId);

  if (!entry || now > entry.resetAt) {
    userRateLimits.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 5) {
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
      return jsonError('RATE_LIMITED', 'Too many claim attempts. Please wait a minute.', 429);
    }

    const rewardTz = Deno.env.get('REWARD_TIMEZONE') || 'UTC';
    const serviceClient = getServiceSupabase();

    // Call PostgreSQL claim_daily_reward RPC
    const { data, error } = await serviceClient.rpc('claim_daily_reward', {
      p_user: user.id,
      p_tz: rewardTz,
    });

    if (error) {
      return jsonError('DATABASE_ERROR', error.message, 500);
    }

    // Handle already claimed condition with HTTP 409 Conflict
    if (data?.status === 'ALREADY_CLAIMED') {
      return jsonError('ALREADY_CLAIMED', data.message || 'Daily reward already claimed today', 409);
    }

    return jsonOk(data);
  } catch (err) {
    return jsonError('INTERNAL_ERROR', String(err), 500);
  }
});
