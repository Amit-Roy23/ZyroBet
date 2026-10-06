// Supabase Edge Function: game-daily-status
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';
import { getServiceSupabase } from '../_shared/client.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return jsonError('METHOD_NOT_ALLOWED', 'GET method required', 405);
  }

  try {
    const { user, error: authError } = await authenticateUser(req);
    if (authError || !user) {
      return jsonError('UNAUTHORIZED', authError || 'Authentication required', 401);
    }

    const rewardTz = Deno.env.get('REWARD_TIMEZONE') || 'UTC';
    const serviceClient = getServiceSupabase();

    const { data, error } = await serviceClient.rpc('get_game_daily_status', {
      p_user: user.id,
      p_tz: rewardTz,
    });

    if (error) {
      return jsonError('DATABASE_ERROR', error.message, 500);
    }

    return jsonOk(data);
  } catch (err) {
    return jsonError('INTERNAL_ERROR', String(err), 500);
  }
});
