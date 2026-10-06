import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, gradients, shadows } from '@/theme';
import { hapticFeedback } from '@/lib/haptics';
import { useReducedMotion } from '@/hooks/useReducedMotion';

import { useRewardStatus } from '@/features/rewards/hooks/useRewardStatus';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const isReducedMotion = useReducedMotion();
  const { canClaim } = useRewardStatus();
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isReducedMotion) return;
    pulseScale.value = withRepeat(
      withTiming(1.08, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [isReducedMotion, pulseScale]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const tabMeta: Record<
    string,
    {
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      iconActive: keyof typeof Ionicons.glyphMap;
      isCenter?: boolean;
      badge?: number | string;
    }
  > = {
    home: {
      label: 'Home',
      icon: 'game-controller-outline',
      iconActive: 'game-controller',
    },
    promotions: {
      label: 'Events',
      icon: 'trophy-outline',
      iconActive: 'trophy',
      badge: 'NEW',
    },
    rewards: {
      label: 'Daily Gift',
      icon: 'gift',
      iconActive: 'gift',
      isCenter: true,
      badge: canClaim ? '!' : undefined,
    },
    shop: {
      label: 'Shop',
      icon: 'cart-outline',
      iconActive: 'cart',
    },
    account: {
      label: 'Account',
      icon: 'person-circle-outline',
      iconActive: 'person-circle',
    },
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.container}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const meta = tabMeta[route.name] || {
            label: route.name,
            icon: 'ellipse-outline',
            iconActive: 'ellipse',
          };

          const onPress = () => {
            hapticFeedback.light();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          if (meta.isCenter) {
            return (
              <View key={route.key} style={styles.centerTabSlot}>
                <AnimatedPressable
                  onPress={onPress}
                  style={[styles.centerButtonOuter, pulseAnimatedStyle, shadows.greenGlow]}
                  accessibilityRole="button"
                  accessibilityLabel="Daily Rewards"
                >
                  <LinearGradient
                    colors={gradients.tabRaisedButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.centerButtonGradient}
                  >
                    <Ionicons name="gift" size={26} color="#07140F" />
                    {meta.badge && (
                      <View style={styles.centerBadge}>
                        <Text style={styles.centerBadgeText}>{meta.badge}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </AnimatedPressable>
                <Text
                  style={[
                    styles.centerLabel,
                    isFocused ? styles.labelFocused : styles.labelUnfocused,
                  ]}
                >
                  {meta.label}
                </Text>
              </View>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              style={styles.tabItem}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isFocused ? meta.iconActive : meta.icon}
                  size={22}
                  color={isFocused ? colors.primary : colors.textMuted}
                />
                {meta.badge && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{meta.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isFocused ? styles.labelFocused : styles.labelUnfocused,
                ]}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },
  label: {
    ...typography.micro,
    fontSize: 10,
    marginTop: 3,
  },
  labelFocused: {
    color: colors.primary,
    fontWeight: '800',
  },
  labelUnfocused: {
    color: colors.textMuted,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.danger,
    borderRadius: radii.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  centerTabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    position: 'relative',
    paddingBottom: 4,
  },
  centerButtonOuter: {
    position: 'absolute',
    top: -24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryDark,
    borderWidth: 3,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  centerButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.gold,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  centerBadgeText: {
    color: '#07140F',
    fontSize: 9,
    fontWeight: '900',
  },
  centerLabel: {
    ...typography.micro,
    fontSize: 10,
    marginTop: 2,
  },
});
