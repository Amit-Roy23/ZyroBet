import { supabase } from '@/lib/supabase';
import { normalizeError, AppError } from './errorService';

export const apiService = {
  /**
   * Invoke a secure Supabase Edge Function
   */
  async invokeFunction<TResponse = unknown, TBody = Record<string, unknown>>(
    functionName: string,
    body?: TBody,
  ): Promise<{ data: TResponse | null; error: AppError | null }> {
    try {
      const { data, error } = await supabase.functions.invoke<TResponse>(functionName, {
        body: body as any,
      });

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeError(err) };
    }
  },
};
