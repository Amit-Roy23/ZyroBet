import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';
import { GameFinishResult } from '../types';
import { ClaimCelebration } from '@/features/rewards/components/ClaimCelebration';
import { soundManager } from '@/lib/audio';
import { getGameCoverSource } from '@/constants/gameAssets';
import { Image } from 'expo-image';

interface GameResultModalProps {
  visible: boolean;
  result: (GameFinishResult & { isPendingQueue?: boolean }) | null;
  isPractice: boolean;
  gameTitle: string;
  gameId?: string;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function GameResultModal({
  visible,
  result,
  isPractice,
  gameTitle,
  gameId,
  onPlayAgain,
  onHome,
}: GameResultModalProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const coinsAwarded = result?.coinsAwarded || 0;
  const isNewBest = result?.isNewBest || false;
  const isCapReached = result?.capReachedGame || result?.capReachedGlobal || false;

  useEffect(() => {
    if (!visible || !result) {
      return;
    }

    // Trigger celebration if coins awarded
    const celebTimer = setTimeout(() => {
      if (coinsAwarded > 0) {
        setShowCelebration(true);
        soundManager.playSound('win');
      }
    }, 150);

    // Score interpolation count-up
    const target = result.score;
    const duration = 600;
    const steps = 20;
    const stepTime = duration / steps;
    let step = 0;

    const countTimer = setInterval(() => {
      step++;
      const current = Math.min(target, Math.round((step / steps) * target));
      setDisplayScore(current);

      if (step >= steps) {
        clearInterval(countTimer);
      }
    }, stepTime);

    return () => {
      clearTimeout(celebTimer);
      clearInterval(countTimer);
      setDisplayScore(0);
      setShowCelebration(false);
    };
  }, [visible, result, coinsAwarded]);

  if (!result) return null;

  const gameEarned = result.earnedTodayGame || 0;
  const gameCap = result.dailyCapGame || 100;
  const gamePct = Math.min(100, Math.round((gameEarned / gameCap) * 100));

  const globalEarned = result.earnedTodayGlobal || 0;
  const globalCap = result.dailyCapGlobal || 300;
  const globalPct = Math.min(100, Math.round((globalEarned / globalCap) * 100));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Game Cover / Trophy */}
          <View style={styles.trophyWrapper}>
            {gameId ? (
              <Image
                source={getGameCoverSource(gameId)}
                style={styles.gameCoverImg}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="trophy" size={42} color={colors.gold} />
            )}
            {isNewBest ? (
              <View style={styles.newBestBadge}>
                <Ionicons name="sparkles" size={12} color="#051A10" />
                <Text style={styles.newBestText}>NEW BEST!</Text>
              </View>
            ) : (
              <View style={styles.trophyMiniBadge}>
                <Ionicons name="trophy" size={14} color={colors.gold} />
              </View>
            )}
          </View>

          <Text style={styles.gameTitle}>{gameTitle}</Text>

          {/* Main Score Display */}
          <Text style={styles.scoreText}>{displayScore.toLocaleString()}</Text>
          <Text style={styles.bestScoreLabel}>
            Best Score: {result.bestScore.toLocaleString()}
          </Text>

          {/* Coins Award Banner */}
          {coinsAwarded > 0 ? (
            <View style={styles.coinsAwardBox}>
              <Ionicons name="disc" size={22} color={colors.gold} />
              <Text style={styles.coinsAwardText}>+{coinsAwarded} Virtual Coins</Text>
            </View>
          ) : isPractice ? (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>Practice mode: no coins awarded</Text>
            </View>
          ) : result.isPendingQueue ? (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color={colors.gold} />
              <Text style={styles.infoText}>Offline: score queued for sync</Text>
            </View>
          ) : isCapReached ? (
            <View style={styles.capMessageBox}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={styles.capMessageText}>
                Daily coin limit reached. You can still play for fun and new best scores!
              </Text>
            </View>
          ) : (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Great game!</Text>
            </View>
          )}

          {/* Progress Bars for Daily Earnings */}
          {!isPractice && (
            <View style={styles.progressContainer}>
              <View style={styles.progressRow}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>Today from {gameTitle}</Text>
                  <Text style={styles.progressValue}>
                    {gameEarned}/{gameCap}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${gamePct}%` }]} />
                </View>
              </View>

              <View style={styles.progressRow}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>Overall Game Coins</Text>
                  <Text style={styles.progressValue}>
                    {globalEarned}/{globalCap}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${globalPct}%`, backgroundColor: colors.gold },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={onHome}
              activeOpacity={0.8}
            >
              <Ionicons name="home" size={18} color={colors.text} />
              <Text style={styles.btnSecondaryText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={onPlayAgain}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="#051A10" />
              <Text style={styles.btnPrimaryText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ClaimCelebration
          visible={showCelebration}
          coins={coinsAwarded}
          onComplete={() => setShowCelebration(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0E2A1F',
    borderRadius: radii.xxl,
    borderWidth: 2,
    borderColor: '#1D4D38',
    padding: spacing.xl,
    alignItems: 'center',
  },
  trophyWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#164E33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#246B48',
    overflow: 'hidden',
  },
  gameCoverImg: {
    width: '100%',
    height: '100%',
  },
  trophyMiniBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(7, 20, 15, 0.85)',
    borderRadius: radii.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  newBestBadge: {
    position: 'absolute',
    top: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    zIndex: 10,
  },
  newBestText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#051A10',
  },
  gameTitle: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    fontFamily: typography.fonts.heading,
    marginVertical: 2,
  },
  bestScoreLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  coinsAwardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    marginBottom: spacing.lg,
  },
  coinsAwardText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.gold,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#14382A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  capMessageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#123626',
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  capMessageText: {
    fontSize: 12,
    color: colors.primaryMuted,
    flex: 1,
  },
  progressContainer: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    backgroundColor: '#071A12',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#133E2B',
  },
  progressRow: {
    width: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#14382A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
  },
  btnSecondary: {
    backgroundColor: '#164E33',
    borderWidth: 1,
    borderColor: '#226346',
  },
  btnSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: '#051A10',
    fontSize: 15,
    fontWeight: '800',
  },
});
