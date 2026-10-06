import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { router } from 'expo-router';
import type * as NotificationsType from 'expo-notifications';
import { useRewardsStore } from '../store/useRewardsStore';
import { RewardStatus } from '../types';
import { logger } from '@/utils/logger';
import {
  NOTIFICATION_IDS,
  NOTIFICATION_CHANNEL_ID,
  computeReminderDate,
} from './scheduler.shared';

export * from './scheduler.shared';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

function getNotifications(): typeof NotificationsType | null {
  if (isExpoGo && Platform.OS === 'android') {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as typeof NotificationsType;
  } catch (err) {
    logger.warn('[Notifications] expo-notifications module unavailable:', err);
    return null;
  }
}

/**
 * Configure foreground presentation and Android notification channel
 */
export async function initializeNotificationChannels() {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        const soundEnabled = useRewardsStore.getState().soundEnabled;
        return {
          shouldShowAlert: true,
          shouldPlaySound: soundEnabled,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Daily Coin Rewards',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2ECC71',
        sound: 'default',
      });
    }
  } catch (err) {
    logger.warn('[Notifications] Failed to initialize notification channels:', err);
  }
}

/**
 * Request system push permission
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) {
    logger.info('[Notifications] Running in Expo Go / simulator: notification permission simulated');
    useRewardsStore.getState().setReminderEnabled(true);
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    const granted = finalStatus === 'granted';
    useRewardsStore.getState().setReminderEnabled(granted);
    return granted;
  } catch (err) {
    logger.warn('[Notifications] Failed to request permissions:', err);
    return false;
  }
}

/**
 * Reschedule local reminders based on reward status and user settings
 */
export async function rescheduleReminders(status?: RewardStatus | null) {
  const Notifications = getNotifications();
  if (!Notifications) {
    return;
  }

  try {
    const { reminderSettings } = useRewardsStore.getState();

    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.DAILY_REWARD);
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDS.STREAK_WARNING);

    if (!reminderSettings.enabled || !status) {
      return;
    }

    const serverOffsetMs = new Date(status.serverNow).getTime() - Date.now();
    const reminderDate = computeReminderDate(
      status.nextClaimAt,
      serverOffsetMs,
      reminderSettings.reminderTime,
    );

    const now = Date.now();

    if (reminderDate.getTime() > now) {
      const nextDay = status.canClaim ? status.cycleDay : ((status.cycleDay % 7) + 1);
      const nextCoins = status.config?.find((c) => c.day === nextDay)?.coins || 50;

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_IDS.DAILY_REWARD,
        content: {
          title: 'Your daily coins are ready 🪙',
          body: `Day ${nextDay} reward waiting: ${nextCoins} coins`,
          data: { route: '/(tabs)/rewards' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });
      logger.info('[Notifications] Scheduled daily reminder for:', reminderDate.toISOString());
    }

    if (reminderSettings.streakReminder && status.streak >= 3) {
      const nextClaimTimeMs = new Date(status.nextClaimAt).getTime() - serverOffsetMs;
      const windowEndMs = nextClaimTimeMs + 24 * 60 * 60 * 1000;
      const warningDate = new Date(windowEndMs - 3 * 60 * 60 * 1000);

      if (warningDate.getTime() > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: NOTIFICATION_IDS.STREAK_WARNING,
          content: {
            title: 'Keep your streak going 🔥',
            body: `Don't lose your ${status.streak}-day streak! Claim your reward before midnight.`,
            data: { route: '/(tabs)/rewards' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: warningDate,
          },
        });
        logger.info('[Notifications] Scheduled streak warning for:', warningDate.toISOString());
      }
    }
  } catch (err) {
    logger.warn('[Notifications] Error in rescheduleReminders:', err);
  }
}

/**
 * Handle notification tap / response routing
 */
export function setupNotificationResponseListener() {
  const Notifications = getNotifications();
  if (!Notifications) {
    return () => {};
  }

  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;
      if (route) {
        router.push(route as any);
      }
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const route = response.notification.request.content.data?.route;
        if (route) {
          router.push(route as any);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  } catch (err) {
    logger.warn('[Notifications] Error setting up response listener:', err);
    return () => {};
  }
}
