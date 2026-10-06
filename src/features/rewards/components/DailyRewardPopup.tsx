import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, radii, spacing, typography, gradients, shadows } from '@/theme';
import { Button } from '@/components/ui/Button';
import { useRewardsStore } from '../store/useRewardsStore';
import { useRewardStatus } from '../hooks/useRewardStatus';
import { formatCoins } from '@/utils/format';
import { getUtcDayKey } from '@/utils/date';

export const DailyRewardPopup: React.FC = () => {
  const { canClaim, cycleDay, config } = useRewardStatus();
  const { lastPopupShownDate, setLastPopupShownDate } = useRewardsStore();
  const [dismissed, setDismissed] = useState(false);

  const todayUtc = getUtcDayKey();
  // Derived visibility: shows on first open if eligible and not already shown/dismissed today
  const isVisible = canClaim && !dismissed && lastPopupShownDate !== todayUtc;

  const currentCoins = config.find((c) => c.day === cycleDay)?.coins || 50;

  const handleDismiss = () => {
    setLastPopupShownDate(todayUtc);
    setDismissed(true);
  };

  const handleClaimNow = () => {
    setLastPopupShownDate(todayUtc);
    setDismissed(true);
    router.push('/(tabs)/rewards');
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.bottomSheet, shadows.greenGlow]}>
          <View style={styles.handle} />

          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="gift" size={32} color="#07140F" />
          </LinearGradient>

          <Text style={styles.title}>Daily Reward is Ready!</Text>
          <Text style={styles.subtitle}>
            Collect your Day {cycleDay} reward of {formatCoins(currentCoins)} free coins now and keep your streak alive.
          </Text>

          <View style={styles.actions}>
            <Button
              title={`Claim ${formatCoins(currentCoins)} Coins`}
              variant="primary"
              size="lg"
              onPress={handleClaimNow}
              style={styles.claimButton}
            />
            <Pressable onPress={handleDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>Remind Me Later</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '900',
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  claimButton: {
    width: '100%',
  },
  dismissButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  dismissText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 13,
  },
});
