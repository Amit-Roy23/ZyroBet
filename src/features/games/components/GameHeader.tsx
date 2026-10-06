import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '@/theme';
import { CoinChip } from '@/components/ui/CoinChip';
import { hapticFeedback } from '@/lib/haptics';

export interface GameHeaderProps {
  title: string;
  coinBalance: number;
  onExit: () => void;
  onHelp?: () => void;
  onMuteToggle?: () => void;
  isMuted?: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  coinBalance,
  onExit,
  onHelp,
  onMuteToggle,
  isMuted = false,
}) => {
  const handleExit = () => {
    hapticFeedback.light();
    onExit();
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleExit}
        style={styles.actionBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={22} color={colors.text} />
      </Pressable>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightGroup}>
        {onMuteToggle && (
          <Pressable onPress={onMuteToggle} style={styles.actionBtn}>
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}
        {onHelp && (
          <Pressable onPress={onHelp} style={styles.actionBtn}>
            <Ionicons name="help-circle-outline" size={20} color={colors.textMuted} />
          </Pressable>
        )}
        <CoinChip balance={coinBalance} showAddButton={false} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
