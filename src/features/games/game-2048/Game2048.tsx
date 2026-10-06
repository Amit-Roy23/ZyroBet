import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/theme';
import { GameProps } from '../types';
import {
  create2048Game,
  apply2048Move,
  Game2048State,
  MoveDirection,
  Tile,
} from '@shared/engines';
import { haptics } from '@/lib/haptics';
import { soundManager } from '@/lib/audio';

const TILE_COLORS: Record<number, { bg: string; text: string; glow?: string }> = {
  2: { bg: '#1A4B35', text: '#E2FBE8' },
  4: { bg: '#226346', text: '#E2FBE8' },
  8: { bg: '#2E8B57', text: '#FFFFFF', glow: '#2E8B5744' },
  16: { bg: '#3CB371', text: '#FFFFFF', glow: '#3CB37155' },
  32: { bg: '#00D084', text: '#051A10', glow: '#00D08466' },
  64: { bg: '#00E676', text: '#051A10', glow: '#00E67688' },
  128: { bg: '#5CE1E6', text: '#051A10', glow: '#5CE1E688' },
  256: { bg: '#FFD700', text: '#0A2017', glow: '#FFD70088' },
  512: { bg: '#FFC107', text: '#0A2017', glow: '#FFC10799' },
  1024: { bg: '#FFB300', text: '#0A2017', glow: '#FFB300AA' },
  2048: { bg: '#FFA000', text: '#0A2017', glow: '#FFA000CC' },
  4096: { bg: '#FF5722', text: '#FFFFFF', glow: '#FF5722CC' },
};

function AnimatedTile({
  tile,
  cellSize,
  cellGap,
}: {
  tile: Tile;
  cellSize: number;
  cellGap: number;
}) {
  const scale = useSharedValue(0);
  const left = tile.col * (cellSize + cellGap);
  const top = tile.row * (cellSize + cellGap);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1.1, { damping: 12 }),
      withSpring(1, { damping: 14 })
    );
  }, [tile.value, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tileStyle = TILE_COLORS[tile.value] || { bg: '#FF5722', text: '#FFF' };

  return (
    <Animated.View
      style={[
        styles.tileContainer,
        {
          width: cellSize,
          height: cellSize,
          left,
          top,
          backgroundColor: tileStyle.bg,
          shadowColor: tileStyle.glow || 'transparent',
          shadowOpacity: tileStyle.glow ? 0.8 : 0,
          shadowRadius: 10,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.tileText,
          {
            color: tileStyle.text,
            fontSize: tile.value >= 1024 ? 20 : tile.value >= 128 ? 24 : 30,
          },
        ]}
      >
        {tile.value}
      </Text>
    </Animated.View>
  );
}

export function Game2048({
  session,
  paused,
  onScoreChange,
  onFinish,
}: GameProps) {
  const { width } = useWindowDimensions();
  const [gameState, setGameState] = useState<Game2048State>(() =>
    create2048Game(session.seed)
  );
  const [movesLog, setMovesLog] = useState<string>('');
  const [gameStartedAt, setGameStartedAt] = useState<number>(0);
  const [hasFinished, setHasFinished] = useState<boolean>(false);

  // Responsive board calculation
  const boardSize = Math.min(width - 32, 380);
  const cellGap = 8;
  const cellSize = (boardSize - cellGap * 5) / 4;

  const handleFinish = useCallback(
    (_finalScore: number, moves: string, startedAtTime?: number) => {
      if (hasFinished) return;
      setHasFinished(true);
      const start = startedAtTime || gameStartedAt || Date.now();
      const durationMs = Math.max(Date.now() - start, moves.length * 100);
      onFinish({ moves }, durationMs);
    },
    [hasFinished, gameStartedAt, onFinish]
  );

  const makeMove = useCallback(
    (dir: MoveDirection) => {
      if (paused || gameState.over || hasFinished) return;

      const now = Date.now();
      const currentStart = gameStartedAt || now;
      if (!gameStartedAt) {
        setGameStartedAt(now);
      }

      const prevMoves = gameState.moves;
      const { state: nextState, events } = apply2048Move(gameState, dir);

      if (nextState.moves > prevMoves) {
        // Effective move
        const newMovesLog = movesLog + dir;
        setMovesLog(newMovesLog);
        setGameState(nextState);
        onScoreChange(nextState.score);

        // Haptic feedback & audio
        const hasMerge = events.some((e) => e.mergedIntoId !== undefined);
        if (hasMerge) {
          soundManager.playSound('merge');
          const maxVal = Math.max(...nextState.board);
          if (maxVal >= 2048) {
            haptics.notification('success');
          } else if (maxVal >= 512) {
            haptics.impact('medium');
          } else {
            haptics.impact('light');
          }
        }

        if (nextState.over) {
          setTimeout(() => {
            handleFinish(nextState.score, newMovesLog, currentStart);
          }, 600);
        }
      }
    },
    [paused, gameState, hasFinished, gameStartedAt, movesLog, onScoreChange, handleFinish]
  );

  const handleSwipe = useCallback(
    (dir: MoveDirection) => {
      makeMove(dir);
    },
    [makeMove]
  );

  // Web keyboard support (Arrow keys + WASD)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (paused || hasFinished) return;

      const key = e.key.toLowerCase();
      let dir: MoveDirection | null = null;

      if (e.key === 'ArrowUp' || key === 'w') {
        dir = 'U';
      } else if (e.key === 'ArrowDown' || key === 's') {
        dir = 'D';
      } else if (e.key === 'ArrowLeft' || key === 'a') {
        dir = 'L';
      } else if (e.key === 'ArrowRight' || key === 'd') {
        dir = 'R';
      }

      if (dir) {
        e.preventDefault();
        makeMove(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [paused, hasFinished, makeMove]);

  // Gesture handling
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(20)
        .onEnd((e) => {
          'worklet';
          const dx = e.translationX;
          const dy = e.translationY;
          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) runOnJS(handleSwipe)('R');
            else runOnJS(handleSwipe)('L');
          } else {
            if (dy > 0) runOnJS(handleSwipe)('D');
            else runOnJS(handleSwipe)('U');
          }
        }),
    [handleSwipe]
  );

  return (
    <View style={styles.container}>
      {/* Board Container with Pan Gesture */}
      <GestureDetector gesture={panGesture}>
        <View
          style={[
            styles.board,
            {
              width: boardSize,
              height: boardSize,
              padding: cellGap,
            },
          ]}
        >
          {/* Background Grid Cells */}
          {Array.from({ length: 16 }).map((_, i) => (
            <View
              key={`grid-${i}`}
              style={[
                styles.gridCell,
                {
                  width: cellSize,
                  height: cellSize,
                  margin: cellGap / 2,
                },
              ]}
            />
          ))}

          {/* Active Animated Tiles */}
          <View style={[StyleSheet.absoluteFill, { margin: cellGap }]}>
            {gameState.tiles.map((tile) => (
              <AnimatedTile
                key={tile.id}
                tile={tile}
                cellSize={cellSize}
                cellGap={cellGap}
              />
            ))}
          </View>

          {/* Game Over Banner */}
          {gameState.over && (
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>Game Over!</Text>
              <Text style={styles.overlaySubtitle}>
                Final Score: {gameState.score}
              </Text>
            </View>
          )}
        </View>
      </GestureDetector>

      {/* On-screen Directional Controls & Actions */}
      <View style={styles.controlsSection}>
        <View style={styles.dpad}>
          <TouchableOpacity
            style={styles.dpadButton}
            onPress={() => makeMove('U')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-up" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.dpadHorizontal}>
            <TouchableOpacity
              style={styles.dpadButton}
              onPress={() => makeMove('L')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.dpadCenter} />
            <TouchableOpacity
              style={styles.dpadButton}
              onPress={() => makeMove('R')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.dpadButton}
            onPress={() => makeMove('D')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-down" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => {
              setGameState(create2048Game(session.seed));
              setMovesLog('');
              onScoreChange(0);
            }}
          >
            <Ionicons name="refresh" size={16} color={colors.textMuted} />
            <Text style={styles.btnSecondaryText}>Restart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => handleFinish(gameState.score, movesLog)}
          >
            <Ionicons name="flag" size={16} color="#051A10" />
            <Text style={styles.btnPrimaryText}>End & Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  board: {
    backgroundColor: '#071A12',
    borderRadius: radii.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#133E2B',
  },
  gridCell: {
    backgroundColor: '#0D291D',
    borderRadius: radii.md,
  },
  tileContainer: {
    position: 'absolute',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontWeight: '900',
    fontFamily: typography.fonts.heading,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 26, 16, 0.85)',
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    fontFamily: typography.fonts.heading,
  },
  overlaySubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  controlsSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  dpad: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dpadHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dpadButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0E2A1F',
    borderWidth: 1,
    borderColor: '#1D4D38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadCenter: {
    width: 46,
    height: 46,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  btnSecondary: {
    backgroundColor: '#0E2A1F',
    borderWidth: 1,
    borderColor: '#1D4D38',
  },
  btnSecondaryText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: '#051A10',
    fontSize: 14,
    fontWeight: '700',
  },
});
