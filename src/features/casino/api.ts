import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { CasinoApiError, CasinoRequest, CasinoResponse } from './types';

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<Envelope<T>>('casino-play', { body });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const status = (error.context as Response | undefined)?.status ?? 0;
      const payload = (await (error.context as Response)
        .json()
        .catch(() => null)) as Envelope<T> | null;
      if (payload?.error) {
        throw new CasinoApiError(
          payload.error.code,
          payload.error.message,
          payload.error.details ?? null,
        );
      }
      throw new CasinoApiError(status === 404 ? 'NOT_DEPLOYED' : 'HTTP_ERROR', error.message);
    }
    throw new CasinoApiError('NETWORK', 'Could not reach the game server. Check your connection.');
  }

  if (!data?.success || data.data === undefined) {
    throw new CasinoApiError(
      data?.error?.code ?? 'UNKNOWN',
      data?.error?.message ?? 'Unexpected server response',
    );
  }
  return data.data;
}

export function casinoCall(req: CasinoRequest): Promise<CasinoResponse> {
  return invoke<CasinoResponse>(req as unknown as Record<string, unknown>);
}

/**
 * Checks whether real-coin play is available: a configured project, a signed-in user
 * and a deployed `casino-play` function. Returns the live balance when it is.
 */
export async function checkCasinoAvailable(): Promise<{ live: boolean; balance?: number }> {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) return { live: false };

  const { data } = await supabase.auth.getSession();
  if (!data.session) return { live: false };

  try {
    const res = await invoke<{ balance: number }>({ action: 'config' });
    return { live: true, balance: res.balance };
  } catch {
    return { live: false };
  }
}
