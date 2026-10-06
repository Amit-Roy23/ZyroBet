/**
 * Typed route definitions for ZyroBet navigation
 */

export const ROUTES = {
  // Root & Splash Gate
  ROOT: '/' as const,

  // Onboarding
  WELCOME: '/(onboarding)/welcome' as const,
  PICK_AVATAR: '/(onboarding)/pick-avatar' as const,

  // Auth
  SIGN_IN: '/(auth)/sign-in' as const,
  SIGN_UP: '/(auth)/sign-up' as const,
  FORGOT_PASSWORD: '/(auth)/forgot-password' as const,

  // Main Tabs
  HOME: '/(tabs)/home' as const,
  PROMOTIONS: '/(tabs)/promotions' as const,
  REWARDS: '/(tabs)/rewards' as const,
  SHOP: '/(tabs)/shop' as const,
  ACCOUNT: '/(tabs)/account' as const,

  // Modals & Screens
  GAME: (id: string) => `/game/${id}` as const,
  LEADERBOARD: '/leaderboard' as const,
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
