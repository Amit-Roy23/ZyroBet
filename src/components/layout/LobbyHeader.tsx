import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radii, gradients } from '@/theme';
import { CoinChip } from '@/components/ui/CoinChip';
import { APP_CONFIG } from '@/constants/config';
import { hapticFeedback } from '@/lib/haptics';

import { useGameDailyStatus } from '@/features/games/hooks/useGameDailyStatus';

export interface LobbyHeaderProps {
  coinBalance: number;
  unreadNotificationsCount?: number;
  onNotificationsPress?: () => void;
  onAvatarPress?: () => void;
}

export const LobbyHeader: React.FC<LobbyHeaderProps> = ({
  coinBalance,
  unreadNotificationsCount = 2,
  onNotificationsPress,
}) => {
  const { data: dailyStatus } = useGameDailyStatus();
  const globalEarned = dailyStatus?.globalEarnedToday || 0;
  const globalCap = dailyStatus?.globalCap || 300;

  const handleNotificationPress = () => {
    hapticFeedback.light();
    if (onNotificationsPress) {
      onNotificationsPress();
    } else {
      router.push('/(tabs)/promotions');
    }
  };

  return (
    <View style={styles.container}>
      {/* Brand Logo & Name */}
      <View style={styles.brandContainer}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBadge}
        >
          <Ionicons name="game-controller" size={18} color="#07140F" />
        </LinearGradient>
        <View style={styles.brandTextContainer}>
          <Text style={styles.brandTitle}>{APP_CONFIG.APP_NAME}</Text>
          {/* Daily Coins Mini Progress Chip */}
          <View style={styles.dailyCoinsChip}>
            <Ionicons name="flash" size={10} color={colors.primary} />
            <Text style={styles.dailyCoinsText}>
              Today: {globalEarned}/{globalCap}
            </Text>
          </View>
        </View>
      </View>

      {/* Right Controls: Coin Balance Chip + Notifications Bell */}
      <View style={styles.rightActions}>
        <CoinChip balance={coinBalance} />

        <Pressable
          onPress={handleNotificationPress}
          style={styles.bellButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="notifications" size={20} color={colors.text} />
          {unreadNotificationsCount > 0 && (
            <View style={styles.badgeDot}>
              <Text style={styles.badgeText}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs + 4,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: colors.text,
  },
  brandSubtitle: {
    ...typography.micro,
    fontSize: 8,
    color: colors.primary,
    letterSpacing: 1.2,
    marginTop: -2,
  },
  dailyCoinsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0E2A1F',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#1D4D38',
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  dailyCoinsText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryMuted,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
