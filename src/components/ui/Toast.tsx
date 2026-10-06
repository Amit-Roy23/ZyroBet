import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography, shadows } from '@/theme';
import { hapticFeedback } from '@/lib/haptics';

export type ToastType = 'success' | 'error' | 'info' | 'coin';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    translateY.value = withTiming(-100, { duration: 250 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      // setToast(null);
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const opts: ToastOptions =
        typeof options === 'string' ? { message: options, type: 'info' } : options;
      const type = opts.type || 'info';
      const duration = opts.duration || 3000;

      setToast({ message: opts.message, type });

      if (type === 'success' || type === 'coin') {
        hapticFeedback.success();
      } else if (type === 'error') {
        hapticFeedback.error();
      } else {
        hapticFeedback.light();
      }

      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [hideToast, opacity, translateY],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const iconName =
    toast?.type === 'success'
      ? 'checkmark-circle'
      : toast?.type === 'error'
      ? 'alert-circle'
      : toast?.type === 'coin'
      ? 'disc'
      : 'information-circle';

  const iconColor =
    toast?.type === 'success'
      ? colors.primary
      : toast?.type === 'error'
      ? colors.danger
      : toast?.type === 'coin'
      ? colors.gold
      : colors.info;

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.container,
            { top: Math.max(insets.top + 10, 20) },
            toast.type === 'success' && shadows.greenGlow,
            toast.type === 'coin' && shadows.goldGlow,
            animatedStyle,
          ]}
        >
          <View style={styles.toastContent}>
            <Ionicons name={iconName} size={20} color={iconColor} style={styles.icon} />
            <Text style={styles.messageText}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg,
    maxWidth: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  icon: {
    marginRight: spacing.sm,
  },
  messageText: {
    ...typography.bodyBold,
    color: colors.text,
    fontSize: 13,
    flexShrink: 1,
  },
});
