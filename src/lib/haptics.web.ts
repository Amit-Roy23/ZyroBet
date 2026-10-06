/**
 * Web haptics implementation using navigator.vibrate where available,
 * with safe no-op fallback on unsupported desktop/browsers.
 */
function vibrate(ms: number | number[]): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  } catch {
    // Ignore vibrations failure on restrictive browsers
  }
}

export const hapticFeedback = {
  light: async () => vibrate(10),
  medium: async () => vibrate(20),
  heavy: async () => vibrate(35),
  success: async () => vibrate([15, 50, 20]),
  warning: async () => vibrate([30, 40, 30]),
  error: async () => vibrate([50, 40, 50, 40]),
  selection: async () => vibrate(8),
};

export const haptics = {
  impact: async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (style === 'medium') return hapticFeedback.medium();
    if (style === 'heavy') return hapticFeedback.heavy();
    return hapticFeedback.light();
  },
  notification: async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (type === 'warning') return hapticFeedback.warning();
    if (type === 'error') return hapticFeedback.error();
    return hapticFeedback.success();
  },
  selection: async () => hapticFeedback.selection(),
};
