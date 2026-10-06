// Supabase Edge Function: verify-purchase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role to write ledger
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { storeTxId, productId, coins } = await req.json();

    if (!storeTxId || !productId || !coins) {
      return new Response(JSON.stringify({ error: 'Invalid purchase payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Record purchase
    const { error: purchaseError } = await supabaseClient.from('purchases').insert({
      user_id: user.id,
      store_tx_id: storeTxId,
      product_id: productId,
      coins,
    });

    if (purchaseError) {
      return new Response(JSON.stringify({ error: purchaseError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Insert into ledger
    await supabaseClient.from('coin_ledger').insert({
      user_id: user.id,
      delta: coins,
      reason: 'iap_purchase',
      ref_id: storeTxId,
    });

    // 3. Update wallet balance
    const { data: wallet } = await supabaseClient.rpc(
      'increment_wallet_balance',
      { p_user_id: user.id, p_coins: coins },
    );

    return new Response(JSON.stringify({ success: true, coinsCredited: coins, wallet }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
