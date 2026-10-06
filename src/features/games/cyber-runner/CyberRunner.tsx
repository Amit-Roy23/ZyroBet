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
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';
import { GameProps } from '../types';
import {
  getCyberRunnerTrack,
  ObstacleWave,
  RunnerLane,
  CyberRunnerPayload,
} from '@shared/engines';
import { haptics } from '@/lib/haptics';
import { soundManager } from '@/lib/audio';

export function CyberRunner({ session, paused, onScoreChange, onFinish }: GameProps) {
  const { width } = useWindowDimensions();
  const [track] = useState<ObstacleWave[]>(() => getCyberRunnerTrack(session.seed, 35));

  const [currentWaveIndex, setCurrentWaveIndex] = useState(0);
  const [playerLane, setPlayerLane] = useState<RunnerLane>(1); // Center
  const [isJumping, setIsJumping] = useState(false);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const actionsLogRef = useRef<CyberRunnerPayload['actions']>([]);
  const finishedRef = useRef(false);
  const gameStartRef = useRef(0);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    gameStartRef.current = Date.now();
  }, []);

  const runnerJumpY = useSharedValue(0);
  const trackPerspective = Math.min(width - 32, 360);
  const laneWidth = trackPerspective / 3;

  const runnerJumpStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: runnerJumpY.value }],
  }));

  // Finish game
  const handleEnd = useCallback(
    (won = false) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);

      setIsGameOver(true);

      if (won) {
        soundManager.playSound('win');
        haptics.notification('success');
      } else {
        soundManager.playSound('error');
        haptics.notification('error');
      }

      const durationMs = Date.now() - gameStartRef.current;
      onFinish(
        {
          wavesSurvived: currentWaveIndex,
          coinsCollected,
          actions: actionsLogRef.current,
        },
        durationMs
      );
    },
    [currentWaveIndex, coinsCollected, onFinish]
  );

  // Jump Action
  const handleJump = useCallback(() => {
    if (paused || isJumping || isGameOver) return;
    setIsJumping(true);
    soundManager.playSound('flip');
    haptics.impact('medium');

    runnerJumpY.value = withSequence(
      withTiming(-50, { duration: 250 }),
      withTiming(0, { duration: 250 })
    );

    setTimeout(() => {
      setIsJumping(false);
    }, 500);
  }, [paused, isJumping, isGameOver, runnerJumpY]);

  // Lane Shift Actions
  const handleShiftLane = useCallback(
    (dir: -1 | 1) => {
      if (paused || isGameOver) return;
      haptics.impact('light');

      setPlayerLane((curr) => {
        const next = Math.max(0, Math.min(2, curr + dir)) as RunnerLane;
        return next;
      });
    },
    [paused, isGameOver]
  );

  // Game wave advance loop (800ms per wave)
  useEffect(() => {
    if (paused || isGameOver) return;

    tickTimerRef.current = setInterval(() => {
      setCurrentWaveIndex((currIndex) => {
        if (currIndex >= track.length) {
          handleEnd(true);
          return currIndex;
        }

        const wave = track[currIndex];
        const isCollision =
          playerLane === wave.lane && (!isJumping || wave.type === 'laser_gate');

        actionsLogRef.current.push({
          waveId: wave.id,
          lane: playerLane,
          jumped: isJumping,
          hit: isCollision,
        });

        if (isCollision) {
          handleEnd(false);
          return currIndex;
        }

        // Coin collection
        let pts = 50;
        let newCoins = coinsCollected;
        if (wave.coinLane !== undefined && playerLane === wave.coinLane) {
          newCoins += 1;
          pts += 150;
          setCoinsCollected(newCoins);
          soundManager.playSound('match');
          haptics.impact('medium');
        }

        setLiveScore((s) => {
          const updated = s + pts;
          onScoreChange(updated);
          return updated;
        });

        return currIndex + 1;
      });
    }, 750);

    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [paused, isGameOver, track, playerLane, isJumping, coinsCollected, handleEnd, onScoreChange]);

  const currentWave = track[currentWaveIndex] || track[track.length - 1];

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.hudBar}>
        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Wave</Text>
          <Text style={styles.hudValue}>
            {Math.min(currentWaveIndex + 1, track.length)}/{track.length}
          </Text>
        </View>

        <View style={styles.hudChip}>
          <Ionicons name="disc" size={14} color={colors.gold} />
          <Text style={[styles.hudValue, { color: colors.gold }]}>{coinsCollected}</Text>
        </View>

        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Score</Text>
          <Text style={styles.hudValue}>{liveScore}</Text>
        </View>
      </View>

      {/* 3D Cyber Track Visualizer */}
      <View style={[styles.trackBoard, { width: trackPerspective }]}>
        {/* Lane Lines */}
        <View style={styles.laneDividers}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerLine} />
        </View>

        {/* Incoming Wave Obstacles & Coins */}
        {currentWave && !isGameOver && (
          <View style={styles.waveLayer}>
            {/* Obstacle */}
            <View
              style={[
                styles.obstacleItem,
                { left: currentWave.lane * laneWidth + 8, width: laneWidth - 16 },
                currentWave.type === 'laser_gate' && styles.laserGate,
              ]}
            >
              <Ionicons
                name={currentWave.type === 'laser_gate' ? 'flash' : 'warning'}
                size={22}
                color="#FF5252"
              />
              <Text style={styles.obstacleText}>
                {currentWave.type === 'laser_gate' ? 'LASER' : 'JUMP'}
              </Text>
            </View>

            {/* Coin */}
            {currentWave.coinLane !== undefined && (
              <View
                style={[
                  styles.coinItem,
                  { left: currentWave.coinLane * laneWidth + laneWidth / 2 - 14 },
                ]}
              >
                <Ionicons name="disc" size={24} color={colors.gold} />
              </View>
            )}
          </View>
        )}

        {/* Player Avatar */}
        <Animated.View
          style={[
            styles.runnerAvatar,
            { left: playerLane * laneWidth + laneWidth / 2 - 20 },
            runnerJumpStyle,
          ]}
        >
          <View style={[styles.runnerBody, isJumping && styles.runnerJumping]}>
            <Ionicons name="body" size={26} color={isJumping ? colors.gold : colors.primary} />
          </View>
        </Animated.View>
      </View>

      {/* Control Buttons (Left / Jump / Right) */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => handleShiftLane(-1)}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, styles.jumpBtn]}
          onPress={handleJump}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-up" size={32} color="#051A10" />
          <Text style={styles.jumpBtnText}>JUMP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => handleShiftLane(1)}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-forward" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>
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
  trackBoard: {
    height: 320,
    backgroundColor: '#071A12',
    borderRadius: radii.xxl,
    borderWidth: 2,
    borderColor: '#133E2B',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  laneDividers: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  dividerLine: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  waveLayer: {
    ...StyleSheet.absoluteFill,
    top: 50,
  },
  obstacleItem: {
    position: 'absolute',
    height: 44,
    backgroundColor: 'rgba(255, 82, 82, 0.25)',
    borderWidth: 1.5,
    borderColor: '#FF5252',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  laserGate: {
    backgroundColor: 'rgba(255, 0, 85, 0.4)',
    borderColor: '#FF0055',
  },
  obstacleText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FF5252',
  },
  coinItem: {
    position: 'absolute',
    top: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerAvatar: {
    position: 'absolute',
    bottom: 24,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerBody: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#164E33',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerJumping: {
    backgroundColor: '#2E5A1E',
    borderColor: colors.gold,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: 360,
    marginTop: spacing.sm,
  },
  controlBtn: {
    flex: 1,
    height: 64,
    backgroundColor: '#0E2A1F',
    borderWidth: 1.5,
    borderColor: '#1D4D38',
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpBtn: {
    flex: 1.2,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    flexDirection: 'row',
    gap: 4,
  },
  jumpBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#051A10',
  },
});
