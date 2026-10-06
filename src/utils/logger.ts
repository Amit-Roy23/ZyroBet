/**
 * Safe development logging utility
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log('[ZyroBet INFO]:', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn('[ZyroBet WARN]:', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[ZyroBet ERROR]:', ...args);
  },
};
