import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';
import { GameProps } from '../types';
import {
  getSniperTargets,
  SniperTarget,
  TargetSniperPayload,
  SNIPER_ROUNDS_COUNT,
} from '@shared/engines';
import { haptics } from '@/lib/haptics';
import { soundManager } from '@/lib/audio';

export function TargetSniper({ session, paused, onScoreChange, onFinish }: GameProps) {
  const { width } = useWindowDimensions();
  const [targets] = useState<SniperTarget[]>(() => getSniperTargets(session.seed, SNIPER_ROUNDS_COUNT));

  const [currentRound, setCurrentRound] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  const tapsLogRef = useRef<TargetSniperPayload['taps']>([]);
  const finishedRef = useRef(false);
  const gameStartRef = useRef(0);
  const roundStartTimeRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    gameStartRef.current = now;
    roundStartTimeRef.current = now;
  }, []);

  const arenaSize = Math.min(width - 32, 340);
  const ringScale = useSharedValue(1);

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  // Start round animation
  const startTargetCycle = useCallback(
    (target: SniperTarget) => {
      roundStartTimeRef.current = Date.now();
      ringScale.value = 1;
      ringScale.value = withRepeat(
        withTiming(0.2, {
          duration: target.durationMs,
          easing: Easing.linear,
        }),
        -1,
        true
      );
    },
    [ringScale]
  );

  useEffect(() => {
    if (paused || finishedRef.current) return;
    const target = targets[currentRound];
    if (target) {
      startTargetCycle(target);
    }
  }, [currentRound, paused, targets, startTargetCycle]);

  // Finish session
  const handleEnd = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    soundManager.playSound('win');
    haptics.notification('success');

    const durationMs = Date.now() - (gameStartRef.current || Date.now());
    onFinish({ taps: tapsLogRef.current }, durationMs);
  }, [onFinish]);

  // Handle Tap
  const handleTap = () => {
    if (paused || finishedRef.current) return;

    const target = targets[currentRound];
    if (!target) return;

    // Sweet spot is when ringScale is around targetRadiusRatio (0.35)
    // Scale delta from sweet spot (0.35)
    const scaleDiff = Math.abs(ringScale.value - target.targetRadiusRatio);
    const estimatedDeltaMs = Math.round(scaleDiff * target.durationMs);

    let roundPoints = 0;
    let feedbackText = 'MISS';
    let feedbackColor = '#FF5252';

    if (estimatedDeltaMs <= 35) {
      roundPoints = 300;
      feedbackText = 'BULLSEYE! +300';
      feedbackColor = '#00E676';
      soundManager.playSound('match');
      haptics.notification('success');
    } else if (estimatedDeltaMs <= 80) {
      roundPoints = 200;
      feedbackText = 'GREAT! +200';
      feedbackColor = colors.gold;
      soundManager.playSound('flip');
      haptics.impact('medium');
    } else if (estimatedDeltaMs <= 150) {
      roundPoints = 100;
      feedbackText = 'GOOD +100';
      feedbackColor = '#00E5FF';
      soundManager.playSound('flip');
      haptics.impact('light');
    } else {
      roundPoints = 20;
      feedbackText = 'EARLY/LATE +20';
      feedbackColor = '#FF5252';
      soundManager.playSound('error');
      haptics.notification('error');
    }

    setFeedback({ text: feedbackText, color: feedbackColor });

    const newScore = liveScore + roundPoints;
    setLiveScore(newScore);
    onScoreChange(newScore);

    tapsLogRef.current.push({
      targetId: target.id,
      deltaMs: estimatedDeltaMs,
      score: roundPoints,
    });

    if (currentRound + 1 >= targets.length) {
      setTimeout(() => {
        handleEnd();
      }, 500);
    } else {
      setCurrentRound((r) => r + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.hudBar}>
        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Target</Text>
          <Text style={styles.hudValue}>
            {currentRound + 1}/{targets.length}
          </Text>
        </View>

        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Score</Text>
          <Text style={styles.hudValue}>{liveScore}</Text>
        </View>
      </View>

      {/* Target Crosshair Reticle Arena */}
      <View style={[styles.arena, { width: arenaSize, height: arenaSize }]}>
        {/* Crosshair Lines */}
        <View style={styles.crosshairH} />
        <View style={styles.crosshairV} />

        {/* Outer Ring boundary */}
        <View style={styles.outerFixedRing} />

        {/* Sweet Spot Inner Ring */}
        <View style={styles.sweetSpotRing}>
          <View style={styles.centerBullseyeDot} />
        </View>

        {/* Moving Dynamic Reticle Ring */}
        <Animated.View style={[styles.movingRing, ringAnimatedStyle]} />

        {/* Feedback Message */}
        {feedback && (
          <View style={styles.feedbackBox}>
            <Text style={[styles.feedbackText, { color: feedback.color }]}>
              {feedback.text}
            </Text>
          </View>
        )}
      </View>

      {/* Big TAP Trigger Button */}
      <TouchableOpacity style={styles.bigTapButton} onPress={handleTap} activeOpacity={0.8}>
        <Ionicons name="radio-button-on" size={36} color="#051A10" />
        <Text style={styles.bigTapText}>TAP TO LOCK TARGET</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  hudBar: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  hudChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0E2A1F',
    borderWidth: 1,
    borderColor: '#1D4D38',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  hudLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hudValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fonts.heading,
  },
  arena: {
    backgroundColor: '#071A12',
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: '#133E2B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(46, 204, 113, 0.25)',
  },
  crosshairV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(46, 204, 113, 0.25)',
  },
  outerFixedRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  sweetSpotRing: {
    width: '35%',
    height: '35%',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    shadowColor: colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  centerBullseyeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF5252',
  },
  movingRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.full,
    borderWidth: 3,
    borderColor: '#00E5FF',
  },
  feedbackBox: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: 'rgba(5, 26, 16, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: '#1D4D38',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bigTapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    width: '100%',
    maxWidth: 340,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  bigTapText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#051A10',
    letterSpacing: 0.5,
  },
});
