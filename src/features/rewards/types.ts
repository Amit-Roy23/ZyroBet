export interface DailyRewardConfigItem {
  day: number;
  coins: number;
}

export interface RewardStatus {
  streak: number;
  longestStreak: number;
  totalClaims: number;
  cycleDay: number; // 1 to 7
  claimedDaysInCycle: number; // 0 to 7
  canClaim: boolean;
  lastClaimDate: string | null;
  streakWillReset: boolean;
  nextClaimAt: string; // ISO timestamptz for next midnight in reward timezone
  serverNow: string; // ISO timestamptz from database server
  config: DailyRewardConfigItem[];
}

export interface ClaimResult {
  status: 'CLAIMED';
  coins: number;
  streak: number;
  longestStreak: number;
  cycleDay: number;
  balanceAfter: number;
  wasReset: boolean;
}

export type DayCardState = 'claimed' | 'today' | 'locked';

export interface ReminderSettings {
  enabled: boolean;
  reminderTime: string; // "18:00" in HH:mm local format
  streakReminder: boolean;
  hasPromptedOptIn: boolean;
}
