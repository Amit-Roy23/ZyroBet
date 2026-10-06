import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStateStorage } from '@/lib/mmkv';
import { APP_CONFIG } from '@/constants/config';
import { UserProfile } from '@/types/profile';

interface AuthState {
  user: UserProfile | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setSessionToken: (token: string | null) => void;
  setIsOnboarded: (val: boolean) => void;
  setLoading: (val: boolean) => void;
  signInAsGuest: () => void;
  signOut: () => void;
}

const DEFAULT_GUEST_USER: UserProfile = {
  id: 'guest-player-1',
  username: 'Player_772',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  level: 3,
  xp: 450,
  xpToNextLevel: 1000,
  gamesPlayed: 12,
  highScoreSum: 48200,
  isGuest: true,
  createdAt: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: DEFAULT_GUEST_USER,
      sessionToken: 'guest-demo-token',
      isAuthenticated: true,
      isOnboarded: true,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSessionToken: (sessionToken) => set({ sessionToken }),
      setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
      setLoading: (isLoading) => set({ isLoading }),

      signInAsGuest: () => {
        set({
          user: DEFAULT_GUEST_USER,
          sessionToken: `guest-${Date.now()}`,
          isAuthenticated: true,
          isOnboarded: true,
        });
      },

      signOut: () => {
        set({
          user: null,
          sessionToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: APP_CONFIG.STORAGE_KEYS.AUTH_STATE,
      storage: createJSONStorage(() => mmkvStateStorage),
    },
  ),
);
