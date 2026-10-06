// Supabase Edge Function: wallet-transaction
// STRICT RULE: Clients cannot submit arbitrary coin deltas.
// Exposes only controlled server-defined actions like 'dev_grant' during testing.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';
import { getServiceSupabase } from '../_shared/client.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';

// In-memory rate limiting tracker for dev grants (timestamp per user)
const devGrantRateLimit = new Map<string, number>();

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return jsonError('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  try {
    const { user, error: authError } = await authenticateUser(req);
    if (authError || !user) {
      return jsonError('UNAUTHORIZED', authError || 'Authentication required', 401);
    }

    const body = await req.json().catch(() => ({}));
    const { action, idempotency_key } = body;

    // Hard Rule: Only allow specific server-defined actions
    if (action !== 'dev_grant') {
      return jsonError(
        'INVALID_ACTION',
        'Direct coin deltas are forbidden. Actions must be server-governed.',
        400,
      );
    }

    // Dev Grant Feature Guard
    const isDevGrantEnabled = Deno.env.get('ENABLE_DEV_GRANT') !== 'false';
    if (!isDevGrantEnabled) {
      return jsonError(
        'FEATURE_DISABLED',
        'Dev grants are disabled in this environment.',
        403,
      );
    }

    // Rate limit: 1 grant per 1.5 seconds per user
    const now = Date.now();
    const lastGrant = devGrantRateLimit.get(user.id) || 0;
    if (now - lastGrant < 1500) {
      return jsonError(
        'RATE_LIMITED',
        'Please wait a moment before requesting another grant.',
        429,
      );
    }
    devGrantRateLimit.set(user.id, now);

    const idempotencyKey = idempotency_key || `dev_grant_${user.id}_${now}`;
    const serviceClient = getServiceSupabase();

    // Call secure Postgres RPC
    const { data: ledgerRow, error: rpcError } = await serviceClient.rpc(
      'apply_coin_transaction',
      {
        p_user: user.id,
        p_delta: 100,
        p_reason: 'admin_adjust',
        p_ref: 'dev_grant',
        p_key: idempotencyKey,
      },
    );

    if (rpcError) {
      return jsonError('TRANSACTION_FAILED', rpcError.message, 400);
    }

    return jsonOk({
      balance: Number(ledgerRow.balance_after),
      ledger: ledgerRow,
    });
  } catch (err) {
    return jsonError('INTERNAL_ERROR', String(err), 500);
  }
});
