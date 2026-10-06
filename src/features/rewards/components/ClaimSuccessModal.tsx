import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, typography, gradients, shadows } from '@/theme';
import { Button } from '@/components/ui/Button';
import { ClaimResult, DailyRewardConfigItem } from '../types';
import { formatCoins } from '@/utils/format';
import { useRewardsStore } from '../store/useRewardsStore';
import { requestNotificationPermissions } from '../notifications/scheduler';

export interface ClaimSuccessModalProps {
  visible: boolean;
  result: ClaimResult | null;
  config: DailyRewardConfigItem[];
  onClose: () => void;
}

export const ClaimSuccessModal: React.FC<ClaimSuccessModalProps> = ({
  visible,
  result,
  config,
  onClose,
}) => {
  const { reminderSettings, setHasPromptedOptIn } = useRewardsStore();
  const [requestingPerms, setRequestingPerms] = useState(false);

  if (!result) return null;

  const isDay7 = result.cycleDay === 7;
  const nextCycleDay = isDay7 ? 1 : result.cycleDay + 1;
  const nextCoins = config.find((c) => c.day === nextCycleDay)?.coins || 50;

  // Show opt-in card only if user has never been prompted before and reminders are not enabled
  const showOptInCard = !reminderSettings.hasPromptedOptIn && !reminderSettings.enabled;

  const handleEnableReminders = async () => {
    setRequestingPerms(true);
    setHasPromptedOptIn(true);
    await requestNotificationPermissions();
    setRequestingPerms(false);
  };

  const handleDismissOptIn = () => {
    setHasPromptedOptIn(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialogCard, shadows.goldGlow]}>
          {/* Header Trophy / Coin Glow */}
          <LinearGradient
            colors={isDay7 ? gradients.gold : gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons
              name={isDay7 ? 'trophy' : 'disc'}
              size={42}
              color="#07140F"
            />
          </LinearGradient>

          <Text style={styles.title}>
            {isDay7 ? 'Mega Reward Claimed!' : 'Daily Reward Collected!'}
          </Text>

          {/* Amount Badge */}
          <View style={styles.amountBadge}>
            <Text style={styles.amountText}>+{formatCoins(result.coins)}</Text>
            <Text style={styles.amountLabel}>VIRTUAL COINS</Text>
          </View>

          {/* Streak & Next day info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                Cycle: <Text style={styles.infoHighlight}>Day {result.cycleDay} of 7</Text>
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="flame" size={16} color={colors.gold} />
              <Text style={styles.infoText}>
                Streak: <Text style={styles.infoHighlight}>{result.streak} {result.streak === 1 ? 'Day' : 'Days'}</Text>
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.nextDayNotice}>
              {isDay7
                ? '🏆 7-day cycle completed! Tomorrow starts a fresh cycle for 50 coins.'
                : `Come back tomorrow to collect ${nextCoins} coins on Day ${nextCycleDay}!`}
            </Text>
          </View>

          {/* First-time Notification Opt-in Card */}
          {showOptInCard && (
            <View style={styles.optInContainer}>
              <View style={styles.optInHeader}>
                <Ionicons name="notifications-outline" size={18} color={colors.primary} />
                <Text style={styles.optInTitle}>Daily Reminder</Text>
              </View>
              <Text style={styles.optInDescription}>
                Never lose your streak! Get a friendly reminder at 18:00 when your next reward is ready.
              </Text>
              <View style={styles.optInButtons}>
                <Button
                  title={requestingPerms ? 'Enabling...' : 'Enable Reminders'}
                  variant="primary"
                  size="sm"
                  onPress={handleEnableReminders}
                  disabled={requestingPerms}
                  style={styles.optInConfirm}
                />
                <Pressable onPress={handleDismissOptIn} style={styles.optInDismiss}>
                  <Text style={styles.optInDismissText}>Maybe Later</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Dismiss Button */}
          <Button
            title="Awesome!"
            variant="gold"
            size="lg"
            onPress={onClose}
            style={styles.closeButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    marginBottom: spacing.sm,
    borderWidth: 3,
    borderColor: colors.bg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
  },
  amountBadge: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  amountText: {
    ...typography.coin,
    fontSize: 32,
    color: colors.gold,
    fontWeight: '900',
  },
  amountLabel: {
    ...typography.micro,
    color: colors.goldLight,
    letterSpacing: 1.2,
    fontSize: 9,
    marginTop: -2,
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  infoHighlight: {
    color: colors.text,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  nextDayNotice: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  optInContainer: {
    width: '100%',
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  optInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  optInTitle: {
    ...typography.captionBold,
    color: colors.primary,
    fontSize: 13,
  },
  optInDescription: {
    ...typography.micro,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  optInButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs + 2,
    gap: spacing.xs,
  },
  optInConfirm: {
    flex: 1,
  },
  optInDismiss: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  optInDismissText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  closeButton: {
    width: '100%',
    marginTop: spacing.md,
  },
});
