/**
 * ZyroBet Global Application Configuration
 * Centralized constant for app branding, limits, and legal statements.
 */

export const APP_CONFIG = {
  // Brand Configuration (Single source of truth)
  APP_NAME: 'ZyroBet',
  APP_SLOGAN: 'Pure Casual Mini-Games • Virtual Coins Only',
  APP_VERSION: '1.0.0',
  BUILD_NUMBER: '1',

  // Hard Legal Compliance Rules
  // HARD RULE: Coins have NO cash value and can NEVER be withdrawn or exchanged for money/prizes.
  // No casino-style mechanics (no slots, roulette, crash, betting, or loot-box odds).
  LEGAL_DISCLAIMER: 'Virtual coins only. No real-money gambling.',
  LEGAL_FULL_TEXT:
    'ZyroBet is strictly an entertainment platform featuring skill-based casual mini-games. Virtual coins possess zero cash value and can never be cashed out, withdrawn, transferred, or exchanged for real currency or tangible prizes under any circumstances. All mini-games are purely skill and reaction based.',

  // Virtual Economy
  CURRENCY_NAME: 'Coins',
  CURRENCY_SYMBOL: '🪙',
  STARTING_GUEST_COINS: 1000,
  DAILY_REWARD_BASE_COINS: 250,
  MAX_DAILY_STREAK_BONUS_MULTIPLIER: 3.0,

  // Support & Community Links
  SUPPORT_EMAIL: 'support@zyrobet.app',
  COMMUNITY_DISCORD_URL: 'https://discord.gg/zyrobet',
  TERMS_URL: 'https://zyrobet.app/terms',
  PRIVACY_URL: 'https://zyrobet.app/privacy',

  // UI / UX Constants
  MIN_TOUCH_TARGET: 44,
  HEADER_HEIGHT: 56,
  BOTTOM_TAB_HEIGHT: 68,
  CAROUSEL_AUTO_PLAY_INTERVAL_MS: 4500,
  TICKER_SPEED_MS: 30,

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_STATE: 'zyrobet_auth_state_v1',
    USER_PROFILE: 'zyrobet_user_profile_v1',
    WALLET_STATE: 'zyrobet_wallet_state_v1',
    REWARDS_STATE: 'zyrobet_rewards_state_v1',
    SETTINGS_STATE: 'zyrobet_settings_state_v1',
    SOUND_ENABLED: 'zyrobet_sound_enabled',
    HAPTICS_ENABLED: 'zyrobet_haptics_enabled',
    ONBOARDING_COMPLETED: 'zyrobet_onboarding_completed',
  },
} as const;
