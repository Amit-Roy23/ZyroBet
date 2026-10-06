export interface DailyRewardDay {
  day: number;
  coins: number;
  isSpecial?: boolean;
  bonusMultiplier?: number;
}

export interface DailyRewardState {
  currentStreak: number;
  lastClaimDate: string | null; // ISO Date YYYY-MM-DD
  canClaimToday: boolean;
  nextRewardCoins: number;
  streakSchedule: DailyRewardDay[];
  timeUntilNextUtcMidnight: string;
}

export interface ClaimRewardResponse {
  success: boolean;
  coinsAwarded: number;
  newStreak: number;
  newBalance: number;
  message: string;
}
