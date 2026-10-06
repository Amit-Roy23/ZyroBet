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
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/theme';
import { GameProps } from '../types';
import {
  createMemoryMatchGame,
  MemoryGameState,
  MemoryFlip,
  MemoryDifficulty,
} from '@shared/engines';
import { haptics } from '@/lib/haptics';
import { soundManager } from '@/lib/audio';

const SYMBOL_ICONS: { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }[] = [
  { icon: 'flash', color: '#FFD700', bg: '#332900' },
  { icon: 'flame', color: '#FF5722', bg: '#331206' },
  { icon: 'star', color: '#00D084', bg: '#002B1B' },
  { icon: 'heart', color: '#FF4081', bg: '#330D1A' },
  { icon: 'shield', color: '#00E5FF', bg: '#002E33' },
  { icon: 'trophy', color: '#FFA000', bg: '#332000' },
  { icon: 'moon', color: '#B388FF', bg: '#241B33' },
  { icon: 'sunny', color: '#FFEB3B', bg: '#332F00' },
  { icon: 'eye', color: '#69F0AE', bg: '#153023' },
  { icon: 'ribbon', color: '#E040FB', bg: '#2D0D33' },
];

function CardItem({
  symbolId,
  isFlipped,
  isMatched,
  isMismatch,
  onPress,
  width,
  height,
}: {
  symbolId: number;
  isFlipped: boolean;
  isMatched: boolean;
  isMismatch: boolean;
  onPress: () => void;
  width: number;
  height: number;
}) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withTiming(isFlipped || isMatched ? 180 : 0, {
      duration: 250,
    });
  }, [isFlipped, isMatched, rotation]);

  useEffect(() => {
    if (isMatched) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 10 }),
        withSpring(1, { damping: 12 })
      );
    } else if (isMismatch) {
      scale.value = withSequence(
        withTiming(0.95, { duration: 60 }),
        withTiming(1.05, { duration: 60 }),
        withTiming(1, { duration: 60 })
      );
    }
  }, [isMatched, isMismatch, scale]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }, { scale: scale.value }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotation.value + 180}deg` },
      { scale: scale.value },
    ],
    backfaceVisibility: 'hidden',
  }));

  const sym = SYMBOL_ICONS[symbolId % SYMBOL_ICONS.length];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isFlipped || isMatched}
      style={[styles.cardWrapper, { width, height }]}
    >
      {/* Front Face (Hidden Card Back) */}
      <Animated.View style={[styles.cardFace, styles.cardBack, frontStyle]}>
        <View style={styles.cardPattern}>
          <Text style={styles.cardLogo}>?</Text>
        </View>
      </Animated.View>

      {/* Back Face (Revealed Symbol) */}
      <Animated.View
        style={[
          styles.cardFace,
          styles.cardFront,
          {
            backgroundColor: isMatched ? '#00331A' : sym.bg,
            borderColor: isMatched ? '#00E676' : isMismatch ? '#FF5252' : sym.color,
          },
          backStyle,
        ]}
      >
        <Ionicons name={sym.icon} size={Math.min(width * 0.45, 36)} color={sym.color} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function MemoryMatch({
  session,
  paused,
  onScoreChange,
  onFinish,
}: GameProps) {
  const { width } = useWindowDimensions();
  const difficulty = (session.difficulty as MemoryDifficulty) || 'medium';

  const [gameState] = useState<MemoryGameState>(() =>
    createMemoryMatchGame(session.seed, difficulty)
  );

  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedSet, setMatchedSet] = useState<Set<number>>(new Set());
  const [mismatchIndices, setMismatchIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [flipsLog, setFlipsLog] = useState<MemoryFlip[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);

  const isLockRef = useRef(false);
  const finishedRef = useRef(false);

  // Responsive grid calculation
  const gridWidth = Math.min(width - 32, 380);
  const gap = 8;
  const cardWidth = (gridWidth - gap * (gameState.cols + 1)) / gameState.cols;
  const cardHeight = cardWidth * 1.25;

  const handleCardPress = useCallback(
    (index: number) => {
      if (paused || isLockRef.current || finishedRef.current) return;
      if (flippedIndices.includes(index) || matchedSet.has(index)) return;

      const now = Date.now();
      let gameStartTime = startTime;
      if (!gameStartTime) {
        gameStartTime = now;
        setStartTime(now);
      }

      const t = Math.max(150, now - gameStartTime);
      const newFlipsLog = [...flipsLog, { i: index, t }];
      setFlipsLog(newFlipsLog);

      soundManager.playSound('flip');
      haptics.impact('light');

      if (flippedIndices.length === 0) {
        setFlippedIndices([index]);
      } else if (flippedIndices.length === 1) {
        const firstIndex = flippedIndices[0];
        setFlippedIndices([firstIndex, index]);
        setMoves((m) => m + 1);

        const card1 = gameState.cards[firstIndex];
        const card2 = gameState.cards[index];

        if (card1.symbolId === card2.symbolId) {
          // MATCH!
          soundManager.playSound('match');
          haptics.notification('success');

          const newMatched = new Set(matchedSet);
          newMatched.add(firstIndex);
          newMatched.add(index);
          setMatchedSet(newMatched);
          setFlippedIndices([]);

          // Score estimation
          const pairs = newMatched.size / 2;
          const currentScore = Math.round(pairs * 100 * (difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1));
          onScoreChange(currentScore);

          if (newMatched.size === gameState.cards.length) {
            // Finished!
            finishedRef.current = true;
            setTimeout(() => {
              const durationMs = Math.max(t, 2000);
              onFinish({ flips: newFlipsLog }, durationMs);
            }, 600);
          }
        } else {
          // MISMATCH!
          isLockRef.current = true;
          setMismatchIndices([firstIndex, index]);
          haptics.notification('error');

          setTimeout(() => {
            setFlippedIndices([]);
            setMismatchIndices([]);
            isLockRef.current = false;
          }, 700);
        }
      }
    },
    [
      paused,
      flippedIndices,
      matchedSet,
      startTime,
      flipsLog,
      gameState.cards,
      difficulty,
      onScoreChange,
      onFinish,
    ]
  );

  return (
    <View style={styles.container}>
      {/* HUD Info */}
      <View style={styles.hudContainer}>
        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Pairs</Text>
          <Text style={styles.hudValue}>
            {matchedSet.size / 2} / {gameState.pairsCount}
          </Text>
        </View>

        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Moves</Text>
          <Text style={styles.hudValue}>{moves}</Text>
        </View>

        <View style={styles.hudChip}>
          <Text style={styles.hudLabel}>Mode</Text>
          <Text style={[styles.hudValue, { textTransform: 'capitalize' }]}>
            {difficulty}
          </Text>
        </View>
      </View>

      {/* Responsive Card Grid */}
      <View
        style={[
          styles.grid,
          {
            width: gridWidth,
            gap,
            padding: gap,
          },
        ]}
      >
        {gameState.cards.map((card) => {
          const isFlipped = flippedIndices.includes(card.id);
          const isMatched = matchedSet.has(card.id);
          const isMismatch = mismatchIndices.includes(card.id);

          return (
            <CardItem
              key={card.id}
              symbolId={card.symbolId}
              isFlipped={isFlipped}
              isMatched={isMatched}
              isMismatch={isMismatch}
              onPress={() => handleCardPress(card.id)}
              width={cardWidth}
              height={cardHeight}
            />
          );
        })}
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
    userSelect: 'none' as any,
    touchAction: 'manipulation' as any,
  },
  hudContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  hudChip: {
    backgroundColor: '#0E2A1F',
    borderWidth: 1,
    borderColor: '#1D4D38',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  hudLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  hudValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: typography.fonts.heading,
  },
  grid: {
    backgroundColor: '#071A12',
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: '#133E2B',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'relative',
    userSelect: 'none' as any,
    touchAction: 'manipulation' as any,
    cursor: 'pointer' as any,
  },
  cardFace: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  cardBack: {
    backgroundColor: '#0E2A1F',
    borderColor: '#1D4D38',
  },
  cardPattern: {
    width: '70%',
    height: '70%',
    borderRadius: radii.sm,
    backgroundColor: '#0A2017',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#173D2C',
  },
  cardLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryMuted,
  },
  cardFront: {
    backgroundColor: '#051A10',
  },
});
