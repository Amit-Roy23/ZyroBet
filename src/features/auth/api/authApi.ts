import { supabase } from '@/lib/supabase';
import { normalizeError, AppError } from '@/services/errorService';

export const authApi = {
  async signInWithEmail(email: string): Promise<{ data: unknown; error: AppError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'zyrobet://auth/callback',
        },
      });
      if (error) return { data: null, error: normalizeError(error) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeError(err) };
    }
  },

  /**
   * TODO [WEB AUTH]: Browser OAuth login via Supabase redirect flow.
   * Invoked on web platform when user chooses Google or Apple sign-in.
   * Supabase redirects the browser back to origin with session hash fragment.
   */
  async signInWithOAuthWeb(
    provider: 'google' | 'apple',
  ): Promise<{ data: unknown; error: AppError | null }> {
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) return { data: null, error: normalizeError(error) };
      return { data, error: null };
    } catch (err) {
      return { data: null, error: normalizeError(err) };
    }
  },

  /**
   * TODO [NATIVE AUTH]: Native Google Sign-In via @react-native-google-signin/google-signin.
   * Native SDK provides idToken, which is forwarded to Supabase signInWithIdToken.
   */
  async signInWithGoogleNative(): Promise<{ data: unknown; error: AppError | null }> {
    // TODO: Call GoogleSignin.hasPlayServices(), GoogleSignin.signIn(),
    // and supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
    return { data: null, error: null };
  },

  /**
   * TODO [NATIVE AUTH]: Native Apple Sign-In via expo-apple-authentication.
   * Apple Credential provides identityToken, forwarded to Supabase signInWithIdToken.
   */
  async signInWithAppleNative(): Promise<{ data: unknown; error: AppError | null }> {
    // TODO: Call AppleAuthentication.signInAsync(),
    // and supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken })
    return { data: null, error: null };
  },

  async signOut(): Promise<{ error: AppError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: normalizeError(error) };
      return { error: null };
    } catch (err) {
      return { error: normalizeError(err) };
    }
  },
};
