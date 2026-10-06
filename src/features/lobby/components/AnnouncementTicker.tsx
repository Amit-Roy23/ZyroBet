import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, typography, radii } from '@/theme';
import { ANNOUNCEMENTS, AnnouncementTickerItem } from '@/constants/gameCatalog';

export const AnnouncementTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const announcements = ANNOUNCEMENTS;
  const currentItem: AnnouncementTickerItem = announcements[currentIndex] || announcements[0];

  useEffect(() => {
    const interval = setInterval(() => {
      // Animate out
      translateY.value = withTiming(-14, { duration: 300 });
      opacity.value = withTiming(0, { duration: 250 }, () => {
        // Change text
        // Note: state update in React
      });

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
        translateY.value = 14;
        translateY.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(1, { duration: 300 });
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [announcements.length, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getIconName = (icon: string): keyof typeof Ionicons.glyphMap => {
    switch (icon) {
      case 'trophy':
        return 'trophy';
      case 'gift':
        return 'gift';
      case 'sparkles':
        return 'sparkles';
      case 'shield-check':
        return 'shield-checkmark';
      default:
        return 'megaphone';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="volume-medium" size={14} color={colors.primary} />
      </View>

      <View style={styles.tickerContainer}>
        <Animated.View style={[styles.textRow, animatedStyle]}>
          <Ionicons
            name={getIconName(currentItem.icon)}
            size={13}
            color={colors.gold}
            style={styles.itemIcon}
          />
          <Text style={styles.tickerText} numberOfLines={1}>
            {currentItem.text}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs + 2,
  },
  tickerContainer: {
    flex: 1,
    height: 18,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 4,
  },
  tickerText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
