import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '@/theme';
import { GameProps } from '../types';
import {
  getReactionDelays,
  REACTION_ROUNDS_COUNT,
  ReactionRound,
} from '@shared/engines';
import { haptics } from '@/lib/haptics';
import { soundManager } from '@/lib/audio';

type PadState = 'ready' | 'wait' | 'go' | 'result-flash' | 'false-start';

export function TapReaction({
  session,
  paused,
  onScoreChange,
  onFinish,
}: GameProps) {
  const [delays] = useState<number[]>(() => getReactionDelays(session.seed));
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [padState, setPadState] = useState<PadState>('ready');
  const [roundsResults, setRoundsResults] = useState<ReactionRound[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);

  const goTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameStartRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);

  const clearWaitTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRound = useCallback(
    (roundIndex: number) => {
      if (gameStartRef.current === 0) {
        gameStartRef.current = Date.now();
      }
      clearWaitTimer();
      setPadState('wait');
      setLastMs(null);

      const delay = delays[roundIndex] || 2500;
      timerRef.current = setTimeout(() => {
        requestAnimationFrame(() => {
          goTimeRef.current = performance.now();
          setPadState('go');
          soundManager.playSound('tap');
        });
      }, delay);
    },
    [delays]
  );

  useEffect(() => {
    return () => {
      clearWaitTimer();
    };
  }, []);

  const handleFinishGame = useCallback(
    (finalRounds: ReactionRound[]) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      clearWaitTimer();

      const totalPlayDurationMs = Math.max(
        Date.now() - gameStartRef.current,
        delays.reduce((a, b) => a + b, 0) + 1000
      );

      onFinish({ rounds: finalRounds }, totalPlayDurationMs);
    },
    [delays, onFinish]
  );

  const handlePadPressIn = useCallback(() => {
    if (paused || finishedRef.current) return;

    if (padState === 'ready') {
      gameStartRef.current = Date.now();
      startRound(0);
      return;
    }

    if (padState === 'wait') {
      // FALSE START!
      clearWaitTimer();
      setPadState('false-start');
      haptics.notification('error');
      soundManager.playSound('error');

      const updated = [...roundsResults, { ms: null }];
      setRoundsResults(updated);

      setTimeout(() => {
        const nextRound = currentRound + 1;
        if (nextRound >= REACTION_ROUNDS_COUNT) {
          handleFinishGame(updated);
        } else {
          setCurrentRound(nextRound);
          startRound(nextRound);
        }
      }, 1200);
      return;
    }

    if (padState === 'go') {
      // VALID REACTION TAP!
      const pressTime = performance.now();
      const reactionMs = Math.max(80, Math.round(pressTime - goTimeRef.current));
      setLastMs(reactionMs);
      setPadState('result-flash');
      haptics.impact('medium');
      soundManager.playSound('match');

      const updated = [...roundsResults, { ms: reactionMs }];
      setRoundsResults(updated);

      // Score calculation
      const totalScore = updated.reduce(
        (acc, r) => acc + (r.ms === null ? 0 : Math.max(0, 1000 - r.ms)),
        0
      );
      onScoreChange(totalScore);

      setTimeout(() => {
        const nextRound = currentRound + 1;
        if (nextRound >= REACTION_ROUNDS_COUNT) {
          handleFinishGame(updated);
        } else {
          setCurrentRound(nextRound);
          startRound(nextRound);
        }
      }, 1200);
    }
  }, [
    paused,
    padState,
    currentRound,
    roundsResults,
    startRound,
    handleFinishGame,
    onScoreChange,
  ]);

  const getPadTheme = () => {
    switch (padState) {
      case 'ready':
        return {
          bg: '#0E2A1F',
          border: '#1D4D38',
          title: 'Tap to Start',
          subtitle: '5 reaction rounds. Tap as soon as green appears!',
          icon: 'play' as keyof typeof Ionicons.glyphMap,
          iconColor: colors.primary,
        };
      case 'wait':
        return {
          bg: '#2A0E14',
          border: '#4D1D27',
          title: 'WAIT...',
          subtitle: 'Do not tap yet!',
          icon: 'alert-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: '#FF5252',
        };
      case 'go':
        return {
          bg: '#00E676',
          border: '#69F0AE',
          title: 'TAP NOW!',
          subtitle: 'Fast as light!',
          icon: 'flash' as keyof typeof Ionicons.glyphMap,
          iconColor: '#051A10',
        };
      case 'result-flash':
        return {
          bg: '#0A2E20',
          border: '#00D084',
          title: `${lastMs} ms`,
          subtitle: lastMs && lastMs < 200 ? '⚡ Lightning Fast!' : lastMs && lastMs < 300 ? '🔥 Great Reflex!' : '👍 Good job!',
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: '#00D084',
        };
      case 'false-start':
        return {
          bg: '#330D14',
          border: '#FF5252',
          title: 'TOO EARLY!',
          subtitle: 'Tapped before green. 0 points for this round.',
          icon: 'alert-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: '#FF5252',
        };
    }
  };

  const padTheme = getPadTheme();

  return (
    <View style={styles.container}>
      {/* 5-Round Progress Dots */}
      <View style={styles.roundsIndicator}>
        {Array.from({ length: REACTION_ROUNDS_COUNT }).map((_, idx) => {
          const res = roundsResults[idx];
          const isCurrent = idx === currentRound && padState !== 'ready';
          return (
            <View
              key={`dot-${idx}`}
              style={[
                styles.roundDot,
                isCurrent && styles.roundDotCurrent,
                res?.ms !== undefined && res.ms !== null && styles.roundDotSuccess,
                res?.ms === null && styles.roundDotFailed,
              ]}
            >
              <Text style={styles.roundDotText}>
                {res ? (res.ms !== null ? `${res.ms}` : '0') : `R${idx + 1}`}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Big Responsive Interactive Pad */}
      <Pressable
        testID="reaction-pad"
        onPressIn={handlePadPressIn}
        onPress={handlePadPressIn}
        // @ts-ignore - Web pointer events support
        onPointerDown={(e: any) => {
          e?.preventDefault?.();
          handlePadPressIn();
        }}
        style={[
          styles.pad,
          {
            backgroundColor: padTheme.bg,
            borderColor: padTheme.border,
          },
        ]}
      >
        <Ionicons
          name={padTheme.icon}
          size={56}
          color={padTheme.iconColor}
          style={styles.padIcon}
        />
        <Text
          style={[
            styles.padTitle,
            padState === 'go' && { color: '#051A10' },
          ]}
        >
          {padTheme.title}
        </Text>
        <Text
          style={[
            styles.padSubtitle,
            padState === 'go' && { color: '#0A2E20' },
          ]}
        >
          {padTheme.subtitle}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    width: '100%',
    userSelect: 'none' as any,
    touchAction: 'manipulation' as any,
  },
  roundsIndicator: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  roundDot: {
    width: 60,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: '#0E2A1F',
    borderWidth: 1,
    borderColor: '#1D4D38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundDotCurrent: {
    borderColor: colors.primary,
    backgroundColor: '#164E33',
  },
  roundDotSuccess: {
    backgroundColor: '#00331A',
    borderColor: '#00E676',
  },
  roundDotFailed: {
    backgroundColor: '#330D14',
    borderColor: '#FF5252',
  },
  roundDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  pad: {
    width: '90%',
    aspectRatio: 1,
    maxHeight: 360,
    borderRadius: radii.xxl,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    userSelect: 'none' as any,
    touchAction: 'manipulation' as any,
    cursor: 'pointer' as any,
  },
  padIcon: {
    marginBottom: spacing.md,
  },
  padTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text,
    fontFamily: typography.fonts.heading,
    textAlign: 'center',
  },
  padSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
