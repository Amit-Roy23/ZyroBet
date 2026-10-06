import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radii, gradients, shadows } from '@/theme';
import { UserProfile } from '@/types/profile';
import { Badge } from '@/components/ui/Badge';

export interface ProfileHeaderProps {
  user: UserProfile;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const xpPercentage = Math.min(100, Math.round((user.xp / user.xpToNextLevel) * 100));

  return (
    <LinearGradient
      colors={gradients.surface}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, shadows.cardElevated]}
    >
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: user.avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lv.{user.level}</Text>
          </View>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{user.username}</Text>
            {user.isGuest && <Badge label="GUEST" variant="neutral" />}
          </View>
          <Text style={styles.subtitle}>Skill Gamer • Casual Explorer</Text>
        </View>
      </View>

      {/* Level XP Progress Bar */}
      <View style={styles.xpSection}>
        <View style={styles.xpLabelRow}>
          <Text style={styles.xpLabel}>Level {user.level} Progress</Text>
          <Text style={styles.xpValue}>
            {user.xp} / {user.xpToNextLevel} XP ({xpPercentage}%)
          </Text>
        </View>
        <View style={styles.xpTrack}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.xpFill, { width: `${xpPercentage}%` }]}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  levelBadgeText: {
    ...typography.micro,
    color: '#07140F',
    fontSize: 9,
    fontWeight: '900',
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  username: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  xpSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  xpLabel: {
    ...typography.captionBold,
    fontSize: 11,
    color: colors.textSecondary,
  },
  xpValue: {
    ...typography.micro,
    fontSize: 10,
    color: colors.primary,
  },
  xpTrack: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
  },
});
