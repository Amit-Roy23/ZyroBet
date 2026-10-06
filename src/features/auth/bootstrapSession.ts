import { supabase } from '@/lib/supabase';
import { useAuthStore } from './store/useAuthStore';
import { logger } from '@/utils/logger';

/**
 * Bootstrap the user session on app launch.
 * If no existing Supabase session is found, signs in anonymously as a guest.
 *
 * TODO [WEB OAuth]: On web platform, supabase.auth.getSession() automatically
 * handles URL hash fragment tokens returned after OAuth redirect callback
 * (detectSessionInUrl if configured, or manual supabase.auth.setSession).
 *
 * TODO [NATIVE]: Native Google/Apple Sign-In tokens will be linked via
 * supabase.auth.linkIdentity() or signInWithIdToken().
 */
export async function bootstrapSession(): Promise<void> {
  try {
    const {
      data: { session },
      error: getSessionError,
    } = await supabase.auth.getSession();

    if (getSessionError) {
      logger.warn('[Auth Bootstrap] Failed to retrieve session:', getSessionError.message);
    }

    if (session?.user) {
      logger.info('[Auth Bootstrap] Existing session active:', session.user.id);
      useAuthStore.getState().setUser({
        id: session.user.id,
        username: session.user.user_metadata?.username || `Player_${session.user.id.slice(0, 4)}`,
        avatarUrl:
          session.user.user_metadata?.avatar_url ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        level: 1,
        xp: 0,
        xpToNextLevel: 1000,
        gamesPlayed: 0,
        highScoreSum: 0,
        isGuest: session.user.is_anonymous ?? true,
        email: session.user.email,
        createdAt: session.user.created_at,
      });
      useAuthStore.getState().setSessionToken(session.access_token);
      return;
    }

    // No existing session, sign in anonymously
    logger.info('[Auth Bootstrap] Signing in anonymously...');
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

    if (anonError) {
      logger.warn(
        '[Auth Bootstrap] Anonymous sign-in failed (possibly offline or unconfigured):',
        anonError.message,
      );
      // Ensure local state continues smoothly in offline mode
      useAuthStore.getState().signInAsGuest();
      return;
    }

    if (anonData?.user) {
      logger.info('[Auth Bootstrap] Anonymous session created:', anonData.user.id);
      useAuthStore.getState().setUser({
        id: anonData.user.id,
        username: `Guest_${anonData.user.id.slice(0, 5)}`,
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        level: 1,
        xp: 0,
        xpToNextLevel: 1000,
        gamesPlayed: 0,
        highScoreSum: 0,
        isGuest: true,
        createdAt: anonData.user.created_at,
      });
      if (anonData.session) {
        useAuthStore.getState().setSessionToken(anonData.session.access_token);
      }
    }
  } catch (err) {
    logger.warn('[Auth Bootstrap] Unexpected error during session bootstrap:', err);
    useAuthStore.getState().signInAsGuest();
  }
}
