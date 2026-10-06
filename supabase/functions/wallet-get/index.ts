// Supabase Edge Function: wallet-get
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { authenticateUser } from '../_shared/auth.ts';
import { getServiceSupabase } from '../_shared/client.ts';
import { jsonOk, jsonError } from '../_shared/response.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user, error: authError } = await authenticateUser(req);
    if (authError || !user) {
      return jsonError('UNAUTHORIZED', authError || 'Authentication required', 401);
    }

    const serviceClient = getServiceSupabase();

    // 1. Fetch current wallet
    const { data: wallet, error: walletFetchError } = await serviceClient
      .from('wallets')
      .select('balance, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (walletFetchError) {
      return jsonError('DATABASE_ERROR', walletFetchError.message, 500);
    }

    if (wallet) {
      return jsonOk({
        balance: Number(wallet.balance),
        updated_at: wallet.updated_at,
      });
    }

    // 2. If wallet doesn't exist yet, apply signup bonus transaction (500 coins)
    const { data: ledgerRow, error: signupError } = await serviceClient.rpc(
      'apply_coin_transaction',
      {
        p_user: user.id,
        p_delta: 500,
        p_reason: 'signup_bonus',
        p_ref: 'welcome_gift',
        p_key: 'signup_bonus',
      },
    );

    if (signupError) {
      return jsonError('WALLET_INIT_FAILED', signupError.message, 500);
    }

    return jsonOk({
      balance: Number(ledgerRow.balance_after),
      updated_at: ledgerRow.created_at,
    });
  } catch (err) {
    return jsonError('INTERNAL_ERROR', String(err), 500);
  }
});
