export const NOTIFICATION_IDS = {
  DAILY_REWARD: 'daily-reward-reminder',
  STREAK_WARNING: 'streak-warning-reminder',
} as const;

export const NOTIFICATION_CHANNEL_ID = 'daily-reminder';

/**
 * Pure function to compute the exact Date within [nextClaimAt, nextClaimAt + 24h)
 * matching the user's chosen local HH:mm reminder time.
 */
export function computeReminderDate(
  nextClaimAtServer: string,
  serverOffsetMs: number,
  reminderHHmm: string,
): Date {
  const [hoursStr, minutesStr] = reminderHHmm.split(':');
  const targetHour = parseInt(hoursStr || '18', 10);
  const targetMinute = parseInt(minutesStr || '0', 10);

  // Convert server next claim window to local timestamp
  const nextClaimTimeMs = new Date(nextClaimAtServer).getTime() - serverOffsetMs;
  const nextClaimDate = new Date(nextClaimTimeMs);
  const windowEndMs = nextClaimTimeMs + 24 * 60 * 60 * 1000;

  // Candidate 1: Target local time on same calendar day as next claim window start
  const candidate1 = new Date(
    nextClaimDate.getFullYear(),
    nextClaimDate.getMonth(),
    nextClaimDate.getDate(),
    targetHour,
    targetMinute,
    0,
    0,
  );

  if (candidate1.getTime() >= nextClaimTimeMs && candidate1.getTime() < windowEndMs) {
    return candidate1;
  }

  // Candidate 2: Next calendar day
  const candidate2 = new Date(
    nextClaimDate.getFullYear(),
    nextClaimDate.getMonth(),
    nextClaimDate.getDate() + 1,
    targetHour,
    targetMinute,
    0,
    0,
  );

  if (candidate2.getTime() >= nextClaimTimeMs && candidate2.getTime() < windowEndMs) {
    return candidate2;
  }

  // Fallback: Default to candidate 1 or 2
  return candidate1.getTime() >= nextClaimTimeMs ? candidate1 : candidate2;
}
