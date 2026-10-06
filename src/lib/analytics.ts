import { logger } from '@/utils/logger';

export const analytics = {
  trackEvent: (eventName: string, properties?: Record<string, unknown>) => {
    if (process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true') {
      logger.info(`[Analytics Event]: ${eventName}`, properties);
    }
  },
  trackScreen: (screenName: string) => {
    if (process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true') {
      logger.info(`[Analytics Screen]: ${screenName}`);
    }
  },
};
