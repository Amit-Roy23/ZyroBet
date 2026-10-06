import { RewardStatus } from '../types';
import { logger } from '@/utils/logger';

export * from './scheduler.shared';

/**
 * Web no-op implementation of notification channels
 */
export async function initializeNotificationChannels(): Promise<void> {
  // No-op on web
}

/**
 * Web no-op implementation of notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  logger.info('[Notifications.web] Notification scheduling is not supported on web');
  return false;
}

/**
 * Web no-op implementation of rescheduleReminders
 */
export async function rescheduleReminders(_status?: RewardStatus | null): Promise<void> {
  // No-op on web
}

/**
 * Web no-op implementation of setupNotificationResponseListener
 */
export function setupNotificationResponseListener(): () => void {
  return () => {};
}
