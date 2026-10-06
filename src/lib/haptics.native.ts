import * as Haptics from 'expo-haptics';

export const hapticFeedback = {
  light: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore if not supported
    }
  },
  medium: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore
    }
  },
  heavy: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Ignore
    }
  },
  success: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore
    }
  },
  warning: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignore
    }
  },
  error: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Ignore
    }
  },
  selection: async () => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignore
    }
  },
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
