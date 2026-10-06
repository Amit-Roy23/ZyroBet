import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { APP_CONFIG } from '@/constants/config';
import { hapticFeedback } from '@/lib/haptics';
import { shareContent } from '@/lib/sharing';
import { useToast } from '@/components/ui/Toast';

export const SideShortcutRail: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const translateX = useSharedValue(60);
  const { showToast } = useToast();

  const toggleRail = () => {
    hapticFeedback.light();
    const nextState = !collapsed;
    setCollapsed(nextState);
    translateX.value = withSpring(nextState ? 60 : 0, {
      damping: 18,
      stiffness: 250,
    });
  };

  const animatedRailStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleSupport = () => {
    hapticFeedback.light();
    router.push('/(tabs)/account');
  };

  const handleCommunity = () => {
    hapticFeedback.light();
    showToast({
      message: 'Opening ZyroBet Community Discord...',
      type: 'info',
    });
  };

  const handleShare = async () => {
    hapticFeedback.light();
    const result = await shareContent({
      message: `Play fun skill mini-games on ${APP_CONFIG.APP_NAME}! 100% free virtual entertainment.`,
      title: APP_CONFIG.APP_NAME,
    });
    if (result.copiedToClipboard) {
      showToast({
        message: 'Share link copied to clipboard!',
        type: 'success',
      });
    }
  };

  return (
    <Animated.View style={[styles.container, animatedRailStyle]}>
      {/* Toggle Tab */}
      <Pressable
        onPress={toggleRail}
        style={[styles.toggleTab, shadows.card]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={collapsed ? 'chevron-back' : 'chevron-forward'}
          size={16}
          color={colors.primary}
        />
      </Pressable>

      {/* Rail Items */}
      <View style={[styles.railBody, shadows.cardElevated]}>
        {/* Support */}
        <Pressable onPress={handleSupport} style={styles.railItem}>
          <View style={styles.iconCircle}>
            <Ionicons name="headset" size={16} color={colors.primary} />
          </View>
          <Text style={styles.railLabel}>Help</Text>
        </Pressable>

        {/* Community */}
        <Pressable onPress={handleCommunity} style={styles.railItem}>
          <View style={styles.iconCircle}>
            <Ionicons name="people" size={16} color={colors.gold} />
          </View>
          <Text style={styles.railLabel}>Club</Text>
        </Pressable>

        {/* Share */}
        <Pressable onPress={handleShare} style={styles.railItem}>
          <View style={styles.iconCircle}>
            <Ionicons name="share-social" size={16} color={colors.info} />
          </View>
          <Text style={styles.railLabel}>Share</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: '38%',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  toggleTab: {
    backgroundColor: colors.surfaceAlt,
    borderTopLeftRadius: radii.md,
    borderBottomLeftRadius: radii.md,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  railBody: {
    backgroundColor: colors.surfaceAlt,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.borderLight,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs + 2,
    gap: spacing.sm,
    width: 60,
    alignItems: 'center',
  },
  railItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  railLabel: {
    ...typography.micro,
    fontSize: 9,
    color: colors.textMuted,
  },
});
