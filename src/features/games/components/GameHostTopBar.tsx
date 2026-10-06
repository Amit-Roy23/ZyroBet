import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '@/theme';

interface GameHostTopBarProps {
  title: string;
  score: number;
  bestScore: number;
  isPlaying: boolean;
  onBack: () => void;
  onPause: () => void;
}

export function GameHostTopBar({
  title,
  score,
  bestScore,
  isPlaying,
  onBack,
  onPause,
}: GameHostTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      {/* Center Title & Score HUD */}
      <View style={styles.centerContainer}>
        <Text style={styles.gameTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>
            Score: <Text style={styles.scoreHighlight}>{score}</Text>
          </Text>
          <View style={styles.bestBadge}>
            <Ionicons name="trophy" size={12} color={colors.gold} />
            <Text style={styles.bestScoreText}>{bestScore}</Text>
          </View>
        </View>
      </View>

      {/* Pause Button */}
      {isPlaying ? (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPause}
          activeOpacity={0.7}
        >
          <Ionicons name="pause" size={20} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButtonPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: '#0E2A1F',
    borderWidth: 1,
    borderColor: '#1D4D38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    fontFamily: typography.fonts.heading,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  scoreText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  scoreHighlight: {
    color: colors.primary,
    fontWeight: '800',
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1E2D12',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#3D5924',
  },
  bestScoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
  },
});
